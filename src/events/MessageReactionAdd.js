// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');

/**
 * @param {import('../app.js')} app
 * @param {Discord.Message} message
 * @param {Discord.MessageReaction} reaction
 * @param {Discord.User} user
 */
module.exports = async function onMessageReactionAdd(app, message, reaction, user) {
	const embed = message.embeds[0];
	const header_name = embed.author.name;
	const emoji = reaction.emoji.name;

	if (header_name == 'Quarantine Gaming: NSFW Content') {
		if (emoji == '🔴') {
			await app.role_manager.add(user, app.utils.constants.roles.nsfw);
		}
	}
	else if (header_name == 'Quarantine Gaming: Free Game Updates') {
		switch(emoji) {
		case '1️⃣':
			await app.role_manager.add(user, app.utils.constants.roles.steam);
			break;
		case '2️⃣':
			await app.role_manager.add(user, app.utils.constants.roles.epic);
			break;
		case '3️⃣':
			await app.role_manager.add(user, app.utils.constants.roles.gog);
			break;
		case '4️⃣':
			await app.role_manager.add(user, app.utils.constants.roles.console);
			break;
		case '5️⃣':
			await app.role_manager.add(user, app.utils.constants.roles.ubisoft);
			break;
		}
	}
	else if (header_name == 'Quarantine Gaming: Member Approval') {
		if (app.member(user).hasRole([app.utils.constants.roles.staff, app.utils.constants.roles.moderator]) && embed.fields[3].name != 'Action Taken:' && message.reactions.cache.array().length >= 3) {
			const this_user = app.member(embed.fields[0].value);
			if (this_user) {
				const dm_message = new Array();
				switch (emoji) {
				case '✅':
					await app.role_manager.add(this_user, app.utils.constants.roles.member);
					await message.reactions.removeAll();
					embed.spliceFields(3, 1, [
						{ name: 'Action Taken:', value: `Approved by ${user}` },
					]).setTimestamp();
					await message.edit(embed);
					dm_message.push('Hooraaay! 🥳 Your membership request has been approved! You will now have access to all the features of this server!');
					dm_message.push('Do `!help` on our ' + app.channel(app.utils.constants.channels.text.general).name + ' text channel to know more about these features or you can visit <https://quarantinegamingdiscord.wordpress.com/> for more info.');
					await app.message_manager.sendToUser(this_user, dm_message.join('\n'));
					break;
				case '❌':
					await this_user.kick();
					await message.reactions.removeAll();
					embed.spliceFields(3, 1, [
						{ name: 'Action Taken:', value: `Kicked by ${user}` },
					]).setTimestamp();
					await message.edit(embed);
					break;
				case '⛔':
					await this_user.ban();
					await message.reactions.removeAll();
					embed.spliceFields(3, 1, [
						{ name: 'Action Taken:', value: `Banned by ${user}` },
					]).setTimestamp();
					await message.edit(embed);
					break;
				}
			}
			else {
				await message.reactions.removeAll();
				embed.spliceFields(3, 1, [
					{ name: 'Action Taken:', value: `${emoji} attempted by ${user}. User not found ⚠` },
				]).setTimestamp();
				await message.edit(embed);
			}
		}
	}
	else if (header_name == 'Quarantine Gaming: Experience') {
		if (embed.title == 'Audio Control Extension for Voice Channels') {
			// Delete reactions
			await message.reactions.removeAll();
			const this_channel = app.member(user.id).voice.channel;
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
							await app.utils.sleep(1000);
						}
					}
				}

				// Add reactions
				const reactions = ['🟠', '🟢'];
				for (const this_reaction of reactions) {
					await app.reaction_manager.add(message, this_reaction);
				}
			}
		}
	}
	else if (header_name == 'Quarantine Gaming: Game Coordinator') {
		const inviter = app.member(embed.fields[0].value);
		if (inviter && embed.thumbnail.url == emoji.url) {
			if (user.id != inviter.id && embed.footer.text != 'Closed. This bracket is now full.') {
				const players = new Array();
				const max = embed.fields.length;
				let cur = 0;
				let has_caps = false;
				let inserted = false;
				if (embed.description.indexOf('is looking for') !== -1) has_caps = true;
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
						const player = app.member(this_field.value);
						if (player && player.id != user.id) {
							await app.message_manager.sendToUser(player, `${user} joined your ${embed.title} bracket. ${players.length > 1 ? `${players.length} players total.` : ''}`);
						}
					}
				}
				if (has_caps && players.length >= max) {
					await message.reactions.removeAll();
					embed.setDescription('Your team members are listed below.');
					embed.setFooter('Game On!');
					for (const this_field of embed.fields) {
						if (this_field.value && this_field.value.length > 0) {
							const player = app.member(this_field.value);
							if (player && player.id != user.id) {
								await app.message_manager.sendToUser(player, { content: `Your ${embed.title} bracket is now full.`, embed: embed });
							}
						}
					}
				}
			}
		}
	}
};