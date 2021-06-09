/**
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 * @typedef {import('discord.js').ApplicationCommandData} ApplicationCommandData
 * @typedef {import('discord.js').ApplicationCommandOption} ApplicationCommandOption
 * @typedef {import('discord.js').ApplicationCommandOptionChoice} ApplicationCommandOptionChoice
 * @typedef {import('discord.js').ApplicationCommandPermissionData} ApplicationCommandPermissionData
 * @typedef {import('../structures/Base.js').Client} Client
 */

/**
 * @typedef {Object} SlashCommandData
 * @property {string} name
 * @property {string} description
 * @property {ApplicationCommandOptionData[]} [options]
 * @property {SlashCommandPermissionData} [permissions]
 * @property {boolean} [defaultPermission]
 */

/**
 * @typedef {Object} ApplicationCommandOptionData
 * @property {ApplicationCommandOptionType} type
 * @property {String} name
 * @property {String} description
 * @property {boolean} required
 * @property {ApplicationCommandOptionChoice[]} choices
 * @property {ApplicationCommandOptionData[]} options
 */

/**
 * @typedef {'SUB_COMMAND'
 *  | 'SUB_COMMAND_GROUP'
 *  | 'STRING'
 *  | 'INTEGER'
 *  | 'BOOLEAN'
 *  | 'USER'
 *  | 'CHANNEL'
 *  | 'ROLE'
 *  | 'MENTIONABLE'
 * } ApplicationCommandOptionType
 */

/**
 * @typedef {Object} SlashCommandPermissionData
 * @property {SlashCommandPermissionDataContent} [users]
 * @property {SlashCommandPermissionDataContent} [roles]
 */

/**
 * @typedef {Object} SlashCommandPermissionDataContent
 * @property {String[]} [allow]
 * @property {String[]} [deny]
 */

export default class SlashCommand {
  /**
   * @param {SlashCommandData} data The slash command data
   */
  constructor(data) {
    this.name = data.name;
    this.description = data.description;
    this.options = data.options;
    this.permissions = data.permissions;
    this.defaultPermission =
      typeof data.defaultPermission === 'boolean'
        ? data.defaultPermission
        : true;
  }

  /**
   * Initializes this slash command.
   * @param {Client} client The QG Client
   * @returns {SlashCommand}
   */
  init(client) {
    this.client = client;
    return this;
  }

  /**
   * Execute this command.
   * @param {CommandInteraction} interaction The interaction that triggered this command
   * @param {Options} options The options used by this command
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
   * @param {ApplicationCommandOptionData[]} [options] The options of this command
   * @returns {ApplicationCommandOption[]}
   */
  getApplicationCommandOptions(options = this.options) {
    if (!options && !Array.isArray(options)) return [];
    return options.map(option => ({
      type: option.type,
      name: option.name,
      description: option.description,
      required: option.required,
      choices: option.choices,
      options: option.options
        ? this.getApplicationCommandOptions(option.options)
        : undefined,
    }));
  }

  /**
   * Gets the array of ApplicationCommandPermissionData of this slash command.
   * @returns {ApplicationCommandPermissionData[]}
   */
  getApplicationCommandPermissionData() {
    /** @type {ApplicationCommandPermissionData[]} */
    const permissions = [];
    if (this.permissions) {
      if (this.permissions.roles) {
        if (this.permissions.roles.allow) {
          this.permissions.roles.allow.forEach(id =>
            permissions.push({ id: id, permission: true, type: 'ROLE' }),
          );
        }
        if (this.permissions.roles.deny) {
          this.permissions.roles.deny.forEach(id =>
            permissions.push({ id: id, permission: false, type: 'ROLE' }),
          );
        }
      }
      if (this.permissions.users) {
        if (this.permissions.users.allow) {
          this.permissions.users.allow.forEach(id =>
            permissions.push({ id: id, permission: true, type: 'USER' }),
          );
        }
        if (this.permissions.users.deny) {
          this.permissions.users.deny.forEach(id =>
            permissions.push({ id: id, permission: false, type: 'USER' }),
          );
        }
      }
    }
    return permissions.length ? permissions : undefined;
  }
}
