import {
  Channel,
  ExtendedMessage,
  Guild,
  GuildChannel,
  GuildChannelResolvable,
  GuildCreateChannelOptions,
  TextChannel,
  VoiceChannel,
} from 'discord.js';
import QGClient from '../structures/Client.js';
import ErrorTicketManager from '../utils/ErrorTicketManager.js';
import { sleep } from '../utils/Functions.js';
import ProcessQueue from '../utils/ProcessQueue.js';

const ETM = new ErrorTicketManager('Channel Manager');

export default class ChannelManager {
  client: QGClient;
  queuer: ProcessQueue;

  constructor(client: QGClient) {
    this.client = client;
    this.queuer = new ProcessQueue(1000);
  }

  create(
    name: string,
    options: GuildCreateChannelOptions & { guild?: 'qg' | 'cs' },
  ): Promise<GuildChannel> {
    console.log(`ChannelCreate: Queueing ${this.queuer.totalID} (${name})`);

    return this.queuer.queue(async () => {
      let result, error;
      try {
        let guild: Guild;
        if ('guild' in options && options.guild === 'cs') {
          guild = this.client.cs;
        } else {
          guild = this.client.qg;
        }
        result = await guild.channels.create(name, options);
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
    }) as Promise<GuildChannel>;
  }

  delete(channel: GuildChannelResolvable, reason?: string): Promise<Channel> {
    const this_channel = this.client.channel(channel) as
      | TextChannel
      | VoiceChannel;

    console.log(
      `ChannelDelete: Queueing ${this.queuer.totalID} (${
        this_channel?.name ?? channel
      })`,
    );

    return this.queuer.queue(async () => {
      let result, error;
      try {
        result = await this_channel?.delete(reason);
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
    }) as Promise<Channel>;
  }

  clear(channel: GuildChannelResolvable | GuildChannelResolvable[]): void {
    try {
      let channels: GuildChannelResolvable[];
      if (Array.isArray(channel)) {
        channels = channel;
      } else {
        channels = [channel];
      }

      for (const this_channel of channels) {
        const text_channel = this.client.channel(this_channel);
        if (text_channel && text_channel.isText()) {
          text_channel.messages
            .fetch()
            .then(messages => messages.array())
            .then(async messages => {
              for (const message of messages) {
                (message as ExtendedMessage).delete({ timeout: 900000 });
                await sleep(5000);
              }
            });
        }
      }
    } catch (error) {
      this.client.error_manager.mark(ETM.create('clear', error));
      throw error;
    }
  }
}
