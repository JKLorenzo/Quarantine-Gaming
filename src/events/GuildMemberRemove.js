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
	const created_day = member.user.createdAt;
	const created_day_difference = compareDate(created_day);

	const embed = new MessageEmbed();
	embed.setAuthor('Quarantine Gaming: Member Submanager');
	embed.setTitle('Member Leave');
	embed.setThumbnail(member.user.displayAvatarURL());
	embed.addField('User:', member);
	embed.addField('Account Created:', `${created_day.toUTCString().replace('GMT', 'UTC')} (${created_day_difference.estimate})`);
	embed.setFooter(`${member.user.tag} (${member.user.id})`);
	embed.setTimestamp();
	embed.setColor('#7bff64');
	client.message_manager.sendToChannel(constants.channels.server.logs, embed);
};