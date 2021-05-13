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
 * An option for an application command or subcommand.
 * @typedef {Object} ApplicationCommandOption
 * @property {ApplicationCommandOptionType} type The type of the option
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
 * The object returned when fetching permissions for an application command.
 * @typedef {Object} ApplicationCommandPermissionData
 * @property {String} id The ID of the role or user
 * @property {ApplicationCommandPermissionType|number} type Whether this permission is for a role or a user
 * @property {boolean} permission Whether the role or user has the permission to use this command
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

/**
 * @typedef {'SUB_COMMAND' | 'SUB_COMMAND_GROUP' | 'STRING' | 'INTEGER' | 'BOOLEAN' | 'USER' | 'CHANNEL' | 'ROLE' | 'MENTIONABLE'} ApplicationCommandOptionType
 * @typedef {'ROLE' | 'USER'} ApplicationCommandPermissionType
 */

/**
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 * @typedef {import('discord.js').CommandInteractionOption} CommandInteractionOption
 */

module.exports = class SlashCommand {
	/** @param {SlashCommandData} data */
	constructor(data) {
		this.name = data.name;
		this.description = data.description;
		this.options = data.options;
		this.permissions = data.permissions;
		this.defaultPermission = typeof data.defaultPermission === 'boolean' ? data.defaultPermission : true;
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
};