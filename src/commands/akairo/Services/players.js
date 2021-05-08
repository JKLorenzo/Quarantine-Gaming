const { Command } = require('discord-akairo');
const { MessageEmbed } = require('discord.js');
const { constants } = require('../../../utils/Base.js');

/**
 * @typedef {import('../../../structures/Base.js').Client} Client
 * @typedef {import('../../../structures/Base.js').ExtendedMessage} ExtendedMessage
 * @typedef {import('discord.js').Role} Role
 */

module.exports = class Players extends Command {
	constructor() {
		super('players', {
			aliases: ['players'],
			category: 'Services',
			description: 'Show all active players of a game.',
			args: [
				{
					id: 'game_roles',
					type: (message, content) => {
						/** @type {Client} */
						const client = message.client;
						const roles = new Array();
						for (const phrase of content.split(' ')) {
							const role = client.role(phrase);
							if (role && role.hexColor == constants.colors.game_role_mentionable) {
								const game_role = message.guild.roles.cache.find(this_role => role.name.startsWith(this_role.name) && this_role.hexColor == constants.colors.game_role);
								if (game_role) roles.push(game_role);
							}
						}
						if (roles.length > 0) return roles;
						return null;
					},
					match: 'content',
					description: 'The game roles to be scanned for active players.',
					prompt: {
						start: 'Enter a game role or game roles to be scanned for active players.',
						retry: 'You must enter a valid game role or game roles.',
					},
				},
			],
		});
	}

	/**
	 * @param {ExtendedMessage} message
	 * @param {{game_roles: Role[]}} args
	 */
	async exec(message, args) {
		for (const game_role of args.game_roles) {
			const members = game_role.members;
			const alphabetical_names = members.map(member => member.displayName.toLowerCase()).sort();
			const alphabetical_members = alphabetical_names.map(name => members.find(member => member.displayName.toLowerCase() == name));

			const member_ingame = new Array();
			const member_inothergame = new Array();
			const member_online = new Array();
			const member_unavailable = new Array();
			const member_offline = new Array();

			for (const member of alphabetical_members) {
				if (member.roles.cache.find(role => role.hexColor == constants.colors.play_role)) {
					if (member.roles.cache.find(role => role.name == `Play ${role.name}`)) {
						member_ingame.push(member);
					}
					else {
						member_inothergame.push(member);
					}
				}
				else {
					switch(member.presence.status) {
					case 'online':
						member_online.push(member);
						break;
					case 'offline':
						member_offline.push(member);
						break;
					default:
						member_unavailable.push(member);
						break;
					}
				}
			}

			const embed = new MessageEmbed({
				author: { name: 'Quarantine Gaming: List of Players' },
				title: game_role.name,
				description: 'All players who played this game for the last 7 days are as follows:',
				color: '#25ff00',
				footer: { text: `This game is being played by a total of ${members.size} players.` },
			});

			if (member_ingame.length) embed.addField(`In Game: ${member_ingame.length}`, member_ingame.join(', '));
			if (member_inothergame.length) embed.addField(`Playing other game: ${member_inothergame.length}`, member_inothergame.join(', '));
			if (member_online.length) embed.addField(`Online: ${member_online.length}`, member_online.join(', '), true);
			if (member_unavailable.length) embed.addField(`Busy or AFK: ${member_unavailable.length}`, member_unavailable.join(', '));
			if (member_offline.length) embed.addField(`Offline: ${member_offline.length}`, member_offline.join(', '));

			message.reply(embed).then(reply => {
				reply.delete({ timeout: 60000 }).catch(e => void e);
			});
		}
		message.delete({ timeout: 60000 }).catch(e => void e);
	}
};