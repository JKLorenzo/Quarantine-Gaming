const { MessageEmbed } = require('discord.js');
const { compareDate, constants } = require('../utils/Base.js');

/**
 * @typedef {import('../structures/Base.js').Client} Client
 * @typedef {import('../structures/Base.js').ExtendedMember} ExtendedMember
 */

/**
 * @param {Client} client
 * @param {ExtendedMember} member
 */
module.exports = async function onGuildMemberRemove(client, member) {
	const created_day = member.joinedAt;
	const created_day_formatted = created_day.toString().split('GMT')[0];
	const created_day_difference = compareDate(created_day);

	await client.message_manager.sendToChannel(constants.channels.server.logs, new MessageEmbed({
		author: { name: 'Quarantine Gaming: Server Gateway Events' },
		title: 'Member Leave',
		description: [
			`**Profile:** ${member}`,
			`**Joined:** ${created_day_formatted} (${created_day_difference.estimate})`,
		].join('\n'),
		thumbnail: { url: member.user.displayAvatarURL() },
		footer: { text: `Reference ID: ${member.user.id}` },
		color: '#FF2277',
	}));
};