const Discord = require('discord.js');

/**
 * @param {import('../app.js')} app
 * @param {Discord.Invite} invite
 */
module.exports = async function onInviteCreate(app, invite) {
	const embed = new Discord.MessageEmbed();
	embed.setAuthor('Quarantine Gaming: Invite Submanager');
	embed.setTitle('New Invite Created');
	if (invite.inviter) {
		embed.addField('Inviter:', invite.inviter, true);
		embed.setThumbnail(invite.inviter.displayAvatarURL());
	}
	if (invite.targetUser) embed.addField('Target User:', invite.targetUser, true);
	embed.addFields([
		{ name: 'Channel:', value: invite.channel, inline: true },
		{ name: 'Code:', value: invite.code, inline: true },
	]);
	if (invite.expiresTimestamp) {
		embed.setTimestamp(invite.expiresTimestamp);
		embed.setFooter('Expires ');
	}
	else {
		embed.setFooter('NO EXPIRATION DATE ⚠');
	}
	embed.setColor('#25c081');
	await app.message_manager.sendToChannel(app.utils.constants.channels.server.management, embed);
};