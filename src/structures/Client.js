import { Client, MessageEmbed } from 'discord.js';
import {
	ChannelManager, DatabaseManager, DedicatedChannelManager, ErrorManager,	FreeGameManager, GameManager,
	InteractionManager, GatewayManager, MessageManager, ReactionManager, RoleManager, SpeechManager,
} from '../managers/Base.js';
import Methods from '../methods/Base.js';
import { ErrorTicketManager, constants, parseMention } from '../utils/Base.js';

/**
 * @typedef {import('discord.js').Role} Role
 * @typedef {import('discord.js').Message} Message
 * @typedef {import('discord.js').TextChannel} TextChannel
 * @typedef {import('discord.js').GuildMember} GuildMember
 * @typedef {import('discord.js').GuildChannel} GuildChannel
 * @typedef {import('discord.js').ClientOptions} ClientOptions
 * @typedef {import('discord.js').RoleResolvable} RoleResolvable
 * @typedef {import('discord.js').UserResolvable} UserResolvable
 * @typedef {import('discord.js').MessageResolvable} MessageResolvable
 * @typedef {import('discord.js').GuildChannelResolvable} GuildChannelResolvable
 */

const ETM = new ErrorTicketManager('QG Client');

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

		this.once('ready', async () => {
			console.log('Client logged in. Initializing...');
			this.message_manager.sendToChannel(constants.cs.channels.logs, '[ **ONLINE**  -------------------------->');

			await this.database_manager.init();
			await this.gateway_manager.init();
			await this.interaction_manager.init();
			await this.game_manager.init();
			await this.dedicated_channel_manager.init();

			// Check for streaming members
			const streaming_role = this.role(constants.qg.roles.streaming);
			for (const member of streaming_role.members.array()) {
				if (member.voice.channelID) continue;
				await this.role_manager.remove(member, streaming_role);
			}

			this.free_game_manager.actions.start();

			this.message_manager.sendToChannel(constants.cs.channels.logs, '[ **INITIALIZED**  -------------------->');

			console.log('Client initialized.');
		});

		this.on('userUpdate', async (oldUser, newUser) => {
			try {
				const member = this.member(newUser);

				const description = [`**Profile:** ${member}`];
				if (oldUser.username !== newUser.username) description.push(`**Username:** \nOld: ${oldUser.username} \nNew: ${newUser.username}\n`);
				if (oldUser.username === newUser.username && oldUser.tag !== newUser.tag) description.push(`**Tagname:** \nOld: ${oldUser.tag} \nNew: ${newUser.tag}\n`);
				if (oldUser.displayAvatarURL() !== newUser.displayAvatarURL()) description.push(`**Avatar:** [New Avatar](${newUser.displayAvatarURL()})`);

				if (description.length > 1) {
					this.message_manager.sendToChannel(constants.cs.channels.member_events, new MessageEmbed({
						author: { name: 'Quarantine Gaming: User Update' },
						title: member.displayName,
						thumbnail: { url: newUser.displayAvatarURL() },
						description: description.join('\n'),
						footer: { text: `Reference ID: ${newUser.id}` },
						color: 'BLURPLE',
					}));
				}
			} catch (error) {
				this.error_manager.mark(ETM.create('userUpdate', error));
			}
		});

		this.on('guildMemberUpdate', async (oldMember, newMember) => {
			try {
				if (newMember.guild.id !== constants.qg.guild) return;

				/** @type {Role[]} */
				const role_add = new Array();
				/** @type {Role[]} */
				const role_removed = new Array();
				if (newMember.roles.cache.size !== oldMember.roles.cache.size) {
					for (const this_role of newMember.roles.cache.difference(oldMember.roles.cache).array()) {
						const isNew = newMember.roles.cache.has(this_role.id);
						if (this_role.name.startsWith('Team 🔰')) continue;
						if (this_role.id === constants.qg.roles.streaming) continue;
						if (this_role.hexColor === constants.colors.play_role) continue;
						if (this_role.hexColor === constants.colors.game_role) continue;
						isNew ? role_add.push(this_role) : role_removed.push(this_role);
					}
				}

				const description = [`**Profile:** ${newMember}`];
				if (newMember.displayName !== oldMember.displayName) description.push(`**Nickname:** \nOld: ${oldMember.displayName} \nNew: ${newMember.displayName}\n`);
				if (role_add.length) description.push(`**Role Added:** ${role_add.map(role => role.name).join(', ')}\n`);
				if (role_removed.length) description.push(`**Role Removed:** ${role_removed.map(role => role.name).join(', ')}`);

				if (description.length > 1) {
					this.message_manager.sendToChannel(constants.cs.channels.member_events, new MessageEmbed({
						author: { name: 'Quarantine Gaming: Member Update' },
						title: newMember.displayName,
						thumbnail: { url: newMember.user.displayAvatarURL() },
						description: description.join('\n'),
						footer: { text: `Reference ID: ${newMember.id}` },
						color: 'BLURPLE',
					}));
				}
			} catch (error) {
				this.error_manager.mark(ETM.create('guildMemberUpdate', error));
			}
		});
	}

	/**
     * Gets the Control Server guild.
     */
	get qg() {
		return this.guilds.cache.get(constants.qg.guild);
	}

	/**
     * Gets the Quarantine Gaming guild.
     */
	get cs() {
		return this.guilds.cache.get(constants.cs.guild);
	}

	/**
	 * Resolves a Guild Channel Resolvable to a Guild Channel object.
 	 * @param {GuildChannelResolvable} channel
 	 * @returns {GuildChannel}
 	 */
	channel(channel) {
		return this.qg.channels.resolve(channel)
			?? this.qg.channels.resolve(parseMention(channel))
			?? this.cs.channels.resolve(channel)
			?? this.cs.channels.resolve(parseMention(channel));
	}

	/**
 	 * Resolves a User Resolvable to an Extended Member object.
 	 * @param {UserResolvable} user
 	 * @returns {GuildMember}
 	 */
	member(user) {
		return this.qg.members.resolve(user)
			?? this.qg.members.resolve(parseMention(user))
			?? this.cs.members.resolve(user)
			?? this.cs.members.resolve(parseMention(user));
	}

	/**
	 * Resolves a Role Resolvable to a Role object.
	 * @param {RoleResolvable} role
	 * @returns {Role}
	 */
	role(role) {
		return this.qg.roles.resolve(role)
			?? this.qg.roles.resolve(parseMention(role))
			?? this.cs.roles.resolve(role)
			?? this.cs.roles.resolve(parseMention(role));
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