const loadMembers = require('./LoadMembers.js');
const screenMember = require('./ScreenMember');
const voiceChannelTransfer = require('./VoiceChannelTransfer.js');

/**
 * @typedef {import('../structures/Base.js').Client} Client
 * @typedef {import('../structures/Base.js').ExtendedMember} ExtendedMember
 * @typedef {import('discord.js').GuildMember} GuildMember
 * @typedef {import('discord.js').VoiceChannel} VoiceChannel
 */

module.exports = class BaseMethods {
	/** @param {Client} client */
	constructor(client) {
		this.client = client;
	}

	/**
	 * Loads all the members and connects them to the database.
	 */
	loadMembers() {
		return loadMembers(this.client);
	}

	/**
	 * Allow staff and moderator to screen this member.
	 * @param {GuildMember} member
	 */
	screenMember(member) {
		return screenMember(this.client, member);
	}

	/**
	 * Transfers a member to another voice channel.
 	 * @param {VoiceChannel} channel
 	 * @param {ExtendedMember[]} members
 	 */
	voiceChannelTransfer(channel, member) {
		return voiceChannelTransfer(channel, member);
	}
};