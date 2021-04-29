const { MessageEmbed } = require('discord.js');
const { Command } = require('discord-akairo');
const { getPercentSimilarity, constants } = require('../../utils/Base.js');

/**
 * @typedef {import('../../structures/Base.js').Client} Client
 * @typedef {import('../../structures/Base.js').ExtendedMessage} ExtendedMessage
 * @typedef {import('../../structures/Base.js').ExtendedMember} ExtendedMember
 * @typedef {import('discord.js').GuildChannel} GuildChannel
 * @typedef {import('discord.js').Role} Role
 */

module.exports = class Game extends Command {
	constructor() {
		super('game', {
			aliases: ['game'],
			category: 'Management',
			description: '[Mod] Whitelist or blacklist a game.',
			channel: 'guild',
			args: [
				{
					id: 'option',
					type: ['whitelist', 'blacklist'],
					description: 'One of [ `whitelist`, `blacklist` ]',
					prompt: {
						start: 'Would you like to `whitelist` or `blacklist` a game?',
						retry: 'You must enter one of `whitelist` or `blacklist`',
					},
				},
				{
					id: 'game_name',
					type: (message, phrase) => {
						const name = phrase.trim().toLowerCase();
						// Check Roles
						for (const this_role of message.guild.roles.cache.array()) {
							if (this_role.hexColor != constants.colors.game_role) continue;
							if (getPercentSimilarity(this_role.name.trim().toLowerCase(), name) >= 75) {
								return this_role.name.trim();
							}
						}
						// Check Presence
						for (const this_member of message.guild.members.cache.array()) {
							for (const this_activity of this_member.presence.activities) {
								if (this_activity.type !== 'PLAYING') continue;
								if (getPercentSimilarity(this_activity.name.trim().toLowerCase(), name) >= 75) {
									return this_activity.name.trim();
								}
							}
						}
						return null;
					},
					description: 'The complete name of the game (case insensitive)',
					prompt: {
						start: 'Enter the name of the game (case insensitive).',
						retry: 'You must enter the game name that is currently being a player or a game name that already exists.',
					},
					match: 'rest',
				},
			],
		});
	}

	/** @param {ExtendedMessage} message */
	userPermissions(message) {
		/** @type {ExtendedMember} */
		const member = message.member;
		if (!member.hasRole(constants.roles.staff)) return 'Staff';
		return null;
	}

	/**
     * @param {ExtendedMessage} message
     * @param {{option: 'whitelist' | 'blacklist', game_name: String}} args
     */
	async exec(message, args) {
		/** @type {Client} */
		const client = message.client;
		const embed = new MessageEmbed({
			author: { name: 'Quarantine Gaming: Game Role Manager' },
			title: args.game_name,
			description: `Game ${args.option} requested by ${message.author}.`,
			fields: [
				{
					name: 'Status', value: 'Pending',
				},
			],
			color: '#ffff00',
		});
		const reply = await message.reply(embed);

		let result = null;
		switch(args.option) {
		case 'whitelist':
			result = await client.database_manager.gameWhitelist(args.game_name);
			break;
		case 'blacklist':
			result = await client.database_manager.gameBlacklist(args.game_name);
			break;
		}
		embed.fields[0].value = result ? 'Request Approved!' : 'Request Denied.';
		return reply.edit(embed);
	}
};