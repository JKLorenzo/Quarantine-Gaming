const { sleep, constants } = require('../utils/Base.js');

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
module.exports = async function onMessageReactionAdd(client, message, reaction, user) {
	const embed = message.embeds[0];
	const header_name = embed.author.name;
	const emoji = reaction.emoji.name;

	if (header_name == 'Quarantine Gaming: NSFW Content') {
		if (emoji == '🔴') {
			await client.role_manager.add(user, constants.roles.nsfw);
		}
	}
	else if (header_name == 'Quarantine Gaming: Free Game Updates') {
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
	}
	else if (header_name == 'Quarantine Gaming: Server Gateway Administrative') {
		const member = client.member(user);
		if (member.hasRole([constants.roles.staff, constants.roles.moderator, constants.roles.booster]) && embed.fields[3].value == 'Action Required') {
			const this_member = client.member(embed.fields[0].value);
			const inviter = client.member(embed.fields[1].value);
			embed.setFooter(new Date());
			if (this_member) {
				switch (emoji) {
				case '✅':
					await message.reactions.removeAll();
					await client.role_manager.add(this_member, constants.roles.member);
					await this_member.setInviter(inviter, member);
					embed.fields[3].value = `Approved by ${user}`;
					await message.edit({ content: '', embed: embed });
					await client.message_manager.sendToUser(this_member, 'Hooraaay! 🥳 Your membership request has been approved! You will now have access to all the features of this server!');
					break;
				case '❌':
					await message.reactions.removeAll();
					await this_member.kick();
					embed.fields[3].value = `Kicked by ${user}`;
					await message.edit({ content: '', embed: embed });
					break;
				case '⛔':
					await message.reactions.removeAll();
					await this_member.ban();
					embed.fields[3].value = `Banned by ${user}`;
					await message.edit({ content: '', embed: embed });
					break;
				}
			}
			else {
				await message.reactions.removeAll();
				embed.fields[3].value = 'User not found ⚠';
				await message.edit({ content: '', embed: embed });
			}
		}
	}
	else if (header_name == 'Quarantine Gaming: Experience') {
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
	else if (header_name == 'Quarantine Gaming: Game Coordinator') {
		const inviter = client.member(embed.fields[0].value);
		if (inviter && emoji == 'blob_party') {
			if (user.id != inviter.id && embed.footer.text != 'Closed. This bracket is now full.') {
				const players = new Array();
				const max = embed.fields.length;
				let cur = 0;
				let has_caps = false;
				let inserted = false;
				if (embed.fields.filter(field => field.value == '\u200b').length) has_caps = true;
				for (const field of embed.fields) {
					if (field.value != '\u200b') {
						players.push(field.value);
						cur++;
						if (field.value.indexOf(user.id) !== -1) {
							inserted = true;
						}
					}
				}
				embed.spliceFields(0, max);
				if (has_caps) {
					for (let i = 1; i <= max; i++) {
						if (i <= cur) {
							embed.addField(`Player ${i}:`, players[i - 1]);
						}
						else if (!inserted) {
							embed.addField(`Player ${i}:`, user);
							players.push(user);
							inserted = true;
						}
						else {
							embed.addField(`Player ${i}:`, '\u200b');
						}
					}
				}
				else {
					let i = 1;
					for (i; i <= cur; i++) {
						embed.addField(`Player ${i}:`, players[i - 1]);
					}
					if (!inserted) {
						embed.addField(`Player ${i}:`, user);
						players.push(user);
						inserted = true;
					}
				}
				if (has_caps && players.length >= max) {
					embed.setFooter('Closed. This bracket is now full.');
				}
				await message.edit({ content: message.content, embed: embed });
				for (const this_field of embed.fields) {
					if (this_field.value && this_field.value.length > 0) {
						const player = client.member(this_field.value);
						if (player && player.id != user.id) {
							await client.message_manager.sendToUser(player, `${user} joined your ${embed.title} bracket. ${players.length > 1 ? `${players.length} players total.` : ''}`);
						}
					}
				}
				if (has_caps && players.length >= max) {
					await message.reactions.removeAll();
					embed.setDescription('Your team members are listed below.');
					embed.setFooter('Game On!');
					for (const this_field of embed.fields) {
						if (this_field.value && this_field.value.length > 0) {
							const player = client.member(this_field.value);
							if (player && player.id != user.id) {
								await client.message_manager.sendToUser(player, { content: `Your ${embed.title} bracket is now full.`, embed: embed });
							}
						}
					}
				}
			}
		}
	}
};