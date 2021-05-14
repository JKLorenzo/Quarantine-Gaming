const { MessageEmbed } = require('discord.js');
const { constants } = require('../utils/Base.js');

/**
 * @typedef {import('../structures/Base.js').Client} Client
 * @typedef {import('../structures/Base.js').ExtendedMember} ExtendedMember
 * @typedef {import('discord.js').Role} Role
 * @typedef {import('discord.js').TextChannel} TextChannel
 */

/**
 * @param {Client} client
 * @param {ExtendedMember} oldMember
 * @param {ExtendedMember} newMember
 */
module.exports = async function onGuildMemberUpdate(client, oldMember, newMember) {
	if (newMember.pending == false && oldMember.pending != newMember.pending) {
		/** @type {TextChannel} */
		const management_channel = client.channel(constants.channels.server.management);
		const messages = await management_channel.messages.fetch();
		const member_approval_requests = messages.filter(message => message.embeds.length && message.embeds[0].title == 'Member Approval Request');
		const this_member_approval_request = member_approval_requests.find(message => {
			const member = client.member(message.embeds[0].fields[0].value);
			if (member) return member.id == newMember.id && message.embeds[0].fields[3].value == 'Pending';
			return false;
		});
		if (this_member_approval_request) {
			if (!newMember.user.bot) {
				client.message_manager.sendToUser(newMember, [
					`Hi ${newMember.user.username}, and welcome to **Quarantine Gaming**!`,
					'Please wait while we are processing your membership approval.',
				].join('\n'));
			}
			const reply_embed = this_member_approval_request.embeds[0];
			reply_embed.fields[3].value = 'Action Required';
			reply_embed.setFooter('✅ - Approve     ❌ - Kick     ⛔ - Ban');
			await this_member_approval_request.edit({
				content:`${newMember} wants to join this server.`,
				embed: reply_embed,
			});
			await client.reaction_manager.add(this_member_approval_request, ['✅', '❌', '⛔']);
			await this_member_approval_request.reply(`${client.role(constants.roles.staff)}, ${client.role(constants.roles.moderator)}, or ${client.role(constants.roles.booster)} action is required.`, { allowedMentions: { parse: ['roles'] } }).then(reply => {
				reply.delete({ timeout: 10000 }).catch(e => void e);
			});
		}
	}

	/** @type {Role[]} */
	const role_add = new Array();
	/** @type {Role[]} */
	const role_removed = new Array();
	if (newMember.roles.cache.size != oldMember.roles.cache.size) {
		for (const this_role of newMember.roles.cache.difference(oldMember.roles.cache).array()) {
			const isNew = newMember.roles.cache.has(this_role.id);
			if (this_role.name.startsWith('Team 🔰')) continue;
			if (this_role.id == constants.roles.streaming) continue;
			if (this_role.hexColor == constants.colors.play_role) continue;
			if (this_role.hexColor == constants.colors.game_role) {
				if (isNew) await client.database_manager.deleteMemberGameRole(newMember.id, this_role.id);
				continue;
			}
			isNew ? role_add.push(this_role) : role_removed.push(this_role);
		}
	}

	const description = [`**Profile:** ${newMember}`];
	if (newMember.displayName != oldMember.displayName) description.push(`**Nickname:** ${oldMember.displayName} -> ${newMember.displayName}`);
	if (role_add.length) description.push(`**Role Added:** ${role_add.map(role => role.name).join(', ')}`);
	if (role_removed.length) description.push(`**Role Removed:** ${role_removed.map(role => role.name).join(', ')}`);

	if (description.length > 1) {
		client.message_manager.sendToChannel(constants.interface.channels.logs, new MessageEmbed({
			author: { name: 'Quarantine Gaming: Member Update Events' },
			title: 'Member Property Changed',
			description: description.join('\n'),
			thumbnail: { url: newMember.user.displayAvatarURL() },
			footer: { text: `Reference ID: ${newMember.user.id}` },
			color: '#E1F358',
		}));
	}
};