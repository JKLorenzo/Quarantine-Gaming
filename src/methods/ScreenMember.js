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
module.exports = async function ScreenMember(client, member) {
	const created_day = member.user.createdAt;
	const created_day_difference = compareDate(created_day);
	const invite = await client.invite_manager.get();

	const embed = new MessageEmbed({
		author: { name: 'Quarantine Gaming: Server Gateway Administrative' },
		title: 'Member Approval Request',
		thumbnail: { url: member.user.displayAvatarURL() },
		fields: [
			{ name: 'Profile:', value: member },
			{ name: 'Inviter Profile:', value:  invite.inviter },
			{ name: 'Account Created:', value: `${created_day.toString().split('GMT')[0]} (${created_day_difference.estimate})` },
			{ name: 'Status:', value: 'Pending' },
		],
		footer: { text: 'Member must complete the membership verfication gate.' },
		color: '#53FF00',
	});

	return await client.message_manager.sendToChannel(constants.channels.server.management, embed);
};