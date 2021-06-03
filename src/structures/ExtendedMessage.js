import { Message } from 'discord.js';

export default class ExtendedMessage extends Message {
  // eslint-disable-next-line no-useless-constructor
  constructor(client, data, channel) {
    super(client, data, channel);
  }

  /**
   * @param {{timeout: number}} options The delete options
   * @returns {Promise<ExtendedMessage>}
   */
  delete(options = {}) {
    return new Promise(resolve => {
      if (options.timeout > 0) {
        setTimeout(() => {
          super
            .delete()
            .then(result => resolve(result))
            // eslint-disable-next-line no-empty-function
            .catch(() => {});
        }, options.timeout);
      } else {
        super
          .delete()
          .then(result => resolve(result))
          // eslint-disable-next-line no-empty-function
          .catch(() => {});
      }
    });
  }
}
