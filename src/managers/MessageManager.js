import {
  ErrorTicketManager,
  ProcessQueue,
  constants,
  contains,
} from '../utils/Base.js';

/**
 * @typedef {import('discord.js').Message} Message
 * @typedef {import('discord.js').TextChannel} TextChannel
 * @typedef {import('discord.js').UserResolvable} UserResolvable
 * @typedef {import('discord.js').MessageOptions} MessageOptions
 * @typedef {import('discord.js').CategoryChannel} CategoryChannel
 * @typedef {import('discord.js').MessageAdditions} MessageAdditions
 * @typedef {import('discord.js').GuildChannelResolvable} GuildChannelResolvable
 * @typedef {import('discord.js').APIMessageContentResolvable} APIMessageContentResolvable
 * @typedef {import('../structures/Base').Client} Client
 */

const ETM = new ErrorTicketManager('Message Manager');

export default class MessageManager {
  /**
   * @param {Client} client The QG Client
   */
  constructor(client) {
    this.client = client;
    this.queuer = new ProcessQueue(1000);

    client.on('message', async message => {
      try {
        if (message.author.bot) return;
        if (message.guild === null) {
          await this.processIncomingDM(message);
        }

        if (message.guild.id !== constants.cs.guild) return;
        switch (message.channel.parentID) {
          case constants.cs.channels.category.dm:
            await this.processOutgoingDM(message);
            break;

          case constants.cs.channels.category.dc:
            await this.processDirectChannels(message);
            break;
        }
      } catch (error) {
        this.client.error_manager.mark(ETM.create('message', error));
      }
    });
  }

  /**
   * Sends a message to a channel.
   * @param {GuildChannelResolvable} channel The channel where the message will be sent
   * @param {MessageOptions | MessageAdditions} message The message object to send
   * @returns {Promise<Message>}
   */
  sendToChannel(channel, message) {
    /** @type {TextChannel} */
    const this_channel = this.client.channel(channel);
    console.log(
      `MessageChannelSend: Queueing ${this.queuer.totalID} (${
        this_channel?.name ?? channel
      })`,
    );
    return this.queuer.queue(async () => {
      let result, error;
      try {
        result = await this_channel.send(message);
      } catch (this_error) {
        this.client.error_manager.mark(ETM.create('sendToChannel', this_error));
        error = this_error;
      } finally {
        console.log(
          `MessageChannelSend: Finished ${this.queuer.currentID} (${
            this_channel?.name ?? channel
          })`,
        );
      }
      if (error) throw error;
      return result;
    });
  }

  /**
   * Sends a message to a user then deletes it after some time.
   * @param {UserResolvable} user The user where the message will be sent
   * @param {MessageOptions | MessageAdditions} content The message object to send
   * @returns {Promise<Message>}
   */
  sendToUser(user, content) {
    const member = this.client.member(user);
    console.log(
      `MessageUserSend: Queueing ${this.queuer.totalID} (${
        member?.displayName ?? user
      })`,
    );
    return this.queuer.queue(async () => {
      let result, error;
      try {
        result = await member.send(content);
        result.delete({ timeout: 3600000 });
      } catch (this_error) {
        this.client.error_manager.mark(ETM.create('sendToUser', this_error));
        error = this_error;
      } finally {
        console.log(
          `MessageUserSend: Finished ${this.queuer.currentID} (${
            member?.displayName ?? user
          })`,
        );
      }
      if (error) throw error;
      return result;
    });
  }

  /**
   * @private
   * @param {Message} message The message received
   */
  async processIncomingDM(message) {
    const this_member = this.client.member(message.author);
    if (!this_member) return;

    /** @type {CategoryChannel} */
    const dm_category = this.client.channel(constants.cs.channels.category.dm);

    /** @type {TextChannel} */
    const dm_channel =
      dm_category.children.find(
        c => c.isText() && contains(c.topic, this_member.toString()),
      ) ??
      (await this.client.channel_manager.create(this_member.displayName, {
        guild: 'cs',
        parent: dm_category,
        topic:
          `Direct message handler for ${this_member}. ` +
          'You can reply to this user by sending a message to this channel.',
      }));

    if (dm_channel.name !== this_member.displayName) {
      await dm_channel.setName(this_member.displayName);
    }

    if (dm_channel.position !== 0) {
      await dm_channel.setPosition(0);
    }

    // Max of 5 dm channels
    if (dm_category.children.size > 5) {
      dm_category.children
        .filter(c => c.position > 4)
        .forEach(c => {
          // eslint-disable-next-line no-empty-function
          this.client.channel_manager.delete(c).catch(() => {});
        });
    }

    await this.sendToChannel(dm_channel, {
      content: message.content?.length ? message.content : null,
      files: message.attachments?.map(file => ({
        attachment: file.attachment,
        name: file.name,
        data: file.data,
      })),
    });
  }

  /**
   * @private
   * @param {Message} message The message sent
   */
  async processOutgoingDM(message) {
    /** @type {string} */
    const topic = message.channel.topic;
    const this_member = this.client.member(
      topic.split(' ').find(w => this.client.member(w)),
    );
    if (!this_member) return;

    const reply = await this.sendToUser(this_member, {
      content: message.content?.length ? message.content : null,
      files: message.attachments?.map(file => ({
        attachment: file.attachment,
        name: file.name,
        data: file.data,
      })),
    });

    if (reply) {
      const emojis = this.client.emojis.cache;
      await this.client.reaction_manager.add(
        message,
        emojis.find(e => e.name === 'checkgreen'),
      );
    }
  }

  /**
   * @private
   * @param {Message} message The message sent
   */
  async processDirectChannels(message) {
    const message_data = {
      content: message.content?.length ? message.content : null,
      files: message.attachments?.map(file => ({
        attachment: file.attachment,
        name: file.name,
        data: file.data,
      })),
    };

    let channel = '';
    switch (message.channel.id) {
      case constants.cs.channels.dc_announcements:
        channel = constants.qg.channels.server.announcements;
        break;
      case constants.cs.channels.dc_rules:
        channel = constants.qg.channels.server.rules;
        break;
      case constants.cs.channels.dc_roles:
        channel = constants.qg.channels.server.roles;
        break;
      case constants.cs.channels.dc_guides:
        channel = constants.qg.channels.server.guides;
        break;
      case constants.cs.channels.dc_suggestions:
        channel = constants.qg.channels.server.suggestions;
        break;
    }

    if (channel) {
      await this.client.message_manager.sendToChannel(channel, message_data);
    }
  }
}
