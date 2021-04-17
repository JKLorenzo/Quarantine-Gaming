/** @param {import('../app.js')} app */
module.exports = async function LoadMembers(app) {
	const ErrorTicketManager = new app.utils.ErrorTicketManager('LoadMembers');

	/** @type {import('../structures/Base.js').ExtendedMember[]} */
	const members = app.guild.members.cache.array();

	try {
		// Link members and the database
		for (const member of members.filter(this_member => !this_member.user.bot)) {
			await member.init(app);
		}

		// Check for users who doesn't have a member or bot role
		for (const member of members) {
			if (member.user.bot && member.roles.cache.has(app.utils.constants.roles.bot)) continue;
			if (!member.user.bot && member.roles.cache.has(app.utils.constants.roles.member)) continue;
			if (member.pending) continue;
			await app.actions.screenMember(member);
		}

		// Check for streaming members
		const streaming_role = app.role(app.utils.constants.roles.streaming);
		for (const member of streaming_role.members.array()) {
			if (member.voice.channelID) continue;
			await app.role_manager.remove(member, streaming_role);
		}
	}
	catch (error) {
		app.error_manager.mark(ErrorTicketManager.create('InitializeMembers', error));
		throw error;
	}
};