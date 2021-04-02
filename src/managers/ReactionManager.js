// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');

module.exports = class ReactionManager {
	/** @param {import('../app.js')} app */
	constructor(app) {
		this.app = app;
		this.queuer = app.utils.ProcessQueue(1000);
	}

	/**
	 * Adds a reaction to a message.
	 * @param {Discord.Message} message
	 * @param {Discord.EmojiResolvable} emoji_resolvable
	 * @returns {Promise<Discord.MessageReaction>}
	 */
	add(message, emoji) {
		console.log(`ReactionAdd: Queueing ${this.queuer.totalID} (${message.channel.id} | ${emoji.name ? emoji.name : emoji}})`);
		return this.queuer.queue(async () => {
			let result, error;
			try {
				result = await message.react(emoji);
			}
			catch (this_error) {
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