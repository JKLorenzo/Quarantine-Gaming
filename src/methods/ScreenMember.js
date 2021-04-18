const Discord = require('discord.js');
const { compareDate, constants } = require('../utils/Base.js');

/**
 * @typedef {import('../structures/Base.js').Client} Client
 * @typedef {import('../structures/Base.js').ExtendedMember} ExtendedMember
 */

/**
 * @param {Client} client
 * @param {Discord.GuildMember} member
 */
module.exports = async function ScreenMember(client, member) {
	const created_day = member.user.createdAt;
	const created_day_difference = compareDate(created_day);

	// !!!!!!!!!!! INVITER MANAGER MISSING !!!!!!!!!!!
	const inviters = [];
	const embed = new Discord.MessageEmbed();
	embed.setAuthor('Quarantine Gaming: Member Approval');
	embed.setTitle('User Details');
	embed.setThumbnail(member.user.displayAvatarURL());
	embed.addFields([
		{ name: 'User:', value: member },
		{ name: 'Account Created:', value: `${created_day.toUTCString().replace('GMT', 'UTC')} (${created_day_difference.estimate})` },
		{ name: 'Inviter:', value: inviters.length > 0 ? inviters.map(this_invite => this_invite.inviter).join(' or ') : 'Information is not available.' },
	]);
	let reactions = new Array();
	if (member.user.bot) {
		embed.addField('Actions:', '🎶 - Music Bot     🧧 - NSFW Bot     ❌ - Kick     ⛔ - Ban');
		reactions = ['🎶', '🧧', '❌', '⛔'];
	}
	else {
		const MessageToSend = new Array();
		MessageToSend.push(`Hi ${member.user.username}, and welcome to **Quarantine Gaming**!`);
		MessageToSend.push('Please wait while we are processing your membership approval.');
		await client.message_manager.sendToUser(member, MessageToSend.join('\n'));

		embed.addField('Actions:', '✅ - Approve     ❌ - Kick     ⛔ - Ban');
		reactions = ['✅', '❌', '⛔'];
	}
	embed.setColor('#25c059');
	const message = await client.message_manager.sendToChannel(constants.channels.server.management, {
		content: `${member} wants to join this server. ${client.role(constants.roles.staff)} or ${client.role(constants.roles.moderator)} action is required.`,
		embed: embed,
	});
	for (const emoji of reactions) {
		client.reaction_manager.add(message, emoji);
	}
	return message;
};