const Discord = require('discord.js');
const { ErrorTicketManager, ProcessQueue, parseMention, sleep, constants } = require('../utils/Base.js');

const ETM = new ErrorTicketManager('DedicatedChannelManager');

/**
 * @typedef {import('../structures/Base.js').Client} Client
 */

module.exports = class DedicatedChannelManager {
	/** @param {Client} client */
	constructor(client) {
		this.client = client;
		this.queuer = new ProcessQueue(1000);

		this.data = {
			interval: 120000,
			intervalID: null,
		};

		this.actions = {
			start: () => {
				this.data.intervalID = setInterval(() => {
					this.autoDedicate();
				}, this.data.interval);
			},
			stop: () => {
				if (this.data.intervalID) clearInterval(this.data.intervalID);
			},
		};
	}

	/**
     * Automatically dedicates all channels.
     */
	async autoDedicate() {
		try {
			/** @type {Discord.CategoryChannel} */
			const dedicated_voice_channels_category = this.client.channel(constants.channels.category.dedicated_voice);
			/** @type {Discord.VoiceChannel} */
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
									}
									else if (the_member.roles.cache.find(role => role.name.startsWith('Play'))) {
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
		}
		catch(error) {
			this.client.error_manager.mark(ETM.create('autoDedicate', error));
		}
	}

	/**
     * Creates a dedicated channel.
     * @param {Discord.VoiceChannel} channel_origin
     * @param {String} name
     * @returns {Promise<null>}
     */
	create(channel_origin, name) {
		return this.queuer.queue(async () => {
			try {
				const channel_name = '🔰' + name;
				if (channel_origin.parentID == constants.channels.category.dedicated_voice) {
					// Rename
					await channel_origin.setName(channel_name);
					/** @type {Discord.CategoryChannel} */
					const dedicated_text_channels_category = this.client.channel(constants.channels.category.dedicated);
					/** @type {Array<Discord.TextChannel>} */
					const dedicated_text_channels = dedicated_text_channels_category.children.array();
					const text_channel = dedicated_text_channels.find(channel => channel.topic && parseMention(channel.topic.split(' ')[0]) == channel_origin.id);
					await text_channel.setName(channel_name);
					const team_role = this.client.role(text_channel.topic.split(' ')[1]);
					await team_role.setName(`Team ${channel_name}`);

					// Set info
					const channel_desc = new Array();
					channel_desc.push('• Only members who are in this voice channel can view this text channel.');
					channel_desc.push(`• ${text_channel} voice and text channels will automatically be deleted once everyone is disconnected from these channels.`);
					channel_desc.push('• You can lock this channel by doing **!dedicate lock**, and you can do **!dedicate unlock** to unlock it.');
					channel_desc.push(`• You can transfer anyone from another voice channel to this voice channel by doing **!transfer <@member>**.\n\u200b\u200bEx: "!transfer ${this.client.user}"`);
					channel_desc.push(`• You can also transfer multiple users at once.\n\u200b\u200bEx: "!transfer ${this.client.user} ${this.client.user}"`);
					channel_desc.push(`Note: ${this.client.role(constants.roles.staff)}, ${this.client.role(constants.roles.moderator)}, and ${this.client.role(constants.roles.music_bot)} can interact with these channels.`);
					const embed = new Discord.MessageEmbed();
					embed.setAuthor('Quarantine Gaming: Dedicated Channels');
					embed.setTitle(`Voice and Text Channels for ${channel_name}`);
					embed.setDescription(channel_desc.join('\n\n'));
					embed.setColor('#7b00ff');

					const profile = this.client.guild.members.cache.find(member => member.displayName == name);
					const emoji = this.client.guild.emojis.cache.find(this_emoji => this_emoji.name == name.split(' ').join('').split(':').join('').split('-').join(''));
					const qg_emoji = this.client.guild.emojis.cache.find(this_emoji => this_emoji.name == 'quarantinegaming');
					if (profile) {
						embed.setThumbnail(profile.user.displayAvatarURL());
					}
					else if (emoji) {
						embed.setThumbnail(emoji.url);
					}
					else {
						embed.setThumbnail(qg_emoji.url);
					}

					this.client.message_manager.sendToChannel(text_channel, embed);
				}
				else {
					// Notify
					const this_speech = this.client.speech_manager.say(channel_origin, `You will be transferred to ${name} dedicated channel. Please wait.`);

					const team_role = await this.client.role_manager.create({
						name: `Team ${channel_name}`,
						position: this.client.role(constants.roles.streaming).position + 1,
						hoist: true,
					});

					const p = constants.permissions;
					const dedicated_voice_channel = await this.client.channel_manager.create({
						name: channel_name,
						type: 'voice',
						parent: constants.channels.category.dedicated_voice,
						permissionOverwrites: [
							{
								id: constants.roles.everyone,
								deny: [
									p.general.VIEW_CHANNEL,
									p.general.CREATE_INVITE,
									p.general.MANAGE_CHANNELS,
									p.general.MANAGE_PERMISSIONS,
									p.general.MANAGE_WEBHOOKS,
									p.voice.CONNECT,
									p.voice.MUTE_MEMBERS,
									p.voice.DEAFEN_MEMBERS,
									p.voice.MOVE_MEMBERS,
									p.voice.PRIORITY_SPEAKER,
								],
							},
							{
								id: constants.roles.member,
								allow: [
									p.general.VIEW_CHANNEL,
									p.voice.CONNECT,
									p.voice.SPEAK,
									p.voice.VIDEO,
								],
							},
							{
								id: constants.roles.moderator,
								allow: [
									p.general.VIEW_CHANNEL,
									p.general.CREATE_INVITE,
									p.general.MANAGE_CHANNELS,
									p.voice.CONNECT,
									p.voice.MUTE_MEMBERS,
									p.voice.DEAFEN_MEMBERS,
									p.voice.MOVE_MEMBERS,
									p.voice.PRIORITY_SPEAKER,
								],
							},
							{
								id: constants.roles.music_bot,
								allow: [
									p.general.VIEW_CHANNEL,
									p.voice.CONNECT,
									p.voice.SPEAK,
									p.voice.USE_VOICE_ACTIVITY,
								],
							},
						],
						bitrate: 128000,
					});

					const dedicated_text_channel = await this.client.channel_manager.create({
						name: channel_name,
						type: 'text',
						parent: constants.channels.category.dedicated,
						permissionOverwrites: [
							{
								id: constants.roles.everyone,
								deny: [
									p.general.VIEW_CHANNEL,
									p.general.CREATE_INVITE,
									p.general.MANAGE_CHANNELS,
									p.general.MANAGE_PERMISSIONS,
									p.general.MANAGE_WEBHOOKS,
									p.text.MENTION_EVERYONE,
									p.text.MANAGE_MESSAGES,
								],
							},
							{
								id: constants.roles.music_bot,
								allow: [
									p.general.VIEW_CHANNEL,
									p.text.ADD_REACTIONS,
									p.text.EMBED_LINKS,
									p.text.SEND_MESSAGES,
								],
							},
							{
								id: team_role.id,
								allow: [
									p.general.VIEW_CHANNEL,
									p.text.SEND_TTS_MESSAGES,
									p.text.EMBED_LINKS,
									p.text.ATTACH_FILES,
								],
							},
							{
								id: constants.roles.moderator,
								allow: [
									p.general.VIEW_CHANNEL,
									p.general.CREATE_INVITE,
									p.general.MANAGE_CHANNELS,
									p.text.MENTION_EVERYONE,
									p.text.MANAGE_MESSAGES,
								],
							},
						],
						topic: `${dedicated_voice_channel} ${team_role}`,
					});

					// Set info
					const channel_desc = new Array();
					channel_desc.push('• Only members who are in this voice channel can view this text channel.');
					channel_desc.push(`• ${dedicated_text_channel} voice and text channels will automatically be deleted once everyone is disconnected from these channels.`);
					channel_desc.push('• You can lock this channel by doing **!dedicate lock**, and you can do **!dedicate unlock** to unlock it.');
					channel_desc.push(`• You can transfer anyone from another voice channel to this voice channel by doing **!transfer <@member>**.\n\u200b\u200bEx: "!transfer ${this.client.user}"`);
					channel_desc.push(`• You can also transfer multiple users at once.\n\u200b\u200bEx: "!transfer ${this.client.user} ${this.client.user}"`);
					channel_desc.push(`Note: ${this.client.role(constants.roles.staff)}, ${this.client.role(constants.roles.moderator)}, and ${this.client.role(constants.roles.music_bot)} can interact with these channels.`);
					const embed = new Discord.MessageEmbed();
					embed.setAuthor('Quarantine Gaming: Dedicated Channels');
					embed.setTitle(`Voice and Text Channels for ${channel_name}`);
					embed.setDescription(channel_desc.join('\n\n'));
					embed.setColor('#7b00ff');

					const profile = this.client.guild.members.cache.find(member => member.displayName == name);
					const emoji = this.client.guild.emojis.cache.find(this_emoji => this_emoji.name == name.split(' ').join('').split(':').join('').split('-').join(''));
					const qg_emoji = this.client.guild.emojis.cache.find(this_emoji => this_emoji.name == 'quarantinegaming');
					if (profile) {
						embed.setThumbnail(profile.user.displayAvatarURL());
					}
					else if (emoji) {
						embed.setThumbnail(emoji.url);
					}
					else {
						embed.setThumbnail(qg_emoji.url);
					}

					await this.client.message_manager.sendToChannel(dedicated_text_channel, embed);

					// Delay for ~5 seconds
					await this_speech;
					await sleep(5000);

					// Sort streamers from members
					const [streamers, members] = channel_origin.members.partition(this_member => this_member.roles.cache.has(constants.roles.streaming));

					// Transfer streamers
					for (const this_member of streamers.array()) {
						if (!this_member.voice || this_member.user.id == constants.me) continue;
						await this_member.voice.setChannel(dedicated_voice_channel);
						await sleep(1000);
					}

					// Transfer members
					for (const this_member of members.array()) {
						if (!this_member.voice || this_member.user.id == constants.me) continue;
						await this_member.voice.setChannel(dedicated_voice_channel);
						await sleep(1000);
					}
				}
			}
			catch (error) {
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
				for (const team_role of this.client.guild.roles.cache.array().filter(role => role.name.startsWith('Team'))) {
					/** @type {Discord.CategoryChannel} */
					const dedicated_text_category = this.client.guild.channels.cache.get(constants.channels.category.dedicated);
					/** @type {Discord.TextChannel} */
					const dedicated_text_channel = dedicated_text_category.children.array().find(channel => {
						/** @type {Discord.TextChannel} */
						const text_channel = channel;
						if (text_channel.topic && parseMention(text_channel.topic.split(' ')[1]) == team_role.id) return true;
						return false;
					});
					if (!dedicated_text_channel) {
						await this.client.role_manager.delete(team_role);
						continue;
					}
					/** @type {Discord.VoiceChannel} */
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
						}
						else {
							// Remove team role
							if (!this_member.roles.cache.has(team_role.id)) continue;
							await this.client.role_manager.remove(this_member, team_role);
						}
					}
				}
			}
			catch (error) {
				this.client.error_manager.mark(ETM.create('load', error));
			}
		});
	}
};