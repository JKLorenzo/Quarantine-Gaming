const loadMembers = require('./LoadMembers.js');
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
	 * Transfers a member to another voice channel.
 	 * @param {VoiceChannel} channel
 	 * @param {ExtendedMember[]} members
 	 */
	voiceChannelTransfer(channel, member) {
		return voiceChannelTransfer(channel, member);
	}
};