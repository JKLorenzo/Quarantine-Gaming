/** @param {import('../app.js')} app */
module.exports = async function LoadMembers(app) {
	const ErrorTicketManager = new app.utils.ErrorTicketManager('Member Loading');

	/** @type {import('../structures/Base.js').ExtendedMember[]} */
	const members = app.guild.members.cache.array();

	try {
		// Link members and the database
		for (const member of members.filter(this_member => !this_member.user.bot)) {
			await member.init(app.database_manager);
		}

		// Check members
		const [ humans, bots ] = app.guild.members.cache.partition(user => !user.user.bot);
		for (const human of humans.array()) {
			if (human.roles.cache.has(app.utils.constants.roles.member)) continue;
			// HUMAN NO ACCESS
		}
		for (const bot of bots.array()) {
			if (bot.roles.cache.has(app.utils.constants.roles.bot)) continue;
			// BOT NO ACCESS
		}

		// Check for streaming members
		const streaming_role = app.role(app.utils.constants.roles.streaming);
		for (const member of streaming_role.members.array()) {
			if (member.voice.channelID) continue;
			await app.role_manager.remove(member, streaming_role);
		}
	}
	catch (error) {
		app.error_manager.mark(ErrorTicketManager.create('Initialize Member', error));
		throw error;
	}
};