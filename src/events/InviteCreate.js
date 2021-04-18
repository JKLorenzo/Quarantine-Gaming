const { MessageEmbed } = require('discord.js');
const { constants } = require('../utils/Base.js');

/**
 * @typedef {import('../structures/Base.js').Client} Client
 * @typedef {import('discord.js').Invite} Invite
 */

/**
 * @param {Client} client
 * @param {Invite} invite
 */
module.exports = async function onInviteCreate(client, invite) {
	const embed = new MessageEmbed();
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
	await client.message_manager.sendToChannel(constants.channels.server.management, embed);
};