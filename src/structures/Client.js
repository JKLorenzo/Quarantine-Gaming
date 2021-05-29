import { Client, MessageEmbed } from 'discord.js';
import BaseEvents from '../events/Base.js';
import {
	ChannelManager, DatabaseManager, DedicatedChannelManager, ErrorManager,	FreeGameManager, GameManager,
	InteractionManager, GatewayManager, MessageManager, ReactionManager, RoleManager, SpeechManager,
} from '../managers/Base.js';
import Methods from '../methods/Base.js';
import { constants, parseMention } from '../utils/Base.js';

/**
 * @typedef {import('discord.js').ClientOptions} ClientOptions
 * @typedef {import('discord.js').GuildChannel} GuildChannel
 * @typedef {import('discord.js').GuildChannelResolvable} GuildChannelResolvable
 * @typedef {import('discord.js').Message} Message
 * @typedef {import('discord.js').MessageResolvable} MessageResolvable
 * @typedef {import('discord.js').Role} Role
 * @typedef {import('discord.js').RoleResolvable} RoleResolvable
 * @typedef {import('discord.js').TextChannel} TextChannel
 * @typedef {import('discord.js').UserResolvable} UserResolvable
 * @typedef {import('../structures/Base.js').ExtendedMember} ExtendedMember
 */

export default class QGClient extends Client {
	/** @param {ClientOptions} clientOptions */
	constructor(clientOptions) {
		super(clientOptions);

		this.channel_manager = new ChannelManager(this);
		this.database_manager = new DatabaseManager(this);
		this.dedicated_channel_manager = new DedicatedChannelManager(this);
		this.error_manager = new ErrorManager(this);
		this.free_game_manager = new FreeGameManager(this);
		this.game_manager = new GameManager(this);
		this.interaction_manager = new InteractionManager(this);
		this.gateway_manager = new GatewayManager(this);
		this.message_manager = new MessageManager(this);
		this.reaction_manager = new ReactionManager(this);
		this.role_manager = new RoleManager(this);
		this.speech_manager = new SpeechManager(this);

		this.methods = new Methods(this);
		this.events = new BaseEvents(this);

		this.once('ready', async () => {
			console.log('Client logged in. Initializing...');
			this.message_manager.sendToChannel(constants.interface.channels.logs, '[ **ONLINE**  -------------------------->');

			await this.database_manager.init();
			await this.gateway_manager.init();
			await this.interaction_manager.init();

			await this.methods.loadMembers();
			await this.game_manager.init();
			await this.dedicated_channel_manager.init();

			this.free_game_manager.actions.start();

			this.message_manager.sendToChannel(constants.interface.channels.logs, '[ **INITIALIZED**  -------------------->');

			console.log('Client initialized.');
		});

		this.on('userUpdate', async (oldUser, newUser) => {
			const member = this.member(newUser);

			const description = [`**Profile:** ${member}`];
			if (oldUser.username != newUser.username) description.push(`**Username:** \nOld: ${oldUser.username} \nNew: ${newUser.username}`);
			if (oldUser.tag != newUser.tag) description.push(`**Tagname:** \nOld: ${oldUser.tag} \nNew: ${newUser.tag}`);
			if (oldUser.displayAvatarURL() != newUser.displayAvatarURL()) description.push(`**Avatar:** [New Avatar](${newUser.displayAvatarURL()})`);

			if (description.length > 1) {
				this.message_manager.sendToChannel(constants.interface.channels.member_events, new MessageEmbed({
					author: { name: member.displayName, icon_url: member.displayAvatarURL() },
					description: description.join('\n'),
					footer: { text: `Reference ID: ${member.id}` },
					color: 'BLURPLE',
				}));
			}
		});
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
		return this.guild.channels.resolve(channel)
			?? this.guild.channels.resolve(parseMention(channel))
			?? this.guilds.cache.get(constants.interface.guild).channels.resolve(channel)
			?? this.guilds.cache.get(constants.interface.guild).channels.resolve(parseMention(channel));
	}

	/**
 	 * Resolves a User Resolvable to an Extended Member object.
 	 * @param {UserResolvable} user
 	 * @returns {ExtendedMember}
 	 */
	member(user) {
		return this.guild.members.resolve(user)
			?? this.guild.members.resolve(parseMention(user));
	}

	/**
	 * Resolves a Role Resolvable to a Role object.
	 * @param {RoleResolvable} role
	 * @returns {Role}
	 */
	role(role) {
		return this.guild.roles.resolve(role)
			?? this.guild.roles.resolve(parseMention(role));
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
		if (this_channel) return this_channel.messages.resolve(message);
		return null;
	}
}