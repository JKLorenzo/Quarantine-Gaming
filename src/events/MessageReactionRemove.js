import { constants } from '../utils/Base.js';

/**
 * @typedef {import('discord.js').User} User
 * @typedef {import('discord.js').Message} Message
 * @typedef {import('discord.js').MessageReaction} MessageReaction
 * @typedef {import('../structures/Base').Client} Client
 */

/**
 * @param {Client} client
 * @param {Message} message
 * @param {MessageReaction} reaction
 * @param {User} user
 */
export default async function onMessageReactionRemove(client, message, reaction, user) {
	const embed = message.embeds[0];
	const header_name = embed.author.name;
	const emoji = reaction.emoji.name;

	if (header_name == 'Quarantine Gaming: NSFW Content') {
		if (emoji == '🔴') {
			await client.role_manager.remove(user, constants.roles.nsfw);
		}
	} else if (header_name == 'Quarantine Gaming: Free Game Updates') {
		switch (emoji) {
		case '1️⃣':
			await client.role_manager.remove(user, constants.roles.steam);
			break;
		case '2️⃣':
			await client.role_manager.remove(user, constants.roles.epic);
			break;
		case '3️⃣':
			await client.role_manager.remove(user, constants.roles.gog);
			break;
		case '4️⃣':
			await client.role_manager.remove(user, constants.roles.console);
			break;
		case '5️⃣':
			await client.role_manager.remove(user, constants.roles.ubisoft);
			break;
		}
	}
}