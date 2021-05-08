const fs = require('fs');
const path = require('path');
const { ErrorTicketManager, getAllFiles } = require('../utils/Base.js');

const ETM = new ErrorTicketManager('Interaction Manager');

/**
 * @typedef {import('../structures/Base.js').Client} Client
 * @typedef {import('../structures/Base.js').InteractionCommand} InteractionCommand
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 */

module.exports = class InteractionManager {
	/** @param {Client} client */
	constructor(client) {
		this.client = client;

		/**
         * @private
         * @type {InteractionCommand[]}
         */
		this.interaction_commands = new Array();

		this.client.on('interaction', interaction => {
			if (interaction.isCommand()) this.processCommand(interaction);
		});
	}

	async loadAll() {
		try {
			const slashcommands_dir = path.join(__dirname, '../commands/slash');
			if (fs.existsSync(slashcommands_dir)) {
				this.interaction_commands = new Array();
				for (const slashcommand_path of getAllFiles(slashcommands_dir)) {
					const slashcommand_class = require(slashcommand_path);
					/** @type {InteractionCommand} */
					const this_slashcommand = new slashcommand_class();
					this.interaction_commands.push(this_slashcommand);
				}

				const commands = this.interaction_commands.map(interaction => {
					const ApplicationCommandData = {
						name: interaction.name,
						description: interaction.description,
						options: interaction.options,
						defaultPermission: interaction.defaultPermission,
					};
					return ApplicationCommandData;
				});

				await this.client.guild.commands.set(commands);
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
	processCommand(commandInteraction) {
		/** @type {InteractionCommand} */
		const this_interaction = this.interaction_commands.find(interaction => interaction.name == commandInteraction.commandName);
		if (this_interaction) {
			try{
				this_interaction.exec(commandInteraction, commandInteraction.options);
			}
			catch (error) {
				this.client.error_manager.mark(ETM.create('processCommand', error));
			}
		}
	}
};