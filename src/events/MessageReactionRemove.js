const { constants } = require('../utils/Base.js');

/**
 * @typedef {import('../structures/Base.js').Client} Client
 * @typedef {import('discord.js').Message} Message
 * @typedef {import('discord.js').MessageReaction} MessageReaction
 * @typedef {import('discord.js').User} User
 */

/**
 * @param {Client} client
 * @param {Message} message
 * @param {MessageReaction} reaction
 * @param {User} user
 */
module.exports = async function onMessageReactionRemove(client, message, reaction, user) {
	const embed = message.embeds[0];
	const header_name = embed.author.name;
	const emoji = reaction.emoji.name;

	if (header_name == 'Quarantine Gaming: NSFW Content') {
		if (emoji == '🔴') {
			await client.role_manager.remove(user, constants.roles.nsfw);
		}
	}
	else if (header_name == 'Quarantine Gaming: Free Game Updates') {
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
	else if (header_name == 'Quarantine Gaming: Game Coordinator') {
		const inviter = client.member(embed.fields[0].value);
		if (inviter && emoji == 'blob_party') {
			if (user.id != inviter.id && embed.footer.text != 'Closed. This bracket is now full.') {
				const players = new Array();
				const max = embed.fields.length;
				let has_caps = false;
				if (embed.fields.filter(field => field.value == '\u200b').length) has_caps = true;
				for (const field of embed.fields) {
					if (field.value && field.value != '\u200b' && (!(field.value.indexOf(user.id) !== -1) || inviter.user.id != user.id)) {
						players.push(field.value);
					}
				}
				embed.spliceFields(0, max);
				if (has_caps) {
					for (let i = 1; i <= max; i++) {
						if (i <= players.length) {
							embed.addField(`Player ${i}:`, players[i - 1]);
						}
						else {
							embed.addField(`Player ${i}:`, '\u200b');
						}
					}
				}
				else {
					for (let i = 1; i <= players.length; i++) {
						embed.addField(`Player ${i}:`, players[i - 1]);
					}
				}
				await message.edit({ content: message.content, embed: embed });
				for (const this_field of embed.fields) {
					if (this_field.value && this_field.value.length > 0) {
						const player = client.member(this_field.value);
						if (player && player.id != user.id) {
							await client.message_manager.sendToUser(player, `${user} left your ${embed.title} bracket. ${players.length > 1 ? `${players.length} players total.` : ''}`);
						}
					}
				}
			}
		}
	}
};