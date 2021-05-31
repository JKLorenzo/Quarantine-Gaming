import fetchImage from './FetchImage.js';
import voiceChannelTransfer from './VoiceChannelTransfer.js';

/**
 * @typedef {import('discord').GuildMember} GuildMember
 * @typedef {import('discord').VoiceChannel} VoiceChannel
 * @typedef {import('../structures/Base').Client} Client
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
	 * Transfers a member to another voice channel.
 	 * @param {VoiceChannel} channel
 	 * @param {GuildMember[]} members
 	 */
	voiceChannelTransfer(channel, member) {
		return voiceChannelTransfer(channel, member);
	}
}