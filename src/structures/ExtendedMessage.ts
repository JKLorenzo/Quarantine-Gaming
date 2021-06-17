import {
  Client,
  Message,
  TextChannel,
  DMChannel,
  NewsChannel,
} from 'discord.js';

export default class ExtendedMessage extends Message {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    client: Client,
    data: unknown,
    channel: TextChannel | DMChannel | NewsChannel,
  ) {
    super(client, data, channel);
  }

  delete(options = { timeout: 0 }): Promise<Message> {
    if (options.timeout && options.timeout > 0) {
      return new Promise<Message>(resolve => {
        setTimeout(() => {
          super.delete().then(resolve);
        }, options.timeout);
      });
    }
    return super.delete();
  }
}
