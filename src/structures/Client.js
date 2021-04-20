const { AkairoClient, CommandHandler } = require('discord-akairo');
const {
	ChannelManager, DatabaseManager, DedicatedChannelManager, ErrorManager,
	FreeGameManager, MessageManager, ReactionManager, RoleManager, SpeechManager,
} = require('../managers/Base.js');
const Events = require('../events/Base.js');
const Methods = require('../methods/Base.js');
const {	constants, parseMention } = require('../utils/Base.js');
const path = require('path');


/**
 * @typedef {import('discord-akairo').AkairoOptions} AkairoOptions
 * @typedef {import('discord.js').ClientOptions} ClientOptions
 * @typedef {import('discord.js').GuildChannel} GuildChannel
 * @typedef {import('discord.js').GuildChannelResolvable} GuildChannelResolvable
 * @typedef {import('discord.js').Message} Message
 * @typedef {import('discord.js').MessageResolvable} MessageResolvable
 * @typedef {import('discord.js').Role} Role
 * @typedef {import('discord.js').RoleResolvable} RoleResolvable
 * @typedef {import('discord.js').TextChannel} TextChannel
 * @typedef {import('discord.js').UserResolvable} UserResolvable
 * @typedef {import('../structures/ExtendedMember.js')} ExtendedMember
 */

module.exports = class Client extends AkairoClient {
	/**
     * @param {AkairoOptions & ClientOptions} options
     * @param {ClientOptions} clientOptions
     */
	constructor(options = {}, clientOptions = {}) {
		super(options, clientOptions);

		this.channel_manager = new ChannelManager(this);
		this.database_manager = new DatabaseManager(this);
		this.dedicated_channel_manager = new DedicatedChannelManager(this);
		this.error_manager = new ErrorManager(this);
		this.free_game_manager = new FreeGameManager(this);
		this.message_manager = new MessageManager(this);
		this.reaction_manager = new ReactionManager(this);
		this.role_manager = new RoleManager(this);
		this.speech_manager = new SpeechManager(this);

		this.methods = new Methods(this);
		this.events = new Events(this);

		// Load Commands
		this.commandHandler = new CommandHandler(this, {
			directory: path.join(__dirname, '../commands'),
			prefix: '!',
			argumentDefaults: {
				prompt: {
					retries: 4,
					time: 30000,
					modifyStart: (message, text) => {
						message.reply(`${text} Type \`cancel\` to cancel this command.`).then(reply => {
							reply.delete({ timeout: 30000 }).catch(e => void e);
						});
						return null;
					},
					modifyRetry: (message, text, data) => {
						data.message.reply(`${text} Type \`cancel\` to cancel this command.`).then(reply => {
							reply.delete({ timeout: 30000 }).catch(e => void e);
							data.message.delete({ timeout: 30000 }).catch(e => void e);
						});
						return null;
					},
					modifyTimeout: (message) => {
						message.reply('Command has timed out.').then(reply => {
							message.delete({ timeout: 30000 }).catch(e => void e);
							reply.delete({ timeout: 30000 }).catch(e => void e);
						});
						return null;
					},
					modifyCancel: (message, text, data) => {
						data.message.reply('Command has been cancelled').then(reply => {
							message.delete({ timeout: 30000 }).catch(e => void e);
							reply.delete({ timeout: 30000 }).catch(e => void e);
							data.message.delete({ timeout: 30000 }).catch(e => void e);
						});
						return null;
					},
				},
			},
		});
		this.commandHandler.loadAll();
	}

	/**
     * Gets the Quarantine Gaming guild.
     */
	get guild() {
		return this.guilds.cache.get(constants.guild);
	}

	/**
	 * Resolves a Guild Channel Resolvable to a Guild Channel object.
 	 * @param {GuildChannelResolvable} channel
 	 * @returns {GuildChannel}
 	 */
	channel(channel) {
		return this.guild.channels.resolve(channel) || this.guild.channels.resolve(parseMention(channel));
	}

	/**
 	 * Resolves a User Resolvable to an Extended Member object.
 	 * @param {UserResolvable} user
 	 * @returns {ExtendedMember}
 	 */
	member(user) {
		return this.guild.members.resolve(user) || this.guild.members.resolve(parseMention(user));
	}

	/**
	 * Resolves a Role Resolvable to a Role object.
	 * @param {RoleResolvable} role
	 * @returns {Role}
	 */
	role(role) {
		return this.guild.roles.resolve(role) || this.guild.roles.resolve(parseMention(role));
	}

	/**
	 * Resolves a Message Resolvable to a Message object.
	 * @param {GuildChannelResolvable} channel
	 * @param {MessageResolvable} message
	 * @returns {Message}
	 */
	message(channel, message) {
		/** @type {TextChannel} */
		const this_channel = this.channel(channel);
		if (channel) return this_channel.messages.resolve(message);
		return null;
	}
};