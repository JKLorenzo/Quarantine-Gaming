import fetchImage from './FetchImage.js';
import voiceChannelTransfer from './VoiceChannelTransfer.js';

/**
 * @typedef {import('discord').GuildMember} GuildMember
 * @typedef {import('discord').VoiceChannel} VoiceChannel
 * @typedef {import('../structures/Base').Client} Client
 */

export default class BaseMethods {
  /**
   * @param {Client} client The QG Client
   */
  constructor(client) {
    this.client = client;
  }

  /**
   * Fetches an image online or from the database when it exists.
   * @param {string} title The title of the image to be searched
   * @typedef {Object} ImageData
   * @property {string} [small]
   * @property {string} [large]
   * @returns {Promise<ImageData>}
   */
  fetchImage(title) {
    return fetchImage(this.client, title);
  }

  /**
   * Transfers a member to another voice channel.
   * @param {VoiceChannel} channel The channel where the members will be transferred
   * @param {GuildMember[]} members The members to transfer
   * @param {string} [message] The message to send after a successfull transfer
   * @returns {Promise<null>}
   */
  voiceChannelTransfer(channel, members, message) {
    return voiceChannelTransfer(this.client, channel, members, message);
  }
}
