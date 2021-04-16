const Discord = require('discord.js');
module.exports = class ExtendedMessage extends Discord.Message {
	/**
     * @param {Discord.Client} client
     * @param {Object} data
     * @param {Discord.NewsChannel | Discord.TextChannel | Discord.DMChannel} channel
     */
	constructor(client, data, channel) {
		super(client, data, channel);
	}

	/**
     * @param {{timeout: Number}} options
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