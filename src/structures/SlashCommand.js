/**
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 * @typedef {import('discord.js').ApplicationCommandData} ApplicationCommandData
 * @typedef {import('discord.js').ApplicationCommandOption} ApplicationCommandOption
 * @typedef {import('discord.js').ApplicationCommandOptionChoice} ApplicationCommandOptionChoice
 * @typedef {import('discord.js').ApplicationCommandPermissionData} ApplicationCommandPermissionData
 * @typedef {import('../structures/Base.js').Client} Client
 */

/**
 * Data for creating or editing a slash command.
 * @typedef {Object} SlashCommandData
 * @property {string} name The name of the command
 * @property {string} description The description of the command
 * @property {ApplicationCommandOptionData[]} [options] Options for the command
 * @property {SlashCommandPermissionData} [permissions] The permissions for this command
 * @property {boolean} [defaultPermission] Whether the command is enabled by default when the app is added to a guild
 */

/**
 * An option for an application command or subcommand.
 * @typedef {Object} ApplicationCommandOptionData
 * @property {ApplicationCommandOptionType} type The type of the option
 * @property {String} name The name of the option
 * @property {String} description The description of the option
 * @property {boolean} required Whether the option is required
 * @property {ApplicationCommandOptionChoice[]} choices The choices of the option for the user to pick from
 * @property {ApplicationCommandOptionData[]} options Additional options if this option is a subcommand (group)
 */

/**
 * The type of an ApplicationCommandOption object
 * @typedef {'SUB_COMMAND' | 'SUB_COMMAND_GROUP' | 'STRING' | 'INTEGER' | 'BOOLEAN' | 'USER' | 'CHANNEL' | 'ROLE' | 'MENTIONABLE'} ApplicationCommandOptionType
 */

/**
 * @typedef {Object} SlashCommandPermissionData
 * @property {SlashCommandPermissionDataContent} [users] Sets the permission of users for this command.
 * @property {SlashCommandPermissionDataContent} [roles] Sets the permission of roles for this command.
 */

/**
 * @typedef {Object} SlashCommandPermissionDataContent
 * @property {String[]} [allow] An array of ids allowed to use this command.
 * @property {String[]} [deny] An array of ids denied to use this command.
 */

export default class SlashCommand {
	/** @param {SlashCommandData} data */
	constructor(data) {
		this.name = data.name;
		this.description = data.description;
		this.options = data.options;
		this.permissions = data.permissions;
		this.defaultPermission = typeof data.defaultPermission === 'boolean' ? data.defaultPermission : true;
	}

	/**
	 * Initializes this slash command.
	 * @param {Client} client
	 */
	init(client) {
		this.client = client;
		return this;
	}

	/**
	 * @param {CommandInteraction} interaction
	 * @param {Object} options
	*/
	exec(interaction, options) {
		console.log({ interaction, options });
	}

	/**
	 * Gets the ApplicationCommandData of this slash command.
	 * @returns {ApplicationCommandData}
	 */
	getApplicationCommandData() {
		return {
			name: this.name,
			description: this.description,
			options: this.options,
			defaultPermission: this.defaultPermission,
		};
	}

	/**
	 * Gets the array of ApplicationCommandOption of this slash command.
	 * @param {ApplicationCommandOptionData[]} [options]
	 * @returns {ApplicationCommandOption[]}
	 */
	getApplicationCommandOptions(options = this.options) {
		if (!options && !Array.isArray(options)) return [];
		return options.map(option => {
			return {
				type: option.type,
				name: option.name,
				description: option.description,
				required: option.required,
				choices: option.choices,
				options: option.options ? this.getApplicationCommandOptions(option.options) : undefined,
			};
		});
	}

	/**
	 * Gets the array of ApplicationCommandPermissionData of this slash command.
	 * @returns {ApplicationCommandPermissionData[]}
	 */
	getApplicationCommandPermissionData() {
		/** @type {ApplicationCommandPermissionData[]} */
		const permissions = new Array();
		if (this.permissions) {
			if (this.permissions.roles) {
				if (this.permissions.roles.allow) this.permissions.roles.allow.forEach(id => permissions.push({ id: id, permission: true, type: 'ROLE' }));
				if (this.permissions.roles.deny) this.permissions.roles.deny.forEach(id => permissions.push({ id: id, permission: false, type: 'ROLE' }));
			}
			if (this.permissions.users) {
				if (this.permissions.users.allow) this.permissions.users.allow.forEach(id => permissions.push({ id: id, permission: true, type: 'USER' }));
				if (this.permissions.users.deny) this.permissions.users.deny.forEach(id => permissions.push({ id: id, permission: false, type: 'USER' }));
			}
		}
		return permissions.length ? permissions : undefined;
	}
}