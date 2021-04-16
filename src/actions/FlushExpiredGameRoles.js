/** @param {import('../app.js')} app */
module.exports = async function FlushExpiredGameRoles(app) {
	/** @type {import('../structures/Base.js').ExtendedMember[]} */
	const members = app.guild.members.cache.array();
	for (const member of members) {
		if (member.user.bot) continue;
		const expired_game_roles_partial = await member.getExpiredGameRoles();
		for (const expired_game_role_partial of expired_game_roles_partial) {
			await member.deleteGameRole(expired_game_role_partial.id);
		}
	}
};