import {
  CategoryChannel,
  Client,
  GuildChannel,
  GuildChannelResolvable,
  Message,
  MessageAttachment,
  MessageOptions,
  MessagePayload,
  Snowflake,
  TextChannel,
  UserResolvable,
} from 'discord.js';
import ExtendedMessage from '../structures/ExtendedMessage.js';
import constants from '../utils/Constants.js';
import ErrorTicketManager from '../utils/ErrorTicketManager.js';
import { contains } from '../utils/Functions.js';
import ProcessQueue from '../utils/ProcessQueue.js';

const ETM = new ErrorTicketManager('Message Manager');

export default class MessageManager {
  client: Client;
  queuer: ProcessQueue;

  constructor(client: Client) {
    this.client = client;
    this.queuer = new ProcessQueue(1000);

    client.on('message', message => {
      if (message.author.bot) return;
      if (message.guild === null) {
        return this.processIncomingDM(message);
      }

      if (message.guild.id !== `${constants.cs.guild}`) return;
      if (message.channel instanceof GuildChannel && message.channel.parentID) {
        switch (message.channel.parentID) {
          case constants.cs.channels.category.dm:
            return this.processOutgoingDM(message);
          case constants.cs.channels.category.dc:
            return this.processDirectChannels(message);
        }
      }
    });
  }

  sendToChannel(
    channel: GuildChannelResolvable,
    options: string | MessagePayload | MessageOptions,
  ): Promise<Message> {
    const this_channel = this.client.channel(channel);
    console.log(
      `MessageChannelSend: Queueing ${this.queuer.totalID} (${
        (this_channel as TextChannel)?.name ?? channel
      })`,
    );
    return this.queuer.queue(async () => {
      let result, error;
      try {
        if (this_channel && this_channel.isText()) {
          result = await this_channel.send(options);
        } else {
          throw new TypeError(`\`${channel}\` is not a text-based channel.`);
        }
      } catch (this_error) {
        this.client.error_manager.mark(ETM.create('sendToChannel', this_error));
        error = this_error;
      } finally {
        console.log(
          `MessageChannelSend: Finished ${this.queuer.currentID} (${
            (this_channel as TextChannel)?.name ?? channel
          })`,
        );
      }
      if (error) throw error;
      return result;
    }) as Promise<Message>;
  }

  sendToUser(
    user: UserResolvable,
    options: string | MessagePayload | MessageOptions,
  ): Promise<Message> {
    const member = this.client.member(user);
    console.log(
      `MessageUserSend: Queueing ${this.queuer.totalID} (${
        member?.displayName ?? user
      })`,
    );
    return this.queuer.queue(async () => {
      let result, error;
      try {
        if (member) {
          result = await member.send(options);
          (result as ExtendedMessage).delete({ timeout: 3600000 });
        } else {
          throw new TypeError(`\`${user}\` is not a member.`);
        }
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
    }) as Promise<Message>;
  }

  async processIncomingDM(message: Message): Promise<void> {
    try {
      const this_member = this.client.member(message.author);
      if (!this_member) return;

      const dm_category = this.client.channel(
        `${constants.cs.channels.category.dm}`,
      ) as CategoryChannel;

      const dm_channel = (dm_category!.children.find(
        c => c.isText() && contains(c.topic ?? '', this_member.toString()),
      ) ??
        (await this.client.channel_manager.create(this_member.displayName, {
          guild: 'cs',
          parent: dm_category,
          topic:
            `Direct message handler for ${this_member}. ` +
            'You can reply to this user by sending a message to this channel.',
        }))) as TextChannel;

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
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            this.client.channel_manager.delete(c).catch(() => {});
          });
      }

      await this.sendToChannel(dm_channel, {
        content: message.content?.length ? message.content : undefined,
        files: message.attachments?.map(
          msg_attachment => new MessageAttachment(msg_attachment.attachment),
        ),
      });
    } catch (error) {
      this.client.error_manager.mark(ETM.create('processIncomingDM', error));
    }
  }

  async processOutgoingDM(message: Message): Promise<void> {
    try {
      const topic = (message.channel as TextChannel).topic;
      const user = topic
        ?.split(' ')
        .find(word => this.client.member(`${BigInt(word)}`));
      if (!user) return;
      const this_member = this.client.member(`${BigInt(user)}`);
      if (!this_member) return;

      const reply = await this.sendToUser(this_member, {
        content: message.content?.length ? message.content : undefined,
        files: message.attachments?.map(
          msg_attachment => new MessageAttachment(msg_attachment.attachment),
        ),
      });

      if (reply) {
        const emojis = this.client.emojis.cache;
        const check_emoji = emojis.find(e => e.name === 'checkgreen');
        if (check_emoji) {
          await this.client.reaction_manager.add(message, check_emoji);
        }
      }
    } catch (error) {
      this.client.error_manager.mark(ETM.create('processOutgoingDM', error));
    }
  }

  async processDirectChannels(message: Message): Promise<void> {
    try {
      let channel: Snowflake;
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
        default:
          return;
      }

      await this.sendToChannel(`${channel}`, {
        content: message.content?.length ? message.content : undefined,
        files: message.attachments?.map(
          msg_attachments => new MessageAttachment(msg_attachments.attachment),
        ),
      });
    } catch (error) {
      this.client.error_manager.mark(
        ETM.create('processDirectChannels', error),
      );
    }
  }
}
