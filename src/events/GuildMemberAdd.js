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
module.exports = async function onGuildMemberAdd(client, member) {
	await member.init();

	const created_day = member.user.createdAt;
	const created_day_formatted = created_day.toString().split('GMT')[0];
	const created_day_difference = compareDate(created_day);

	await client.methods.screenMember(member);

	await client.message_manager.sendToChannel(constants.channels.server.logs, new MessageEmbed({
		author: { name: 'Quarantine Gaming: Server Gateway Events' },
		title: 'Member Join',
		description: [
			`**Profile:** ${member}`,
			`**Created:** ${created_day_formatted} (${created_day_difference.estimate})`,
		].join('\n'),
		thumbnail: { url: member.user.displayAvatarURL() },
		footer: { text: `Reference ID: ${member.user.id}` },
		color: '#2255FF',
	}));
};