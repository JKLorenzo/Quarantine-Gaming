const Discord = require('discord.js');
// eslint-disable-next-line no-unused-vars
const { ExtendedMember } = require('../structures/Base');

/**
 * @param {import('../app.js')} app
 * @param {ExtendedMember} member
 */
module.exports = async function(app, member) {
	await member.init(app);

	const created_day = member.user.createdAt;
	const created_day_difference = app.utils.compareDate(created_day);

	const embed = new Discord.MessageEmbed();
	embed.setAuthor('Quarantine Gaming: Member Submanager');
	embed.setTitle('New Member');
	embed.setThumbnail(member.user.displayAvatarURL());
	embed.addField('User:', member);
	embed.addField('Account Created:', `${created_day.toUTCString().replace('GMT', 'UTC')} (${created_day_difference.estimate})`);
	embed.setFooter(`${member.user.tag} (${member.user.id})`);
	embed.setTimestamp();
	embed.setColor('#7bff64');
	await app.message_manager.sendToChannel(app.utils.constants.channels.server.logs, embed);
};