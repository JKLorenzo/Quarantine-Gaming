const { MessageEmbed } = require('discord.js');
const { compareDate, constants } = require('../utils/Base.js');

/**
 * @typedef {import('../structures/Base.js').Client} Client
 * @typedef {import('discord.js').User} User
 */

/**
 * @param {Client} client
 * @param {User} user
 */
module.exports = async function onGuildBanRemove(client, user) {
	const created_day = user.createdAt;
	const created_day_difference = compareDate(created_day);

	const embed = new MessageEmbed();
	embed.setAuthor('Quarantine Gaming: Member Submanager');
	embed.setTitle('Member Unban');
	embed.setThumbnail(user.displayAvatarURL());
	embed.addField('User:', user);
	embed.addField('Account Created:', `${created_day.toUTCString().replace('GMT', 'UTC')} (${created_day_difference.estimate})`);
	embed.setFooter(`${user.tag} (${user.id})`);
	embed.setTimestamp();
	embed.setColor('#7bff64');
	await client.message_manager.sendToChannel(constants.channels.server.logs, embed);
};