import { Message } from 'discord.js';

export default class ExtendedMessage extends Message {
	constructor(client, data, channel) {
		super(client, data, channel);
	}

	/**
     * @param {{timeout: Number}} options
	 * @returns {Promise<ExtendedMessage>}
     */
	delete(options = {}) {
		return new Promise((resolve) => {
			if (options.timeout > 0) {
				setTimeout(() => {
					super.delete().then(result => resolve(result)).catch(e => void e);
				}, options.timeout);
			} else {
				super.delete().then(result => resolve(result)).catch(e => void e);
			}
		});
	}
}