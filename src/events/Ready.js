/**
 * @param {import('../app.js')} app
 */
module.exports = async function onceReady(app) {
	await app.actions.startup();

	// check for users who doesn't have a member or bot role
	for (const member of app.guild.members.cache.array()) {
		if (member.user.bot && member.roles.cache.has(app.utils.constants.roles.bot)) continue;
		if (!member.user.bot && member.roles.cache.has(app.utils.constants.roles.member)) continue;
		if (member.pending) continue;
		app.actions.memberScreening(member);
	}
};