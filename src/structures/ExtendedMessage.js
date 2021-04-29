const { Message } = require('discord.js');

module.exports = class ExtendedMessage extends Message {
	constructor(client, data, channel) {
		super(client, data, channel);
	}

	/**
     * @param {{timeout: Number}} options
	 * @returns {Promise<ExtendedMessage>}
     */
	delete(options = {}) {
		return new Promise((resolve, reject) => {
			if (options.timeout > 0) {
				setTimeout(() => {
					super.delete().then(result => resolve(result)).catch(error => reject(error));
				}, options.timeout);
			}
			else {
				super.delete().then(result => resolve(result)).catch(error => reject(error));
			}
		});
	}
};