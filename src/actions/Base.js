// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');
const loadMembers = require('./LoadMembers.js');
const flushExpiredGameRoles = require('./FlushExpiredGameRoles.js');
const loadGameRoles = require('./LoadGameRoles.js');
const memberScreening = require('./MemberScreening');

module.exports = class BaseActions {
	/** @param {import('../app.js')} app */
	constructor(app) {
		this.app = app;
	}

	loadMembers() {
		return loadMembers(this.app);
	}

	flushExpiredGameRoles() {
		return flushExpiredGameRoles(this.app);
	}

	loadGameRoles() {
		return loadGameRoles(this.app);
	}

	/**
	 * Allow staff and moderator to screen this member.
	 * @param {Discord.GuildMember} member
	 */
	memberScreening(member) {
		return memberScreening(this.app, member);
	}

	async startup() {
		await this.loadMembers();
		await this.loadGameRoles();
		await this.flushExpiredGameRoles();
		await this.app.dedicated_channel_manager.autoDedicate();
	}
};