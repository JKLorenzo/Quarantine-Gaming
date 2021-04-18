/**
 * @typedef {import('../structures/Base.js').Client} Client
 * @typedef {import('../structures/Base.js').ExtendedMember} ExtendedMember
 */

/** @param {Client} client */
module.exports = async function FlushExpiredGameRoles(client) {
	/** @type {ExtendedMember[]} */
	const members = client.guild.members.cache.array();
	for (const member of members) {
		if (member.user.bot) continue;
		const expired_game_roles_partial = await member.getExpiredGameRoles();
		for (const expired_game_role_partial of expired_game_roles_partial) {
			await member.deleteGameRole(expired_game_role_partial.id);
		}
	}
};