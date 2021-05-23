import { MessageEmbed } from 'discord.js';
import { constants } from '../utils/Base.js';

/**
 * @typedef {import('discord.js').Role} Role
 * @typedef {import('discord.js').TextChannel} TextChannel
 * @typedef {import('../structures/Base').Client} Client
 * @typedef {import('../structures/Base').ExtendedMember} ExtendedMember
 */

/**
 * @param {Client} client
 * @param {ExtendedMember} oldMember
 * @param {ExtendedMember} newMember
 */
export default async function onGuildMemberUpdate(client, oldMember, newMember) {
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
	if (newMember.displayName != oldMember.displayName) description.push(`**Nickname:** \nOld: ${oldMember.displayName} \nNew: ${newMember.displayName}`);
	if (role_add.length) description.push(`**Role Added:** ${role_add.map(role => role.name).join(', ')}`);
	if (role_removed.length) description.push(`**Role Removed:** ${role_removed.map(role => role.name).join(', ')}`);

	if (description.length > 1) {
		client.message_manager.sendToChannel(constants.interface.channels.member_events, new MessageEmbed({
			author: { name: 'Quarantine Gaming: Member Update Events' },
			title: 'Member Property Changed',
			description: description.join('\n'),
			thumbnail: { url: newMember.user.displayAvatarURL() },
			footer: { text: `Reference ID: ${newMember.user.id}` },
			color: '#E1F358',
		}));
	}
}