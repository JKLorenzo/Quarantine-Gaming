// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');

/**
 * @param {import('../app.js')} app
 * @param {Discord.Message} message
 * @param {Discord.MessageReaction} reaction
 * @param {Discord.User} user
 */
module.exports = async function onMessageReactionRemove(app, message, reaction, user) {
	const embed = message.embeds[0];
	const header_name = embed.author.name;
	const emoji = reaction.emoji.name;

	if (header_name == 'Quarantine Gaming: NSFW Content') {
		if (emoji == '🔴') {
			await app.role_manager.remove(user, app.utils.constants.roles.nsfw);
		}
	}
	else if (header_name == 'Quarantine Gaming: Free Game Updates') {
		switch (emoji) {
		case '1️⃣':
			await app.role_manager.remove(user, app.utils.constants.roles.steam);
			break;
		case '2️⃣':
			await app.role_manager.remove(user, app.utils.constants.roles.epic);
			break;
		case '3️⃣':
			await app.role_manager.remove(user, app.utils.constants.roles.gog);
			break;
		case '4️⃣':
			await app.role_manager.remove(user, app.utils.constants.roles.console);
			break;
		case '5️⃣':
			await app.role_manager.remove(user, app.utils.constants.roles.ubisoft);
			break;
		}
	}
	else if (header_name == 'Quarantine Gaming: Game Coordinator') {
		const inviter = app.member(embed.fields[0].value);
		if (inviter && embed.thumbnail.url == emoji.url) {
			if (user.id != inviter.id && embed.footer.text != 'Closed. This bracket is now full.') {
				const players = new Array();
				const max = embed.fields.length;
				let has_caps = false;
				if (embed.description.indexOf('is looking for') !== -1) has_caps = true;
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
						const player = app.member(this_field.value);
						if (player && player.id != user.id) {
							await app.message_manager.sendToUser(player, `${user} left your ${embed.title} bracket. ${players.length > 1 ? `${players.length} players total.` : ''}`);
						}
					}
				}
			}
		}
	}
};