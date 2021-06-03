import { MessageEmbed } from 'discord.js';
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
        // Game Invites Channel Blocking
        if (
          message.channel &&
          message.channel.id ===
            constants.qg.channels.integrations.game_invites &&
          (message.embeds.length === 0 ||
            (message.embeds.length > 0 &&
              message.embeds[0].author.name !==
                'Quarantine Gaming: Game Coordinator'))
        ) {
          client.message_manager
            .sendToUser(
              message.author,
              `Hello there! You can't send any messages in ${message.channel} channel.`,
            )
            .then(reply => {
              message.delete({ timeout: 2500 });
              reply.delete({ timeout: 2500 });
            });
        }

        // DM
        if (message.guild === null) {
          const this_member = client.member(message.author);
          if (this_member && !this_member.user.bot) {
            const embed = new MessageEmbed();
            embed.setAuthor('Quarantine Gaming: Direct Message Handler');
            embed.setTitle('New Message');
            embed.setThumbnail(message.author.displayAvatarURL());
            embed.addField('Sender:', this_member.toString());
            embed.addField('Message:', message.content);
            embed.setFooter(
              `To reply, do: !message dm ${this_member.user.id} <message>`,
            );
            embed.setColor('#00ff6f');
            client.message_manager.sendToChannel(
              constants.cs.channels.dm,
              embed,
            );
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
        this_channel ? this_channel.name : channel
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
            this_channel ? this_channel.name : channel
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
        member ? member.displayName : user
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
            member ? member.displayName : user
          })`,
        );
      }
      if (error) throw error;
      return result;
    });
  }
}
