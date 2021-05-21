import { constants } from '../utils/Base.js';

/**
 * @typedef {import('../structures/Base').Client} Client
 * @typedef {import('../structures/Base').ExtendedMember} ExtendedMember
 */

/** @param {Client} client */
export default async function LoadMembers(client) {
	/** @type {ExtendedMember[]} */
	const members = client.guild.members.cache.array();

	// Link members and the database
	for (const member of members.filter(this_member => !this_member.user.bot)) {
		await member.init();
	}

	// Check for streaming members
	const streaming_role = client.role(constants.roles.streaming);
	for (const member of streaming_role.members.array()) {
		if (member.voice.channelID) continue;
		await client.role_manager.remove(member, streaming_role);
	}
}