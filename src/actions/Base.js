// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');
const loadMembers = require('./LoadMembers.js');
const loadDedicatedChannels = require('./LoadDedicatedChannels.js');
const loadGameRoles = require('./LoadGameRoles.js');
const createDedicatedChannel = require('./CreateDedicatedChannel.js');
const memberScreening = require('./MemberScreening');

module.exports = class BaseActions {
	/** @param {import('../app.js')} app */
	constructor(app) {
		this.app = app;
	}

	loadMembers() {
		return loadMembers(this.app);
	}

	loadDedicatedChannels() {
		return loadDedicatedChannels(this.app);
	}

	loadGameRoles() {
		return loadGameRoles(this.app);
	}

	/**
	 * Dedicates a voice channel.
	 * @param {Discord.VoiceChannel} channel
	 * @param {String} name
	 */
	createDedicatedChannel(channel, name) {
		return createDedicatedChannel(this.app, channel, name);
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
		await this.loadDedicatedChannels();
		await this.loadGameRoles();
	}
};