import { MessageEmbed } from 'discord.js';
import { SlashCommand } from '../../../structures/Base.js';
import { constants } from '../../../utils/Base.js';

/**
 * @typedef {import('discord.js').Role} Role
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 */

/**
 * @typedef {Role[]} Partition Represents a subcommand choice containing 25 roles
 */

export default class Players extends SlashCommand {
	constructor() {
		super({
			name: 'players',
			description: 'Show the list of players of a game on this server.',
			options: [],
		});
	}

	/** @param {Partition} partition */
	registerPartitionAsSubCommand(partition, iteration = 0) {
		const start = partition[0].name.substring(0, 1).toLowerCase();
		const end = partition[partition.length - 1].name.substring(0, 1).toLowerCase();
		const this_name = `${start}_to_${end}${iteration ? `_${iteration}` : ''}`;
		if (this.options.map(option => option.name).includes(this_name)) {
			return this.registerPartitionAsSubCommand(partition, ++iteration);
		}

		this.options.push({
			name: this_name,
			description: `Show the list of players of a game on this server. (${start.toUpperCase()} to ${end.toUpperCase()})`,
			type: 'SUB_COMMAND',
			options: [
				{
					name: 'game',
					description: 'Select the game you\'d like to check.',
					type: 'STRING',
					choices: partition.map(role => {
						return {
							name: role.name,
							value: role.id,
						};
					}),
					required: true,
				},
			],
		});
	}

	async init(client) {
		this.client = client;

		/** @type {Partition[]} */
		const partitions = new Array();
		const games = this.client.guild.roles.cache.filter(r => r.hexColor === constants.colors.game_role).array();
		const games_alphabetical = games.map(r => r.name).sort();
		for (const game_name of games_alphabetical) {
			// Initialize the first and the next partition
			if (!partitions.length || partitions[partitions.length - 1].length > 24) partitions.push(new Array());
			partitions[partitions.length - 1].push(games.find(r => r.name === game_name));
		}
		for (const partition of partitions) this.registerPartitionAsSubCommand(partition);

		return this;
	}

	/**
     * @param {CommandInteraction} interaction
     * @param {{game: String}} options
     */
	async exec(interaction, options) {
		// further transform the options to match the properties of a subcommand
		options = options[Object.keys(options)[0]];

		const game_role = this.client.role(options.game);
		if (!game_role) return interaction.reply('Commmand failed. The game you specified no longer exists.', { ephemeral: true });

		await interaction.defer(true);

		const members = game_role.members;
		const alphabetical_names = members.map(member => member.displayName).sort();

		const member_ingame = new Array();
		const member_inothergame = new Array();
		const member_online = new Array();
		const member_unavailable = new Array();
		const member_offline = new Array();

		for (const member_name of alphabetical_names) {
			const this_member = members.find(member => member.displayName === member_name);
			if (this_member.roles.cache.find(role => role.hexColor == constants.colors.play_role)) {
				if (this_member.roles.cache.find(role => role.name == `Play ${role.name}`)) {
					member_ingame.push(this_member);
				} else {
					member_inothergame.push(this_member);
				}
			} else {
				switch(this_member.presence.status) {
				case 'online':
					member_online.push(this_member);
					break;
				case 'offline':
					member_offline.push(this_member);
					break;
				default:
					member_unavailable.push(this_member);
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

		interaction.editReply(embed);
	}
}