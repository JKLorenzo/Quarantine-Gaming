/* eslint-disable no-await-in-loop */
import { sleep, constants } from '../utils/Base.js';

/**
 * @typedef {import('discord.js').GuildMember} GuildMember
 * @typedef {import('discord.js').VoiceChannel} VoiceChannel
 * @typedef {import('../structures/Base').Client} Client
 */

/**
 * @param {Client} client The QG Client
 * @param {VoiceChannel} channel The channel where the members will be transferred
 * @param {GuildMember[]} members The members to transfer
 * @param {string} [message] The message to send after a successfull transfer
 * @returns {Promise<null>}
 */
export default async function voiceChannelTransfer(
  client,
  channel,
  members,
  message,
) {
  for (const this_member of members) {
    if (!this_member.voice || this_member.user.id === constants.me) continue;
    await this_member.voice.setChannel(channel);
    if (message) client.message_manager.sendToUser(this_member, message);
    await sleep(500);
  }
}
