const { MessageEmbed } = require('discord.js');
const { compareDate, constants } = require('../utils/Base.js');

/**
 * @typedef {import('../structures/Base.js').Client} Client
 * @typedef {import('discord.js').Invite} Invite
 */

/**
 * @param {Client} client
 * @param {Invite} invite
 */
module.exports = async function onInviteCreate(client, invite) {
	client.invite_manager.update(invite);

	const created_day = invite.expiresAt;
	const created_day_formatted = created_day.toString().split('GMT')[0];
	const created_day_difference = compareDate(created_day);

	const description = [`**By:** ${invite.inviter}`];
	if (invite.targetUser) description.push(`**Target User:** ${invite.targetUser}`);
	if (invite.memberCount) description.push(`**Target Guild Member Count:** ${invite.memberCount}`);
	if (typeof invite.maxUses === 'number') description.push(`**Max Uses:** ${invite.maxUses ? invite.maxUses : 'Infinite'}`);
	if (invite.expiresAt) description.push(`**Expires:** ${created_day_formatted} (${created_day_difference.estimate})`);

	await client.message_manager.sendToChannel(constants.channels.server.management, new MessageEmbed({
		author: { name: 'Quarantine Gaming: Server Gateway Events' },
		title: 'Invite Created',
		description: description.join('\n'),
		thumbnail: { url: invite.inviter.displayAvatarURL() },
		footer: { text: `Reference ID: ${invite.code}` },
		color: '#25c081',
	}));
};