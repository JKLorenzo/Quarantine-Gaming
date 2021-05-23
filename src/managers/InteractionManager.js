import path from 'path';
import { dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { ProcessQueue, ErrorTicketManager, getAllFiles, sleep, constants } from '../utils/Base.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 * @typedef {import('discord.js').CommandInteractionOption} CommandInteractionOption
 * @typedef {import('../structures/Base').Client} Client
 * @typedef {import('../structures/Base').SlashCommand} SlashCommand
 */

const ETM = new ErrorTicketManager('Interaction Manager');
const initQueuer = new ProcessQueue(1000);

export default class InteractionManager {
	/** @param {Client} client */
	constructor(client) {
		this.client = client;

		/**
         * @private
         * @type {SlashCommand[]}
         */
		this.slash_commands = new Array();

		this.client.on('interaction', interaction => {
			if (interaction.isCommand()) return this.processSlashCommand(interaction);
		});
	}

	async init() {
		try {
			this.slash_commands = new Array();

			const slash_commands_dir = path.join(__dirname, '../commands/slash');
			for (const slash_command_path of getAllFiles(slash_commands_dir)) {
				const slash_command_class = await import(pathToFileURL(slash_command_path));
				/** @type {SlashCommand} */
				const slash_command = new slash_command_class.default();
				this.slash_commands.push(await slash_command.init(this.client));
			}

			const existingApplicationCommands = await this.client.guild.commands.fetch().then(application_commands => application_commands.array());
			const existingApplicationCommandPermissions = await this.client.guild.commands.fetchPermissions();
			const ApplicationCommandData = this.slash_commands.map(slash_command => slash_command.getApplicationCommandData());

			// Delete commands
			for (const this_application_command of existingApplicationCommands) {
				const this_application_command_data = ApplicationCommandData.find(application_command_data => application_command_data.name == this_application_command.name);
				if (this_application_command_data) continue;
				initQueuer.queue(async () => {
					console.log(`InteractionManager: Deleting ${this_application_command.name}`);
					try {
						await this_application_command.delete();
					} catch (error) {
						this.client.error_manager.mark(ETM.create('delete', error, 'init'));
					} finally {
						console.log(`InteractionManager: Deleted ${this_application_command.name}`);
					}
				});
			}

			// Create commands
			for (const this_application_command_data of ApplicationCommandData) {
				const this_application_command = existingApplicationCommands.some(application_command => application_command.name == this_application_command_data.name);
				if (this_application_command) continue;
				initQueuer.queue(async () => {
					console.log(`InteractionManager: Creating ${this_application_command_data.name}`);
					try {
						await this.client.guild.commands.create(this_application_command_data);
					} catch (error) {
						this.client.error_manager.mark(ETM.create('create', error, 'init'));
					} finally {
						console.log(`InteractionManager: Created ${this_application_command_data.name}`);
					}
				});
			}

			// Update commands
			for (const this_slash_command of this.slash_commands) {
				const this_application_command = this.client.guild.commands.cache.find(application_command => application_command.name == this_slash_command.name);
				if (!this_application_command) continue;
				const sameDescription = this_application_command.description === this_slash_command.description;
				const sameOptions = JSON.stringify(this_application_command.options) === JSON.stringify(this_slash_command.getApplicationCommandOptions());
				const sameDefaultPermissions = this_application_command.defaultPermission === this_slash_command.defaultPermission;
				if (sameDescription && sameOptions && sameDefaultPermissions) continue;
				initQueuer.queue(async () => {
					console.log(`InteractionManager: Updating ${this_application_command.name}`);
					try {
						await this.client.guild.commands.edit(this_application_command, this_slash_command.getApplicationCommandData());
					} catch (error) {
						this.client.error_manager.mark(ETM.create('update', error, 'init'));
					} finally {
						console.log(`InteractionManager: Updated ${this_application_command.name}`);
					}
				});
			}

			// Wait for the above methods to finish
			await initQueuer.queue(async () => await sleep(1000));

			// Update command permissions
			for (const this_slash_command of this.slash_commands) {
				const this_application_command = this.client.guild.commands.cache.find(application_command => application_command.name == this_slash_command.name);
				if (!this_application_command) continue;
				const this_application_command_permissions = existingApplicationCommandPermissions.get(this_application_command.id);
				const this_slash_command_permissions = this_slash_command.getApplicationCommandPermissionData();
				const samePermissions = JSON.stringify(this_application_command_permissions) === JSON.stringify(this_slash_command_permissions);
				if (samePermissions) continue;
				initQueuer.queue(async () => {
					console.log(`InteractionManager: Permission Updating ${this_application_command.name}`);
					try {
						await this_application_command.setPermissions(this_slash_command.getApplicationCommandPermissionData());
					} catch (error) {
						this.client.error_manager.mark(ETM.create('permission', error, 'init'));
					} finally {
						console.log(`InteractionManager: Permission Updated ${this_application_command.name}`);
					}
				});
			}
		} catch (error) {
			this.client.error_manager.mark(ETM.create('init', error));
		}
	}

	/**
     * @private
     * @param {CommandInteraction} commandInteraction
     */
	async processSlashCommand(commandInteraction) {
		try {
			const slash_command = this.slash_commands.find(this_slash_command => this_slash_command.name == commandInteraction.commandName);
			if (slash_command) {
				await slash_command.exec(commandInteraction, this.transformSlashCommandOptions(commandInteraction.options));
				this.client.message_manager.sendToChannel(constants.interface.channels.logs, {
					content: `${commandInteraction.user} executed the \`${commandInteraction.commandName}\` command on **${commandInteraction.channel}** channel.`,
					allowedMentions: {
						parse: [],
					},
				}).catch(e => void e);
			} else {
				throw new ReferenceError('Interaction command does not exist.');
			}
		} catch (error) {
			const message = 'It looks like this command has failed.';
			commandInteraction.deferred || commandInteraction.replied ? commandInteraction.editReply(message) : commandInteraction.reply(message);
			this.client.error_manager.mark(ETM.create(commandInteraction.commandName, error, 'processSlashCommand'));
		}
	}

	/**
	 * @private
	 * @param {CommandInteractionOption[]} options
	 * @param {Object} [arguments]
	 * @returns {Object}
	 */
	transformSlashCommandOptions(options, args = {}) {
		try {
			if (options && Array.isArray(options)) {
				for (const option of options) {
					if (option.options) {
						if (option.type) {
							args[option.name] = this.transformSlashCommandOptions(option.options, { option: option.name });
						} else {
							args = this.transformSlashCommandOptions(option.options);
						}
					} else if (option.channel || option.member || option.role || option.user) {
						args[option.name] = option.channel ?? option.member ?? option.role ?? option.user;
					} else {
						args[option.name] = option.value;
					}
				}
			}
			return args;
		} catch (error) {
			this.client.error_manager.mark(ETM.create('transformSlashCommandOptions', error));
		}
	}
}