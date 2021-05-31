import { sleep, constants } from '../utils/Base.js';

/**
 * @typedef {import('discord.js').GuildMember} GuildMember
 * @typedef {import('discord.js').VoiceChannel} VoiceChannel
 */

/**
 * @param {VoiceChannel} channel
 * @param {GuildMember[]} members
 */
export default async function voiceChannelTransfer(channel, members) {
	for (const this_member of members) {
		if (!this_member.voice || this_member.user.id == constants.me) continue;
		await this_member.voice.setChannel(channel);
		await sleep(500);
	}
}