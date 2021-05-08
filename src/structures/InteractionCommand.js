/**
 * Data for creating or editing an application command.
 * @typedef {Object} ApplicationCommandData
 * @property {string} name The name of the command
 * @property {string} description The description of the command
 * @property {ApplicationCommandOptionData[]} [options] Options for the command
 * @property {InteractionCommandPermissionData} [permissions] The permissions for this command
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
 * The object returned when fetching permissions for an application command.
 * @typedef {Object} ApplicationCommandPermissionData
 * @property {String} id The ID of the role or user
 * @property {ApplicationCommandPermissionType|number} type Whether this permission is for a role or a user
 * @property {boolean} permission Whether the role or user has the permission to use this command
 */

/**
 * @typedef {'SUB_COMMAND' | 'SUB_COMMAND_GROUP' | 'STRING' | 'INTEGER' | 'BOOLEAN' | 'USER' | 'CHANNEL' | 'ROLE' | 'MENTIONABLE'} ApplicationCommandOptionType
 * @typedef {'ROLE' | 'USER'} ApplicationCommandPermissionType
 */

/**
 * @typedef {Object} InteractionCommandPermissionData
 * @property {InteractionCommandPermissionDataContent} [users] Sets the permission of users for this command.
 * @property {InteractionCommandPermissionDataContent} [roles] Sets the permission of roles for this command.
 */

/**
 * @typedef {Object} InteractionCommandPermissionDataContent
 * @property {String[]} [allow] An array of ids allowed to use this command.
 * @property {String[]} [deny] An array of ids denied to use this command.
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
		this.permissions = data.permissions;
		this.defaultPermission = data.defaultPermission;
	}

	/**
     * @param {CommandInteraction} interaction
     * @param {Object} options
    */
	exec(interaction, options) {
		console.log({
			interaction,
			options,
		});
	}

	transformPermissions() {
		/** @type {ApplicationCommandPermissionData[]} */
		const permissions = new Array();
		if (this.permissions) {
			if (this.permissions.roles) {
				if (this.permissions.roles.allow) {
					for (const role of this.permissions.roles.allow) {
						permissions.push({
							id: role,
							permission: true,
							type: 'ROLE',
						});
					}
				}
				if (this.permissions.roles.deny) {
					for (const role of this.permissions.roles.deny) {
						permissions.push({
							id: role,
							permission: false,
							type: 'ROLE',
						});
					}
				}
			}
			if (this.permissions.users) {
				if (this.permissions.users.allow) {
					for (const user of this.permissions.users.allow) {
						permissions.push({
							id: user,
							permission: true,
							type: 'USER',
						});
					}
				}
				if (this.permissions.users.deny) {
					for (const user of this.permissions.users.deny) {
						permissions.push({
							id: user,
							permission: false,
							type: 'USER',
						});
					}
				}
			}
		}
		return permissions;
	}
};