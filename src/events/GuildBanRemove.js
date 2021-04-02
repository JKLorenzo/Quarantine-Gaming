const Discord = require('discord.js');

/**
 * @param {import('../app.js')} app
 * @param {Discord.User} user
 */
module.exports = async function onGuildBanRemove(app, user) {
	const created_day = user.createdAt;
	const created_day_difference = app.utils.compareDate(created_day);

	const embed = new Discord.MessageEmbed();
	embed.setAuthor('Quarantine Gaming: Member Submanager');
	embed.setTitle('Member Unban');
	embed.setThumbnail(user.displayAvatarURL());
	embed.addField('User:', user);
	embed.addField('Account Created:', `${created_day.toUTCString().replace('GMT', 'UTC')} (${created_day_difference.estimate})`);
	embed.setFooter(`${user.tag} (${user.id})`);
	embed.setTimestamp();
	embed.setColor('#7bff64');
	await app.message_manager.sendToChannel(app.utils.constants.channels.server.logs, embed);
};