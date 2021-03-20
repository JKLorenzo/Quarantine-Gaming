// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');
const constants = require('./constants.js');
const functions = require('./functions.js');
const classes = require('./classes.js');
/** @type {import('./app.js')} */
let app;
/** @type {import('./role_manager.js')} */
let role_manager;
/** @type {import('./error_manager.js')} */
let error_manager;
/** @type {import('./message_manager.js')} */
let message_manager;

const ErrorTicketManager = new classes.ErrorTicketManager('reaction_manager.js');
const ReactionAddManager = new classes.Manager();
const IncomingReactionManager = new classes.Manager();

/**
 * Initializes the module.
 * @param {import('discord.js-commando').CommandoClient} ClientInstance The Commando Client instance used to login.
 */
module.exports.initialize = (ClientInstance) => {
	// Link
	app = ClientInstance.modules.app;
	role_manager = ClientInstance.modules.role_manager;
	error_manager = ClientInstance.modules.error_manager;
	message_manager = ClientInstance.modules.message_manager;
};

/**
 * Adds a reaction to a message.
 * @param {Discord.Message} message The message object.
 * @param {Discord.EmojiIdentifierResolvable} emoji The emoji to use.
 * @returns {Promise<Discord.MessageReaction>} A message reaction promise object
 */
module.exports.addReaction = (message, emoji) => {
	console.log(`ReactionAdd: Queueing ${ReactionAddManager.totalID} (${message.channel.id} | ${emoji.name}})`);
	return ReactionAddManager.queue(async function() {
		let result, error;
		try {
			result = await message.react(emoji);
		}
		catch (this_error) {
			error = this_error;
		}
		finally {
			console.log(`ReactionAdd: Finished ${ReactionAddManager.currentID} (${message.channel.id} | ${emoji.name}})`);
		}
		if (error) throw error;
		return result;
	});
};

/**
 * Processes all reaction add events and applies appropriate actions.
 * @param {Discord.Message} message The message object.
 * @param {Discord.MessageEmbed} embed The message embed object.
 * @param {Discord.GuildEmoji | Discord.ReactionEmoji} emoji The guild/reaction emoji object.
 * @param {Discord.GuildMember} reactor The guild member object that reacted to this message.
 */
module.exports.onReactionAdd = (message, embed, emoji, reactor) => {
	console.log(`ReactionAdd: Queueing ${IncomingReactionManager.totalID} (${message.channel.id} | ${emoji.name}})`);
	return IncomingReactionManager.queue(async function() {
		try {
			switch (embed.author.name) {
			case 'Quarantine Gaming: NSFW Content':
				switch (emoji.name) {
				case '🔴':
					await role_manager.add(reactor, constants.roles.nsfw).catch(error => error_manager.mark(ErrorTicketManager.create('nsfw', error, 'onReactionAdd')));
					break;
				}
				break;
			case 'Quarantine Gaming: Free Game Updates':
				switch (emoji.name) {
				case '1️⃣':
					await role_manager.add(reactor, constants.roles.steam).catch(error => error_manager.mark(ErrorTicketManager.create('steam', error, 'onReactionAdd')));
					break;
				case '2️⃣':
					await role_manager.add(reactor, constants.roles.epic).catch(error => error_manager.mark(ErrorTicketManager.create('epic', error, 'onReactionAdd')));
					break;
				case '3️⃣':
					await role_manager.add(reactor, constants.roles.gog).catch(error => error_manager.mark(ErrorTicketManager.create('gog', error, 'onReactionAdd')));
					break;
				case '4️⃣':
					await role_manager.add(reactor, constants.roles.console).catch(error => error_manager.mark(ErrorTicketManager.create('console', error, 'onReactionAdd')));
					break;
				case '5️⃣':
					await role_manager.add(reactor, constants.roles.ubisoft).catch(error => error_manager.mark(ErrorTicketManager.create('ubisoft', error, 'onReactionAdd')));
					break;
				}
				break;
			case 'Quarantine Gaming: Member Approval':
				try {
					// Check if reactor is a staff or mod and if the approval is still pending and the reaction add process is complete
					if (app.hasRole(reactor, [constants.roles.staff, constants.roles.moderator]) && embed.fields[3].name != 'Action Taken:' && message.reactions.cache.array().length >= 3) {
						const this_user = app.member(embed.fields[0].value);
						if (this_user) {
							const dm_message = new Array();
							switch (emoji.name) {
							case '✅':
								await role_manager.add(this_user, constants.roles.member).catch(error => error_manager.mark(ErrorTicketManager.create('role_manager.add() [approve]', error, 'onReactionAdd')));
								await message.reactions.removeAll().catch(error => error_manager.mark(ErrorTicketManager.create('reactions.removeAll() [approve]', error, 'onReactionAdd')));
								embed.spliceFields(3, 1, [
									{ name: 'Action Taken:', value: `Approved by ${reactor}` },
								]).setTimestamp();
								await message.edit(embed).catch(error => error_manager.mark(ErrorTicketManager.create('message.edit() [approve]', error, 'onReactionAdd')));
								dm_message.push('Hooraaay! 🥳 Your membership request has been approved! You will now have access to all the features of this server!');
								dm_message.push('Do `!help` on our ' + app.channel(constants.channels.text.general).name + ' text channel to know more about these features or you can visit <https://quarantinegamingdiscord.wordpress.com/> for more info.');
								await message_manager.sendToUser(this_user, dm_message.join('\n')).catch(error => error_manager.mark(ErrorTicketManager.create('message_manager.sendToUser() [approve]', error, 'onReactionAdd')));
								break;
							case '❌':
								await this_user.kick().catch(error => error_manager.mark(ErrorTicketManager.create('this_user.kick() [kick]', error, 'onReactionAdd')));
								await message.reactions.removeAll().catch(error => error_manager.mark(ErrorTicketManager.create('reactions.removeAll() [kick]', error, 'onReactionAdd')));
								embed.spliceFields(3, 1, [
									{ name: 'Action Taken:', value: `Kicked by ${reactor}` },
								]).setTimestamp();
								await message.edit(embed).catch(error => error_manager.mark(ErrorTicketManager.create('message.edit() [kick]', error, 'onReactionAdd')));
								break;
							case '⛔':
								await this_user.ban().catch(error => error_manager.mark(ErrorTicketManager.create('this_user.ban() [ban]', error, 'onReactionAdd')));
								await message.reactions.removeAll().catch(error => error_manager.mark(ErrorTicketManager.create('reactions.removeAll() [ban]', error, 'onReactionAdd')));
								embed.spliceFields(3, 1, [
									{ name: 'Action Taken:', value: `Banned by ${reactor}` },
								]).setTimestamp();
								await message.edit(embed).catch(error => error_manager.mark(ErrorTicketManager.create('message.edit() [ban]', error, 'onReactionAdd')));
								break;
							}
						}
						else {
							await message.reactions.removeAll().catch(error => error_manager.mark(ErrorTicketManager.create('reactions.removeAll() [not found]', error, 'onReactionAdd')));
							embed.spliceFields(3, 1, [
								{ name: 'Action Taken:', value: `${emoji.name} attempted by ${reactor}. User not found ⚠` },
							]).setTimestamp();
							await message.edit(embed).catch(error => error_manager.mark(ErrorTicketManager.create('message.edit() [not found]', error, 'onReactionAdd')));
						}
					}
					else {
						await message.reactions.removeAll().catch(error => error_manager.mark(ErrorTicketManager.create('reactions.removeAll() [invalid]', error, 'onReactionAdd')));
					}
				}
				catch (error) {
					error_manager.mark(ErrorTicketManager.create('Member Approval', error, 'onReactionAdd'));
				}
				break;
			case 'Quarantine Gaming: Experience':
				switch (embed.title) {
				case 'Audio Control Extension for Voice Channels':
					try {
						// Delete reactions
						await message.reactions.removeAll();
						const this_channel = app.member(reactor.id).voice.channel;
						if (this_channel) {
							// Get members
							const channel_members = new Array();
							for (const this_entry of this_channel.members) {
								channel_members.push(this_entry[1]);
							}

							// Get reaction effect
							let effect = null;
							switch (emoji.name) {
							case '🟠':
								effect = true;
								break;
							case '🟢':
								effect = false;
								break;
							}

							if (effect !== null) {
								// Apply reaction effect
								for (const this_channel_member of channel_members) {
									if (!this_channel_member.user.bot) {
										await this_channel_member.voice.setMute(effect);
										await functions.sleep(1000);
									}
								}
							}

							// Add reactions
							const reactions = ['🟠', '🟢'];
							for (const this_reaction of reactions) {
								await this.addReaction(message, this_reaction);
							}
						}
					}
					catch (error) {
						error_manager.mark(ErrorTicketManager.create('Audio Control Extension for Voice Channels', error, 'onReactionAdd'));
					}
					break;
				}
				break;
			case 'Quarantine Gaming: Game Coordinator':
				try {
					const inviter = app.member(embed.fields[0].value);
					if (inviter && reactor && embed.thumbnail.url == emoji.url) {
						if (reactor.id != inviter.id && embed.footer.text != 'Closed. This bracket is now full.') {
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
									if (field.value.indexOf(reactor.id) !== -1) {
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
										embed.addField(`Player ${i}:`, reactor);
										players.push(reactor);
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
									embed.addField(`Player ${i}:`, reactor);
									players.push(reactor);
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
									if (player && player.id != reactor.id) {
										await message_manager.sendToUser(player, `${reactor} joined your bracket. ${players.length > 1 ? `${players.length} players total.` : ''}`);
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
										if (player && player.id != reactor.id) {
											await message_manager.sendToUser(player, { content: `Your ${embed.title} bracket is now full.`, embed: embed });
										}
									}
								}
							}
						}
					}
				}
				catch (error) {
					error_manager.mark(ErrorTicketManager.create('Game Coordinator', error, 'onReactionAdd'));
				}
				break;
			}
		}
		catch (this_error) {
			error_manager.mark(ErrorTicketManager.create('onReactionAdd', this_error));
		}
		finally {
			console.log(`IncomingReactionAdd: Finished ${IncomingReactionManager.currentID} (${reactor.displayName})`);
		}
	});
};

/**
 * Processes all reaction remove events and applies appropriate actions.
 * @param {Discord.Message} message The message object.
 * @param {Discord.MessageEmbed} embed The message embed object.
 * @param {Discord.GuildEmoji | Discord.ReactionEmoji} emoji The guild/reaction emoji object.
 * @param {Discord.GuildMember} reactor The guild member object that reacted to this message.
 */
module.exports.onReactionRemove = (message, embed, emoji, reactor) => {
	console.log(`IncomingReactionRemove: Queueing ${IncomingReactionManager.totalID} (${reactor.displayName})`);
	return IncomingReactionManager.queue(async function() {
		try {
			switch (embed.author.name) {
			case 'Quarantine Gaming: NSFW Content':
				switch (emoji.name) {
				case '🔴':
					await role_manager.remove(reactor, constants.roles.nsfw).catch(error => error_manager.mark(ErrorTicketManager.create('nsfw', error, 'onReactionRemove')));
					break;
				}
				break;
			case 'Quarantine Gaming: Free Game Updates':
				switch (emoji.name) {
				case '1️⃣':
					await role_manager.remove(reactor, constants.roles.steam).catch(error => error_manager.mark(ErrorTicketManager.create('steam', error, 'onReactionRemove')));
					break;
				case '2️⃣':
					await role_manager.remove(reactor, constants.roles.epic).catch(error => error_manager.mark(ErrorTicketManager.create('epic', error, 'onReactionRemove')));
					break;
				case '3️⃣':
					await role_manager.remove(reactor, constants.roles.gog).catch(error => error_manager.mark(ErrorTicketManager.create('gog', error, 'onReactionRemove')));
					break;
				case '4️⃣':
					await role_manager.remove(reactor, constants.roles.console).catch(error => error_manager.mark(ErrorTicketManager.create('console', error, 'onReactionRemove')));
					break;
				case '5️⃣':
					await role_manager.remove(reactor, constants.roles.ubisoft).catch(error => error_manager.mark(ErrorTicketManager.create('ubisoft', error, 'onReactionRemove')));
					break;
				}
				break;
			case 'Quarantine Gaming: Game Coordinator':
				try {
					const inviter = app.member(embed.fields[0].value);
					if (inviter && reactor && embed.thumbnail.url == emoji.url) {
						if (reactor.id != inviter.id && embed.footer.text != 'Closed. This bracket is now full.') {
							const players = new Array();
							const max = embed.fields.length;
							let has_caps = false;
							if (embed.description.indexOf('is looking for') !== -1) has_caps = true;
							for (const field of embed.fields) {
								if (field.value && field.value != '\u200b' && (!(field.value.indexOf(reactor.id) !== -1) || embed.description.indexOf(reactor.displayName) !== -1)) {
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
									if (player && player.id != reactor.id) {
										await message_manager.sendToUser(player, `${reactor} left your bracket. ${players.length > 1 ? `${players.length} players total.` : ''}`);
									}
								}
							}
						}
					}
				}
				catch (error) {
					error_manager.mark(ErrorTicketManager.create('Game Coordinator', error, 'onReactionRemove'));
				}
				break;
			}
		}
		catch (this_error) {
			error_manager.mark(ErrorTicketManager.create('onReactionRemove', this_error));
		}
		finally {
			console.log(`IncomingReactionRemove: Finished ${IncomingReactionManager.currentID} (${reactor.displayName})`);
		}
	});
};

module.exports.ReactionAddManager = ReactionAddManager;