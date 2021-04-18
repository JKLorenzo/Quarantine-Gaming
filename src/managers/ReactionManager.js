const { ErrorTicketManager, ProcessQueue } = require('../utils/Base.js');

const ETM = new ErrorTicketManager('ReactionManager');

/**
 * @typedef {import('../structures/Base.js').Client} Client
 * @typedef {import('discord.js').Message} Message
 * @typedef {import('discord.js').EmojiResolvable} EmojiResolvable
 * @typedef {import('discord.js').MessageReaction} MessageReaction
 */

module.exports = class ReactionManager {
	/** @param {Client} client */
	constructor(client) {
		this.client = client;
		this.queuer = new ProcessQueue(1000);
	}

	/**
	 * Adds a reaction to a message.
	 * @param {Message} message
	 * @param {EmojiResolvable} emoji_resolvable
	 * @returns {Promise<MessageReaction>}
	 */
	add(message, emoji) {
		console.log(`ReactionAdd: Queueing ${this.queuer.totalID} (${message.channel.id} | ${emoji.name ? emoji.name : emoji}})`);
		return this.queuer.queue(async () => {
			let result, error;
			try {
				result = await message.react(emoji);
			}
			catch (this_error) {
				this.client.error_manager.mark(ETM.create('add', error));
				error = this_error;
			}
			finally {
				console.log(`ReactionAdd: Finished ${this.queuer.currentID} (${message.channel.id} | ${emoji.name ? emoji.name : emoji}})`);
			}
			if (error) throw error;
			return result;
		});
	}
};