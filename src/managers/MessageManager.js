import { ErrorTicketManager, ProcessQueue, constants } from '../utils/Base.js';

/**
 * @typedef {import('discord.js').Message} Message
 * @typedef {import('discord.js').TextChannel} TextChannel
 * @typedef {import('discord.js').UserResolvable} UserResolvable
 * @typedef {import('discord.js').MessageOptions} MessageOptions
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

    client.on('message', message => {
      try {
        // DM
        if (message.guild === null) {
          const this_member = client.member(message.author);
          if (this_member && !this_member.user.bot) {
            this.sendToChannel(constants.cs.channels.dm, {
              content: `**${this_member.displayName}**:\n${
                message.content ?? ''
              }`,
              files: message.attachments?.map(file => ({
                attachment: file.attachment,
                name: file.name,
                data: file.data,
              })),
            });
          }
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
}
