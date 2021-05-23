import { sleep, constants } from '../utils/Base.js';

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
export default async function onMessageReactionAdd(client, message, reaction, user) {
	const embed = message.embeds[0];
	const header_name = embed.author.name;
	const emoji = reaction.emoji.name;

	if (header_name == 'Quarantine Gaming: NSFW Content') {
		if (emoji == '🔴') {
			await client.role_manager.add(user, constants.roles.nsfw);
		}
	} else if (header_name == 'Quarantine Gaming: Free Game Updates') {
		switch(emoji) {
		case '1️⃣':
			await client.role_manager.add(user, constants.roles.steam);
			break;
		case '2️⃣':
			await client.role_manager.add(user, constants.roles.epic);
			break;
		case '3️⃣':
			await client.role_manager.add(user, constants.roles.gog);
			break;
		case '4️⃣':
			await client.role_manager.add(user, constants.roles.console);
			break;
		case '5️⃣':
			await client.role_manager.add(user, constants.roles.ubisoft);
			break;
		}
	} else if (header_name == 'Quarantine Gaming: Experience') {
		if (embed.title == 'Audio Control Extension for Voice Channels') {
			// Delete reactions
			await message.reactions.removeAll();
			const this_channel = client.member(user.id).voice.channel;
			if (this_channel) {
				// Get reaction effect
				let effect = null;
				switch (emoji) {
				case '🟠':
					effect = true;
					break;
				case '🟢':
					effect = false;
					break;
				}

				if (effect !== null) {
					// Apply reaction effect
					for (const this_channel_member of this_channel.members.array()) {
						if (!this_channel_member.user.bot) {
							await this_channel_member.voice.setMute(effect);
							await sleep(1000);
						}
					}
				}

				// Add reactions
				const reactions = ['🟠', '🟢'];
				for (const this_reaction of reactions) {
					await client.reaction_manager.add(message, this_reaction);
				}
			}
		}
	}
}