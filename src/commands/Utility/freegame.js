const { Command } = require('discord-akairo');

/**
 * @typedef {import('../../structures/Base.js').Client} Client
 * @typedef {import('../../structures/Base.js').ExtendedMessage} ExtendedMessage
 */

module.exports = class FreeGame extends Command {
	constructor() {
		super('freegame', {
			aliases: ['freegame'],
			category: 'Utility',
			description: 'Manually push a free game notification request.',
			args: [
				{
					id: 'link',
					description: 'The reddit link of the free game.',
					prompt: {
						start: 'Enter the reddit link of the game.',
						retry: 'You must enter a reddit link.',
					},
				},
			],
		});
	}

	/**
     * @param {ExtendedMessage} message
     * @param {{link: String}} args
     */
	async exec(message, args) {
		/** @type {Client} */
		const client = message.client;
		const result = await client.free_game_manager.fetch(args.link);
		return message.reply(result);
	}
};