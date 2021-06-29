import { ErrorTicketManager, ProcessQueue, sleep } from '../utils/Base.js';

/**
 * @typedef {import('discord.js').Channel} Channel
 * @typedef {import('discord.js').TextChannel} TextChannel
 * @typedef {import('discord.js').GuildChannel} GuildChannel
 * @typedef {import('discord.js').OverwriteResolvable} OverwriteResolvable
 * @typedef {import('discord.js').GuildChannelResolvable} GuildChannelResolvable
 * @typedef {import('../structures/Base').Client} Client
 */

/**
 * @typedef {Object} createOptions
 * @property {'qg' | 'cs'} [guild] Defaults to Quarantine Gaming
 * @property {'text' | 'voice' | 'category' | 'news' | 'store' | 'stage'} [type]
 * @property {string} [topic]
 * @property {boolean} [nsfw]
 * @property {number} [bitrate]
 * @property {number} [userLimit]
 * @property {GuildChannelResolvable} [parent]
 * @property {OverwriteResolvable[] | import('discord.js').Collection<string, OverwriteResolvable>} [PermissionOverwrites]
 * @property {number} [position]
 * @property {number} [rateLimitPerUser]
 * @property {string} [reason]
 */

const ETM = new ErrorTicketManager('Channel Manager');

export default class ChannelManager {
  /**
   * @param {Client} client The QG Client
   */
  constructor(client) {
    this.client = client;
    this.queuer = new ProcessQueue(1000);
  }

  /**
   * Creates a new channel in the guild.
   * @param {string} name The name of the channel to create
   * @param {createOptions} [options] The options of this channel
   * @returns {Promise<GuildChannel>}
   */
  create(name, options) {
    console.log(`ChannelCreate: Queueing ${this.queuer.totalID} (${name})`);
    return this.queuer.queue(async () => {
      let result, error;
      try {
        if (options?.guild === 'cs') {
          result = await this.client.cs.channels.create(name, options);
        } else {
          result = await this.client.qg.channels.create(name, options);
        }
      } catch (this_error) {
        this.client.error_manager.mark(ETM.create('create', this_error));
        error = this_error;
      } finally {
        console.log(
          `ChannelCreate: Finished ${this.queuer.currentID} (${name})`,
        );
      }
      if (error) throw error;
      return result;
    });
  }

  /**
   * Deletes a guild channel.
   * @param {GuildChannelResolvable} channel The channel to delete
   * @param {string} [reason] The reason for deleting this channel
   * @returns {Promise<Channel>}
   */
  delete(channel, reason) {
    const this_channel = this.client.channel(channel);
    console.log(
      `ChannelDelete: Queueing ${this.queuer.totalID} (${
        this_channel?.name ?? channel
      })`,
    );
    return this.queuer.queue(async () => {
      let result, error;
      try {
        if (this_channel?.deletable) result = await this_channel.delete(reason);
      } catch (this_error) {
        this.client.error_manager.mark(ETM.create('delete', this_error));
        error = this_error;
      } finally {
        console.log(
          `ChannelDelete: Finished ${this.queuer.totalID} (${
            this_channel?.name ?? channel
          })`,
        );
      }
      if (error) throw error;
      return result;
    });
  }

  /**
   * Deletes the messages from these channels.
   * @param {GuildChannelResolvable | GuildChannelResolvable[]} channel The channel or channels to clear
   */
  clear(channel) {
    try {
      let resolvables = [];
      if (channel instanceof Array) {
        resolvables = [...channel];
      } else {
        resolvables.push(channel);
      }

      for (const this_channel of resolvables) {
        /** @type {TextChannel} */
        const text_channel = this.client.channel(this_channel);
        if (!text_channel && !text_channel.isText()) continue;
        text_channel.messages
          .fetch()
          .then(messages => messages.array())
          .then(async messages => {
            for (const message of messages) {
              message.delete({ timeout: 900000 });
              await sleep(5000);
            }
          });
      }
    } catch (error) {
      this.client.error_manager.mark(ETM.create('clear', error));
      throw error;
    }
  }
}
