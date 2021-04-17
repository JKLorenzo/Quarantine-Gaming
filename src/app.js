// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');
const BaseActions = require('./actions/Base.js');
const BaseEvents = require('./events/Base.js');
const BaseTypes = require('./types/Base.js');
const BaseUtils = require('./utils/Base.js');
const BaseManagers = require('./managers/Base.js');
const BaseStructures = require('./structures/Base.js');


module.exports = class App {
	/** @param {import('discord.js-commando').CommandoClient} client */
	constructor(client) {
		this.client = client;

		this.structures = BaseStructures;
		this.types = BaseTypes;
		this.utils = BaseUtils;

		this.channel_manager = new BaseManagers.ChannelManager(this);
		this.database_manager = new BaseManagers.DatabaseManager(this);
		this.error_manager = new BaseManagers.ErrorManager(this);
		this.message_manager = new BaseManagers.MessageManager(this);
		this.reaction_manager = new BaseManagers.ReactionManager(this);
		this.role_manager = new BaseManagers.RoleManager(this);
		this.speech_manager = new BaseManagers.SpeechManager(this);
		this.free_game_manager = new BaseManagers.FreeGameManager(this);
		this.dedicated_channel_manager = new BaseManagers.DedicatedChannelManager(this);

		this.actions = new BaseActions(this);
		this.events = new BaseEvents(this);

		this.init();
	}

	async init() {
		await this.database_manager.init();
		await this.actions.startup();
		this.dedicated_channel_manager.actions.start();
		this.free_game_manager.actions.start();
		console.log('Initialized');
	}

	get guild() {
		return this.client.guilds.cache.get(BaseUtils.constants.guild);
	}

	/**
	 * Resolves a Guild Channel Resolvable to a Guild Channel object.
 	 * @param {Discord.GuildChannelResolvable} channel
 	 * @returns {Discord.GuildChannel}
 	 */
	channel(channel) {
		return this.guild.channels.resolve(channel) || this.guild.channels.resolve(BaseUtils.parseMention(channel));
	}

	/**
 	 * Resolves a User Resolvable to an Extended Member object.
 	 * @param {Discord.UserResolvable} user
 	 * @returns {BaseStructures.ExtendedMember}
 	 */
	member(user) {
		return this.guild.members.resolve(user) || this.guild.members.resolve(BaseUtils.parseMention(user));
	}

	/**
	 * Resolves a Role Resolvable to a Role object.
	 * @param {Discord.RoleResolvable} role
	 * @returns {Discord.Role}
	 */
	role(role) {
		return this.guild.roles.resolve(role) || this.guild.roles.resolve(BaseUtils.parseMention(role));
	}

	/**
	 * Resolves a Message Resolvable to a Message object.
	 * @param {Discord.GuildChannelResolvable} channel
	 * @param {Discord.MessageResolvable} message
	 * @returns {Discord.Message}
	 */
	message(channel, message) {
		/** @type {Discord.TextChannel} */
		const this_channel = this.channel(channel);
		if (channel) return this_channel.messages.resolve(message);
		return null;
	}
};