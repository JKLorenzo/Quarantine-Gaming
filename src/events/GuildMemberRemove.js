const Discord = require('discord.js');

/**
 * @param {import('../app.js')} app
 * @param {Discord.GuildMember} member
 */
module.exports = async function onGuildMemberRemove(app, member) {
	const created_day = member.user.createdAt;
	const created_day_difference = app.utils.compareDate(created_day);

	const embed = new Discord.MessageEmbed();
	embed.setAuthor('Quarantine Gaming: Member Submanager');
	embed.setTitle('Member Leave');
	embed.setThumbnail(member.user.displayAvatarURL());
	embed.addField('User:', member);
	embed.addField('Account Created:', `${created_day.toUTCString().replace('GMT', 'UTC')} (${created_day_difference.estimate})`);
	embed.setFooter(`${member.user.tag} (${member.user.id})`);
	embed.setTimestamp();
	embed.setColor('#7bff64');
	app.message_manager.sendToChannel(app.utils.constants.channels.server.logs, embed);
};