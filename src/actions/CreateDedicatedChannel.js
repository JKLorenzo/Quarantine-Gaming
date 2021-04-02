const Discord = require('discord.js');
const { ProcessQueue } = require('../utils/Base.js');
const queuer = new ProcessQueue(1000);

/**
 * @param {import('../app.js')} app
 * @param {Discord.VoiceChannel} channel_origin
 * @param {String} name
 * @returns {Promise<null>}
 */
module.exports = async function createDedicatedChannel(app, channel_origin, name) {
	return queuer.queue(async () => {
		const channel_name = '🔰' + name;
		if (channel_origin.parentID == app.utils.app.utils.constants.channels.category.dedicated_voice) {
			// Rename
			await channel_origin.setName(channel_name);
			/** @type {Discord.CategoryChannel} */
			const dedicated_text_channels_category = app.channel(app.utils.constants.channels.category.dedicated);
			/** @type {Array<Discord.TextChannel>} */
			const dedicated_text_channels = dedicated_text_channels_category.children.array();
			const text_channel = dedicated_text_channels.find(channel => channel.topic && app.utils.parseMention(channel.topic.split(' ')[0]) == channel_origin.id);
			await text_channel.setName(channel_name);
			const team_role = app.role(text_channel.topic.split(' ')[1]);
			await team_role.setName(`Team ${channel_name}`);

			// Set info
			const channel_desc = new Array();
			channel_desc.push('• Only members who are in this voice channel can view this text channel.');
			channel_desc.push('• You can\'t view other dedicated channels once you\'re connected to one.');
			channel_desc.push(`• ${text_channel} voice and text channels will automatically be deleted once everyone is disconnected from these channels.`);
			channel_desc.push('• You can lock this channel by doing **!dedicate lock**, and you can do **!dedicate unlock** to unlock it.');
			channel_desc.push(`• You can transfer anyone from another voice channel to this voice channel by doing **!transfer <@member>**.\n\u200b\u200bEx: "!transfer ${app.client().user}"`);
			channel_desc.push(`• You can also transfer multiple users at once.\n\u200b\u200bEx: "!transfer ${app.client().user} ${app.client().user}"`);
			channel_desc.push(`Note: ${app.role(app.utils.constants.roles.staff)}, ${app.role(app.utils.constants.roles.moderator)}, and ${app.role(app.utils.constants.roles.music_bot)} can interact with these channels.`);
			const embed = new Discord.MessageEmbed();
			embed.setAuthor('Quarantine Gaming: Dedicated Channels');
			embed.setTitle(`Voice and Text Channels for ${channel_name}`);
			embed.setDescription(channel_desc.join('\n\n'));
			embed.setColor('#7b00ff');

			const profile = app.guild().members.cache.find(member => member.displayName == name);
			const emoji = app.guild().emojis.cache.find(this_emoji => this_emoji.name == name.split(' ').join('').split(':').join('').split('-').join(''));
			const qg_emoji = app.guild().emojis.cache.find(this_emoji => this_emoji.name == 'quarantinegaming');
			if (profile) {
				embed.setThumbnail(profile.user.displayAvatarURL());
			}
			else if (emoji) {
				embed.setThumbnail(emoji.url);
			}
			else {
				embed.setThumbnail(qg_emoji.url);
			}

			app.message_manager.sendToChannel(text_channel, embed);
		}
		else {
			// Notify
			const this_speech = app.speech_manager.say(channel_origin, `You will be transferred to ${name} dedicated channel. Please wait.`);

			const team_role = await app.role_manager.create({
				name: `Team ${channel_name}`,
				position: app.role(app.utils.constants.roles.streaming).position + 1,
				hoist: true,
			});

			const p = app.utils.constants.permissions;
			const dedicated_voice_channel = await app.channel_manager.create({
				name: channel_name,
				type: 'voice',
				parent: app.utils.constants.channels.category.dedicated_voice,
				permissionOverwrites: [
					{
						id: app.utils.constants.roles.everyone,
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
						id: app.utils.constants.roles.member,
						allow: [
							p.general.VIEW_CHANNEL,
							p.voice.CONNECT,
							p.voice.SPEAK,
							p.voice.VIDEO,
						],
					},
					{
						id: app.utils.constants.roles.moderator,
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
						id: app.utils.constants.roles.music_bot,
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

			const dedicated_text_channel = await app.channel_manager.create({
				name: channel_name,
				type: 'text',
				parent: app.utils.constants.channels.category.dedicated,
				permissionOverwrites: [
					{
						id: app.utils.constants.roles.everyone,
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
						id: app.utils.constants.roles.music_bot,
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
						id: app.utils.constants.roles.moderator,
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
			channel_desc.push('• You can\'t view other dedicated channels once you\'re connected to one.');
			channel_desc.push(`• ${dedicated_text_channel} voice and text channels will automatically be deleted once everyone is disconnected from these channels.`);
			channel_desc.push('• You can lock this channel by doing **!dedicate lock**, and you can do **!dedicate unlock** to unlock it.');
			channel_desc.push(`• You can transfer anyone from another voice channel to this voice channel by doing **!transfer <@member>**.\n\u200b\u200bEx: "!transfer ${app.client().user}"`);
			channel_desc.push(`• You can also transfer multiple users at once.\n\u200b\u200bEx: "!transfer ${app.client().user} ${app.client().user}"`);
			channel_desc.push(`Note: ${app.role(app.utils.constants.roles.staff)}, ${app.role(app.utils.constants.roles.moderator)}, and ${app.role(app.utils.constants.roles.music_bot)} can interact with these channels.`);
			const embed = new Discord.MessageEmbed();
			embed.setAuthor('Quarantine Gaming: Dedicated Channels');
			embed.setTitle(`Voice and Text Channels for ${channel_name}`);
			embed.setDescription(channel_desc.join('\n\n'));
			embed.setColor('#7b00ff');

			const profile = app.guild().members.cache.find(member => member.displayName == name);
			const emoji = app.guild().emojis.cache.find(this_emoji => this_emoji.name == name.split(' ').join('').split(':').join('').split('-').join(''));
			const qg_emoji = app.guild().emojis.cache.find(this_emoji => this_emoji.name == 'quarantinegaming');
			if (profile) {
				embed.setThumbnail(profile.user.displayAvatarURL());
			}
			else if (emoji) {
				embed.setThumbnail(emoji.url);
			}
			else {
				embed.setThumbnail(qg_emoji.url);
			}

			await app.message_manager.sendToChannel(dedicated_text_channel, embed);

			// Delay for ~5 seconds
			await this_speech;
			await app.utils.sleep(5000);

			// Sort streamers from members
			const [streamers, members] = channel_origin.members.partition(this_member => this_member.roles.cache.has(app.utils.constants.roles.streaming));

			// Transfer streamers
			for (const this_member of streamers.array()) {
				if (!this_member.voice || this_member.user.id == app.utils.constants.me) continue;
				await this_member.voice.setChannel(dedicated_voice_channel);
				await app.utils.sleep(1000);
			}

			// Transfer members
			for (const this_member of members.array()) {
				if (!this_member.voice || this_member.user.id == app.utils.constants.me) continue;
				await this_member.voice.setChannel(dedicated_voice_channel);
				await app.utils.sleep(1000);
			}
		}
	});
};