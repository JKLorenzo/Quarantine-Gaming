import { sleep, constants } from '../utils/Base.js';

/**
 * @typedef {import('discord').VoiceChannel} VoiceChannel
 * @typedef {import('../structures/Base').ExtendedMember} ExtendedMember
 */

/**
 * @param {VoiceChannel} channel
 * @param {ExtendedMember[]} members
 */
export default async function voiceChannelTransfer(channel, members) {
	for (const this_member of members) {
		if (!this_member.voice || this_member.user.id == constants.me) continue;
		await this_member.voice.setChannel(channel);
		await sleep(500);
	}
}