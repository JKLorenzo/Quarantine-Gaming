const { Command } = require('discord-akairo');

/**
 * @typedef {import('../../../structures/Base.js').Client} Client
 * @typedef {import('../../../structures/Base.js').ExtendedMessage} ExtendedMessage
 */

module.exports = class Emoji extends Command {
	constructor() {
		super('emoji', {
			aliases: ['emoji', 'e'],
			category: 'Services',
			description: 'Adds a reaction emoji to any message using all the available Guild Emojis (including Animated Emojis).',
			args: [
				{
					id: 'emojis',
					type: (message, content) => {
						const phrases = content.split(' ');
						const emojis = new Array();
						for (const phrase of phrases) {
							if (!phrase.length) continue;
							if (phrase.startsWith('<') && phrase.endsWith('>')) {
								const emoji_id = phrase.split(':')[2].substring(0, phrase.split(':')[2].length - 1);
								const guild_emoji = message.guild.emojis.resolve(emoji_id);
								if (guild_emoji) emojis.push(guild_emoji);
							}
							else if (!phrase.match(/[a-zA-Z0-9]/)) {
								emojis.push(phrase);
							}
							else {
								const guild_emoji = message.guild.emojis.cache.find(emoji => emoji.name == phrase);
								if (guild_emoji) emojis.push(guild_emoji);
							}
						}
						if (emojis.length > 0) return emojis;
						return null;
					},
					description: 'The emojis to be added to the message.',
					match: 'content',
					prompt: {
						start: 'Enter the emojis to be added as a reaction. Each emoji must be seperated by a space when adding multiple emojis.',
						retry: 'You must enter a valid emoji.',
					},
				},
			],
		});
	}

	/**
     * @param {ExtendedMessage} message
     * @param {{emojis: String[]}} args
     */
	async exec(message, args) {
		/** @type {Client} */
		const client = message.client;

		const targetMessage = message.referencedMessage;
		if (!targetMessage) {
			return message.reply('You must reply to the message where you want to add a reaction.\nCommand cancelled.').then(reply => {
				reply.delete({ timeout: 30000 }).catch(e => void e);
				message.delete({ timeout: 30000 }).catch(e => void e);
			});
		}

		return client.reaction_manager.add(targetMessage, args.emojis).then(() => {
			message.delete({ timeout: 2000 }).catch(e => void e);
		});
	}
};