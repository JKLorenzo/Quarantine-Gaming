const { Command } = require('discord-akairo');

/**
 * @typedef {import('../../../structures/Base.js').ExtendedMessage} ExtendedMessage
 */

module.exports = class Ping extends Command {
	constructor() {
		super('ping', {
			aliases: ['ping'],
			category: 'Utility',
			description: 'Checks the ping of this bot from the discord servers.',
		});
	}

	/** @param {ExtendedMessage} message */
	async exec(message) {
		const reply = await message.reply('Pong!');
		const timeDiff = (reply.editedAt || reply.createdAt) - (message.editedAt || message.createdAt);
		return reply.edit(`The message round-trip took ${timeDiff}ms. The heartbeat ping is ${Math.round(this.client.ws.ping)}ms.`);
	}
};