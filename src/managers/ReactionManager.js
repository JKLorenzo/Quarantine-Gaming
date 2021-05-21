import { ErrorTicketManager, ProcessQueue, sleep } from '../utils/Base.js';

/**
 * @typedef {import('discord.js').Message} Message
 * @typedef {import('discord.js').EmojiResolvable} EmojiResolvable
 * @typedef {import('discord.js').MessageReaction} MessageReaction
 * @typedef {import('../structures/Base').Client} Client
 */

const ETM = new ErrorTicketManager('Reaction Manager');

export default class ReactionManager {
	/** @param {Client} client */
	constructor(client) {
		this.client = client;
		this.queuer = new ProcessQueue(1000);
	}

	/**
	 * Adds a reaction to a message.
	 * @param {Message} message
	 * @param {EmojiResolvable | EmojiResolvable[]} emoji
	 * @returns {Promise<MessageReaction | MessageReaction[]>}
	 */
	add(message, emoji) {
		console.log(`ReactionAdd: Queueing ${this.queuer.totalID} (${message.channel.id} | ${emoji.name ? emoji.name : emoji}})`);
		return this.queuer.queue(async () => {
			let result, error;
			try {
				if (Array.isArray(emoji)) {
					result = new Array();
					for (const this_emoji of emoji) {
						result.push(await message.react(this_emoji));
						await sleep(this.queuer.timeout);
					}
				} else {
					result = await message.react(emoji);
				}
			} catch (this_error) {
				this.client.error_manager.mark(ETM.create('add', error));
				error = this_error;
			} finally {
				console.log(`ReactionAdd: Finished ${this.queuer.currentID} (${message.channel.id} | ${emoji.name ? emoji.name : emoji}})`);
			}
			if (error) throw error;
			return result;
		});
	}
}