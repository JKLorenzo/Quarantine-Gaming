import fetchImage from './FetchImage.js';
import loadMembers from './LoadMembers.js';
import voiceChannelTransfer from './VoiceChannelTransfer.js';

/**
 * @typedef {import('discord').GuildMember} GuildMember
 * @typedef {import('discord').VoiceChannel} VoiceChannel
 * @typedef {import('../structures/Base').Client} Client
 * @typedef {import('../structures/Base').ExtendedMember} ExtendedMember
 */

export default class BaseMethods {
	/** @param {Client} client */
	constructor(client) {
		this.client = client;
	}

	/**
	 * Fetches an image online or from the database when it exists.
	 * @param {String} title
	 */
	fetchImage(title) {
		return fetchImage(this.client, title);
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
}