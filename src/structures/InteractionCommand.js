/**
 * Data for creating or editing an application command.
 * @typedef {Object} ApplicationCommandData
 * @property {string} name The name of the command
 * @property {string} description The description of the command
 * @property {ApplicationCommandOptionData[]} [options] Options for the command
 * @property {boolean} [defaultPermission] Whether the command is enabled by default when the app is added to a guild
 */

/**
 * An option for an application command or subcommand.
 * @typedef {Object} ApplicationCommandOptionData
 * @property {ApplicationCommandOptionType|number} type The type of the option
 * @property {string} name The name of the option
 * @property {string} description The description of the option
 * @property {boolean} [required] Whether the option is required
 * @property {ApplicationCommandOptionChoice[]} [choices] The choices of the option for the user to pick from
 * @property {ApplicationCommandOptionData[]} [options] Additional options if this option is a subcommand (group)
 */

/**
 * A choice for an application command option.
 * @typedef {Object} ApplicationCommandOptionChoice
 * @property {string} name The name of the choice
 * @property {string|number} value The value of the choice
 */

/**
 * @typedef {'SUB_COMMAND' | 'SUB_COMMAND_GROUP' | 'STRING' | 'INTEGER' | 'BOOLEAN' | 'USER' | 'CHANNEL' | 'ROLE' | 'MENTIONABLE'} ApplicationCommandOptionType
 */

/**
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 * @typedef {import('discord.js').CommandInteractionOption} CommandInteractionOption
 */

module.exports = class InteractionCommand {
	/** @param {ApplicationCommandData} data */
	constructor(data) {
		this.name = data.name;
		this.description = data.description;
		this.options = data.options;
		this.defaultPermission = data.defaultPermission;
	}

	/**
     * @param {CommandInteraction} interaction
     * @param {CommandInteractionOption[]} options
    */
	exec(interaction, options) {
		console.log({
			interaction,
			options,
		});
	}
};