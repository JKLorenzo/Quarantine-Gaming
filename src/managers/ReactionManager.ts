import { Emoji, EmojiResolvable, Message, MessageReaction } from 'discord.js';
import QGClient from '../structures/Client.js';
import ErrorTicketManager from '../utils/ErrorTicketManager.js';
import { sleep } from '../utils/Functions.js';
import ProcessQueue from '../utils/ProcessQueue.js';

const ETM = new ErrorTicketManager('Reaction Manager');

export default class ReactionManager {
  client: QGClient;
  queuer: ProcessQueue;

  constructor(client: QGClient) {
    this.client = client;
    this.queuer = new ProcessQueue(1000);
  }

  add(
    message: Message,
    emoji: EmojiResolvable | EmojiResolvable[],
  ): Promise<MessageReaction | MessageReaction[]> {
    console.log(
      `ReactionAdd: Queueing ${this.queuer.totalID} (${message.channel.id} | ${
        (emoji as Emoji).name ?? emoji
      }})`,
    );
    return this.queuer.queue(async () => {
      let result, error;
      try {
        if (Array.isArray(emoji)) {
          result = [];
          for (const this_emoji of emoji) {
            result.push(await message.react(this_emoji));
            await sleep(this.queuer.timeout);
          }
        } else {
          result = await message.react(emoji);
        }
      } catch (this_error) {
        this.client.error_manager.mark(ETM.create('add', this_error));
        error = this_error;
      } finally {
        console.log(
          `ReactionAdd: Finished ${this.queuer.currentID} (${
            message.channel.id
          } | ${(emoji as Emoji).name ?? emoji}})`,
        );
      }
      if (error) throw error;
      return result;
    }) as Promise<MessageReaction | MessageReaction[]>;
  }
}
