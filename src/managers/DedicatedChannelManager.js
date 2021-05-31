import { MessageEmbed, Permissions } from 'discord.js';
import { ErrorTicketManager, ProcessQueue, parseMention, sleep, constants } from '../utils/Base.js';

/**
 * @typedef {import('discord.js').Role} Role
 * @typedef {import('discord.js').GuildMember} GuildMember
 * @typedef {import('discord.js').TextChannel} TextChannel
 * @typedef {import('discord.js').VoiceChannel} VoiceChannel
 * @typedef {import('discord.js').CategoryChannel} CategoryChannel
 * @typedef {import('../structures/Base').Client} Client
 */

const ETM = new ErrorTicketManager('Dedicated Channel Manager');
const PFlags = Permissions.FLAGS;

/**
 * @param {Client} client
 * @param {TextChannel} text_channel
 * @param {VoiceChannel} voice_channel
 * @param {String} name
 */
async function displayInfo(client, text_channel, voice_channel, name) {
	await client.message_manager.sendToChannel(text_channel, new MessageEmbed({
		author: { name: 'Quarantine Gaming: Dedicated Channels' },
		title: `Voice and Text Channels for ${name}`,
		description: [
			'\u200b 🔹 Only members who are in this voice channel can view this text channel.',
			`\u200b 🔹 ${voice_channel} voice and ${text_channel} text channels will automatically be deleted once everyone is disconnected from these channels.`,
			'\u200b 🔹 This channel will be renamed automatically depending on the game the members in this channel are playing. When multiple games are being played, the game with the highest number of players will be chosen.',
			'**Useful Commands for Dedicated Channels:**\n' + [
				'\u200b \u200b \u200b \u200b 📎 `/dedicate custom_name: <name>` to rename this channel to a custom name.',
				'\u200b \u200b \u200b \u200b 🔒 `/dedicate lock: True` to lock this channel.',
				'\u200b \u200b \u200b \u200b 🔓 `/dedicate lock: False` to unlock this channel.',
				'\u200b \u200b \u200b \u200b 🚏 `/transfer <member>` to transfer members from other voice channel to this channel regardless whether this channel is locked or unlocked.',
			].join('\n\n'),
			`Note: ${client.role(constants.qg.roles.staff)}, ${client.role(constants.qg.roles.moderator)}, and ${client.role(constants.qg.roles.music_bot)} can interact with these channels.`,
		].join('\n\n'),
		color: 'BLURPLE',
	}));
}

export default class DedicatedChannelManager {
	/** @param {Client} client */
	constructor(client) {
		this.client = client;
		this.queuer = new ProcessQueue(1000);
	}

	async init() {
		// Auto dedicate every 5 minutes
		setInterval(() => {
			this.autoDedicate();
		}, 300000);

		this.client.on('voiceStateUpdate', async (oldState, newState) => {
			const member = newState.member;
			if (newState.channelID === oldState.channelID) return;

			if (oldState.channel?.parent?.id === constants.qg.channels.category.dedicated_voice) {
				const text_channel = this.client.channel(constants.qg.channels.category.dedicated).children.find(channel => channel.type == 'text' && channel.topic && parseMention(channel.topic.split(' ')[0]) == oldState.channelID);
				const linked_data = text_channel.topic.split(' ');
				const team_role = this.client.role(linked_data[1]);

				if (oldState.channel.members.size > 0 && !(oldState.channel.members.size == 1 && oldState.channel.members.first().user.bot)) {
					this.client.role_manager.remove(member, team_role);
					this.client.message_manager.sendToChannel(text_channel, new MessageEmbed({
						author: { name: 'Quarantine Gaming: Dedicated Channels' },
						title: oldState.channel.name,
						thumbnail: { url: member.user.displayAvatarURL() },
						description: `${oldState.member} left this channel.`,
						footer: { text: `${member.user.tag} (${member.user.id})` },
						timestamp: new Date(),
						color: 'RED',
					}));
				} else {
					await this.client.role_manager.delete(team_role);
					await this.client.channel_manager.delete(oldState.channel);
					await this.client.channel_manager.delete(text_channel);
				}
			}

			if (newState.channel) {
				// Check if members are streaming
				const streamers = new Array();
				for (const this_member of newState.channel.members.array()) {
					if (member.user.id != this_member.user.id && this_member.roles.cache.has(constants.qg.roles.streaming)) {
						streamers.push(this_member);
					}
				}

				// Notify member
				if (streamers.length > 0) {
					this.client.message_manager.sendToUser(member, new MessageEmbed({
						author: { name: 'Quarantine Gaming: Information' },
						title: `${streamers.length > 1
							? `${streamers.map(this_member => this_member.displayName).join(' and ')} are`
							: `${streamers.map(this_member => this_member.displayName)} is`} currently Streaming`,
						thumbnail: { url: member.user.displayAvatarURL() },
						description: 'Please observe proper behavior on your current voice channel.',
						image: { url: 'https://pa1.narvii.com/6771/d33918fa87ad0d84b7dc854dcbf6a8545c73f94d_hq.gif' },
						color: 'YELLOW',
					}));
				}

				if (newState.channel.parent?.id == constants.qg.channels.category.dedicated_voice) {
					const text_channel = this.client.channel(constants.qg.channels.category.dedicated).children.find(channel => channel.topic && parseMention(channel.topic.split(' ')[0]) == newState.channelID);
					const linked_data = text_channel.topic.split(' ');
					const team_role = this.client.role(linked_data[1]);

					// Add Text Role
					if (!member.roles.cache.has(team_role.id)) {
						this.client.role_manager.add(member, team_role);
						this.client.message_manager.sendToChannel(text_channel, new MessageEmbed({
							author: { name: 'Quarantine Gaming: Dedicated Channels' },
							title: newState.channel.name,
							thumbnail: { url: newState.member.user.displayAvatarURL() },
							description: `${newState.member} joined this channel.`,
							footer: { text: `${newState.member.user.tag} (${newState.member.user.id})` },
							timestamp: new Date(),
							color: 'GREEN',
						}));
					}
				} else if (newState.channel.parent?.id == constants.qg.channels.category.voice && newState.channel.members.array().length == 5) {
					// Dedicate this channel
					await this.client.dedicated_channel_manager.create(newState.channel, newState.channel.members.array()[0].displayName);
				}
			} else if (member.roles.cache.has(constants.qg.roles.streaming)) {
				this.client.role_manager.remove(member, constants.qg.roles.streaming);
			}
		});
	}

	/**
     * Automatically dedicates all channels.
     */
	async autoDedicate() {
		try {
			/** @type {CategoryChannel} */
			const dedicated_voice_channels_category = this.client.channel(constants.qg.channels.category.dedicated_voice);
			/** @type {VoiceChannel[]} */
			const channels_for_dedication = dedicated_voice_channels_category.children.array();
			for (const this_channel of channels_for_dedication) {
				if (this_channel.members.size > 1) {
					// Get baseline activity
					let baseline_role, same_acitivities, diff_acitivities;
					for (const this_member of this_channel.members.array()) {
						for (const this_role of this_member.roles.cache.array()) {
							if (!baseline_role && this_role.name.startsWith('Play')) {
								// Check how many users have the same roles
								same_acitivities = 0;
								diff_acitivities = 0;
								for (const the_member of this_channel.members.array()) {
									if (the_member.roles.cache.find(role => role == this_role)) {
										same_acitivities++;
									} else if (the_member.roles.cache.find(role => role.name.startsWith('Play'))) {
										diff_acitivities++;
									}
								}
								if (same_acitivities > 1 && same_acitivities > diff_acitivities && !this_role.name.substring(5).startsWith(this_channel.name.substring(2))) {
									baseline_role = this_role;
									this.create(this_channel, this_role.name.substring(5));
								}
							}
						}
					}
				}
			}
		} catch(error) {
			this.client.error_manager.mark(ETM.create('autoDedicate', error));
		}
	}

	/**
     * Creates a dedicated channel.
     * @param {VoiceChannel} channel_origin
     * @param {String} name
     * @returns {Promise<{team_role: Role, text_channel: TextChannel, voice_channel: VoiceChannel, transfer_process?: Promise<void>}>}
     */
	create(channel_origin, name) {
		return this.queuer.queue(async () => {
			try {
				const channel_name = '🔰' + name;
				if (channel_origin.parentID == constants.qg.channels.category.dedicated_voice) {
					// Rename
					await channel_origin.setName(channel_name);
					/** @type {CategoryChannel} */
					const dedicated_text_channels_category = this.client.channel(constants.qg.channels.category.dedicated);
					/** @type {Array<TextChannel>} */
					const dedicated_text_channels = dedicated_text_channels_category.children.array();
					const dedicated_text_channel = dedicated_text_channels.find(channel => channel.topic && parseMention(channel.topic.split(' ')[0]) == channel_origin.id);
					await dedicated_text_channel.setName(channel_name);
					const team_role = this.client.role(dedicated_text_channel.topic.split(' ')[1]);
					await team_role.setName(`Team ${channel_name}`);

					displayInfo(this.client, dedicated_text_channel, channel_origin, channel_name);

					return {
						team_role: team_role,
						text_channel: dedicated_text_channel,
						voice_channel: channel_origin,
					};
				} else {
					// Notify
					const this_speech = this.client.speech_manager.say(channel_origin, `You will be transferred to ${name} dedicated channel. Please wait.`);

					const team_role = await this.client.role_manager.create({
						name: `Team ${channel_name}`,
						position: this.client.role(constants.qg.roles.streaming).position + 1,
						hoist: true,
					});

					const dedicated_voice_channel = await this.client.channel_manager.create({
						name: channel_name,
						type: 'voice',
						parent: constants.qg.channels.category.dedicated_voice,
						permissionOverwrites: [
							{
								id: constants.qg.roles.everyone,
								deny: [
									PFlags.VIEW_CHANNEL,
								],
							},
							{
								id: constants.qg.roles.member,
								allow: [
									PFlags.VIEW_CHANNEL,
								],
							},
							{
								id: constants.qg.roles.music_bot,
								allow: [
									PFlags.VIEW_CHANNEL,
								],
							},
						],
						bitrate: 128000,
					});

					const dedicated_text_channel = await this.client.channel_manager.create({
						name: channel_name,
						type: 'text',
						parent: constants.qg.channels.category.dedicated,
						permissionOverwrites: [
							{
								id: constants.qg.roles.everyone,
								deny: [
									PFlags.VIEW_CHANNEL,
								],
							},
							{
								id: constants.qg.roles.music_bot,
								allow: [
									PFlags.VIEW_CHANNEL,
								],
							},
							{
								id: team_role.id,
								allow: [
									PFlags.VIEW_CHANNEL,
								],
							},
						],
						topic: `${dedicated_voice_channel} ${team_role}`,
					});

					displayInfo(this.client, dedicated_text_channel, dedicated_voice_channel, channel_name);

					// Delay for ~5 seconds
					await this_speech;
					await sleep(5000);

					// Sort streamers from members and transfer
					const [streamers, members] = channel_origin.members.partition(this_member => this_member.roles.cache.has(constants.qg.roles.streaming));
					const transferProcess = this.client.methods.voiceChannelTransfer(dedicated_voice_channel, [...streamers.array(), ...members.array()]);
					return {
						team_role: team_role,
						text_channel: dedicated_text_channel,
						voice_channel: dedicated_voice_channel,
						transfer_process: transferProcess,
					};
				}
			} catch (error) {
				this.client.error_manager.mark(ETM.create('create', error));
			}
		});
	}

	/**
     * Removes unused dedicated channel.
     * @returns {Promise<null>}
     */
	clean() {
		return this.queuer.queue(async () => {
			try {
				for (const team_role of this.client.qg.roles.cache.array().filter(role => role.name.startsWith('Team'))) {
					/** @type {CategoryChannel} */
					const dedicated_text_category = this.client.qg.channels.cache.get(constants.qg.channels.category.dedicated);
					/** @type {TextChannel} */
					const dedicated_text_channel = dedicated_text_category.children.array().find(channel => {
						/** @type {TextChannel} */
						const text_channel = channel;
						if (text_channel.topic && parseMention(text_channel.topic.split(' ')[1]) == team_role.id) return true;
						return false;
					});
					if (!dedicated_text_channel) {
						await this.client.role_manager.delete(team_role);
						continue;
					}
					/** @type {VoiceChannel} */
					const dedicated_voice_channel = this.client.channel(parseMention(dedicated_text_channel.topic.split(' ')[0]));
					if (!dedicated_voice_channel) {
						await this.client.role_manager.delete(team_role);
						await this.client.channel_manager.delete(dedicated_text_channel);
						continue;
					}
					const team_members = team_role.members.array().filter(member => !member.user.bot);
					if (team_members.length == 0) {
						await this.client.role_manager.delete(team_role);
						await this.client.channel_manager.delete(dedicated_text_channel);
						await this.client.channel_manager.delete(dedicated_voice_channel);
						continue;
					}
					for (const this_member of team_members) {
						if (dedicated_voice_channel.members.array().includes(this_member)) {
							// Add team role
							if (this_member.roles.cache.has(team_role.id)) continue;
							await this.client.role_manager.add(this_member, team_role);
						} else {
							// Remove team role
							if (!this_member.roles.cache.has(team_role.id)) continue;
							await this.client.role_manager.remove(this_member, team_role);
						}
					}
				}
			} catch (error) {
				this.client.error_manager.mark(ETM.create('load', error));
			}
		});
	}
}