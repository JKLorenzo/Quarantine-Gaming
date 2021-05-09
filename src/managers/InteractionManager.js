const path = require('path');
const { ErrorTicketManager, getAllFiles } = require('../utils/Base.js');

const ETM = new ErrorTicketManager('Interaction Manager');

/**
 * @typedef {import('../structures/Base.js').Client} Client
 * @typedef {import('../structures/Base.js').SlashCommand} SlashCommand
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 * @typedef {import('discord.js').CommandInteractionOption} CommandInteractionOption
 */

module.exports = class InteractionManager {
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

	/**
	 * Loads all the slash commands.
	 */
	async loadAll() {
		try {
			this.slash_commands = new Array();

			const slashcommands_dir = path.join(__dirname, '../commands/slash');
			for (const slashcommand_path of getAllFiles(slashcommands_dir)) {
				const slashcommand_class = require(slashcommand_path);
				/** @type {SlashCommand} */
				const slash_command = new slashcommand_class();
				this.slash_commands.push(slash_command);
			}

			const ApplicationCommandData = this.slash_commands.map(slash_command => slash_command.getApplicationCommandData());
			const ApplicationCommands = await this.client.guild.commands.set(ApplicationCommandData).then(application_commands => application_commands.array());

			for (const slash_command of this.slash_commands) {
				if (!slash_command.permissions) continue;
				const application_command = ApplicationCommands.find(this_application_command => this_application_command.name == slash_command.name);
				if (application_command) await application_command.setPermissions(slash_command.transformPermissions());
			}
		}
		catch (error) {
			this.client.error_manager.mark(ETM.create('loadAll', error));
		}
	}

	/**
     * @private
     * @param {CommandInteraction} commandInteraction
     */
	processSlashCommand(commandInteraction) {
		try {
			const slash_command = this.slash_commands.find(this_slash_command => this_slash_command.name == commandInteraction.commandName);
			if (slash_command) slash_command.exec(commandInteraction, this.transformSlashCommandOptions(commandInteraction.options));
		}
		catch (error) {
			this.client.error_manager.mark(ETM.create('processCommand', error));
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
						if(option.type) {
							args[option.name] = this.transformSlashCommandOptions(option.options, { option: option.name });
						}
						else {
							args = this.transformSlashCommandOptions(option.options);
						}
					}
					else if (typeof option.value !== 'undefined') {
						args[option.name] = option.value;
					}
					else {
						args[option.name] = option.channel || option.member || option.role || option.user;
					}
				}
			}
			return args;
		}
		catch (error) {
			this.client.error_manager.mark(ETM.create('transformCommandOptions', error));
		}
	}
};