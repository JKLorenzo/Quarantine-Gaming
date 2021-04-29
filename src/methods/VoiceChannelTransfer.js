const { sleep, constants } = require('../utils/Base.js');

/**
 * @typedef {import('../structures/Base.js').ExtendedMember} ExtendedMember
 * @typedef {import('discord.js').VoiceChannel} VoiceChannel
 */

/**
 * @param {VoiceChannel} channel
 * @param {ExtendedMember[]} members
 */
module.exports = async function voiceChannelTransfer(channel, members) {
	for (const this_member of members) {
		if (!this_member.voice || this_member.user.id == constants.me) continue;
		await this_member.voice.setChannel(channel);
		await sleep(500);
	}
};