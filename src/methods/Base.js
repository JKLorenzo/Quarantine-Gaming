const loadMembers = require('./LoadMembers.js');
const flushExpiredGameRoles = require('./FlushExpiredGameRoles.js');
const loadGameRoles = require('./LoadGameRoles.js');
const screenMember = require('./ScreenMember');

/**
 * @typedef {import('../structures/Base.js').Client} Client
 * @typedef {import('discord.js').GuildMember} GuildMember
 */

module.exports = class BaseMethods {
	/** @param {Client} client */
	constructor(client) {
		this.client = client;
	}

	loadMembers() {
		return loadMembers(this.client);
	}

	flushExpiredGameRoles() {
		return flushExpiredGameRoles(this.client);
	}

	loadGameRoles() {
		return loadGameRoles(this.client);
	}

	/**
	 * Allow staff and moderator to screen this member.
	 * @param {GuildMember} member
	 */
	screenMember(member) {
		return screenMember(this.client, member);
	}
};