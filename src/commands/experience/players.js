const Discord = require('discord.js');
const Commando = require('discord.js-commando');
const constants = require('../../modules/constants.js');
const functions = require('../../modules/functions.js');
/** @type {import('../../modules/app.js')} */
let app;
/** @type {import('../../modules/message_manager.js')} */
let message_manager;

module.exports = class PlayersCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'players',
			group: 'experience',
			memberName: 'players',
			description: 'Show all players who played a specified game.',
			guildOnly: true,
			args: [
				{
					key: 'role',
					prompt: 'Mention the play role you want to check.',
					type: 'role',
					validate: role => {
						// Link
						app = this.client.modules.app;

						const game_role_mentionable = app.role(role);
						if (game_role_mentionable) {
							return game_role_mentionable.hexColor == '#00fffe' && functions.contains(game_role_mentionable.name, ' ⭐');
						}
						else {
							return false;
						}
					},
				},
			],
		});
	}

	/**
     * @param {Commando.CommandoMessage} message
     * @param {{role: Discord.RoleResolvable}}
     */
	run(message, { role }) {
		// Link
		app = this.client.modules.app;
		message_manager = this.client.modules.message_manager;

		message.delete({ timeout: 10000 }).catch(e => void e);
		const game_role_mentionable = app.role(role);
		const players = new Array();
		const alphabetical = new Array();
		const in_game = new Array();
		const online = new Array();
		const unavailable = new Array();

		if (game_role_mentionable) {
			const game_role = app.guild().roles.cache.find(this_role => game_role_mentionable.name.startsWith(this_role.name) && this_role.hexColor == '#00ffff');
			if (game_role) {
				for (const member of app.guild().members.cache.array()) {
					if (member.roles.cache.has(game_role.id)) {
						players.push(member);
						alphabetical.push(member.displayName);
					}
				}

				const embed = new Discord.MessageEmbed();
				embed.setAuthor('Quarantine Gaming: List of Players');
				embed.setTitle(game_role.name);
				embed.setDescription('All members who have played this game recently are as follows:');

				const emoji = app.guild().emojis.cache.find(this_role => this_role.name == game_role.name.trim().split(' ').join('').split(':').join('').split('-').join(''));
				const qg_emoji = app.guild().emojis.cache.find(this_role => this_role.name == 'quarantinegaming');
				emoji ? embed.setThumbnail(emoji.url) : embed.setThumbnail(qg_emoji.url);

				alphabetical.sort();
				for (const name of alphabetical) {
					for (const player of players) {
						const this_player = app.member(player);
						if (this_player.displayName == name) {
							if (this_player.roles.cache.find(this_role => this_role.name == `Play ${game_role.name}`)) {
								in_game.push(this_player);
							}
							else if (this_player.presence.status == 'online') {
								online.push(this_player);
							}
							else {
								unavailable.push(this_player);
							}
						}
					}
				}
				embed.addField(`In Game: ${in_game.length}`, in_game.length > 0 ? in_game.join(', ') : 'No players found.');
				embed.addField(`Online: ${online.length}`, online.length > 0 ? online.join(', ') : 'No players found.');
				embed.addField(`Away / Busy / Offline : ${unavailable.length}`, unavailable.length > 0 ? unavailable.join(', ') : 'No players found.');
				embed.setFooter(`${players.length} players total.`);
				embed.setColor('#25ff00');
				message_manager.sendToChannel(message.channel, embed).then(this_message => {
					this_message.delete({ timeout: 30000 }).catch(e => void e);
				}).catch(e => void e);
			}
			else {
				message.reply(`No game role found matching this game role mentionable (${game_role_mentionable}). Please contact ${app.member(constants.owner)} for troubleshooting.`);
			}
		}
		else {
			message.reply('No information is available right now. Please try again later.').then(this_message => {
				this_message.delete({ timeout: 10000 }).catch(e => void e);
			}).catch(e => void e);
		}
	}
};