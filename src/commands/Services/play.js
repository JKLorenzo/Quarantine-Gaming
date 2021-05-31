import { SlashCommand } from '../../structures/Base.js';
import { constants } from '../../utils/Base.js';

/**
 * @typedef {import('discord.js').Role} Role
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 */

/**
 * @typedef {Role[]} Partition Represents a subcommand choice containing 25 roles
 */

export default class Play extends SlashCommand {
	constructor() {
		super({
			name: 'play',
			description: 'Invite members to play a game.',
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
			description: `Invite members to play a game. (${start.toUpperCase()} to ${end.toUpperCase()})`,
			type: 'SUB_COMMAND',
			options: [
				{
					name: 'game',
					description: 'Select the game you want to play.',
					type: 'STRING',
					choices: partition.map(role => {
						return {
							name: role.name,
							value: role.id,
						};
					}),
					required: true,
				},
				{
					name: 'player_count',
					description: 'Enter the number of players you\'re looking for. (Max of 25 players per bracket)',
					type: 'INTEGER',
				},
				{
					name: 'reserved_1',
					description: 'Select the user to reserve in this game invite bracket.',
					type: 'USER',
				},
				{
					name: 'reserved_2',
					description: 'Select the user to reserve in this game invite bracket.',
					type: 'USER',
				},
				{
					name: 'reserved_3',
					description: 'Select the user to reserve in this game invite bracket.',
					type: 'USER',
				},
				{
					name: 'reserved_4',
					description: 'Select the user to reserve in this game invite bracket.',
					type: 'USER',
				},
				{
					name: 'reserved_5',
					description: 'Select the user to reserve in this game invite bracket.',
					type: 'USER',
				},
				{
					name: 'description',
					description: 'Enter a custom message to be added into this game invite.',
					type: 'STRING',
				},
			],
		});
	}

	async init(client) {
		this.client = client;

		/** @type {Partition[]} */
		const partitions = new Array();
		const games = this.client.qg.roles.cache.filter(r => r.hexColor === constants.colors.game_role).array();
		const games_alphabetical = games.map(r => r.name.toLowerCase()).sort();
		for (const game_name of games_alphabetical) {
			// Initialize the first and the next partition
			if (!partitions.length || partitions[partitions.length - 1].length > 24) partitions.push(new Array());
			partitions[partitions.length - 1].push(games.find(r => r.name.toLowerCase() === game_name));
		}
		for (const partition of partitions) this.registerPartitionAsSubCommand(partition);

		return this;
	}

	/**
     * @param {CommandInteraction} interaction
     * @param {{game: String, player_count?: Number, description?: String} options
     */
	async exec(interaction, options) {
		// further transform the options to match the properties of a subcommand
		options = options[Object.keys(options)[0]];

		const game_role = this.client.role(options.game);
		if (!game_role) return interaction.reply('Command failed. The game you specified no longer exists.', { ephemeral: true });

		await interaction.defer({ ephemeral: true });

		const inviteOptions = {
			description: options.description,
			player_count: options.player_count,
			reserved: [
				options.reserved_1,
				options.reserved_2,
				options.reserved_3,
				options.reserved_4,
				options.reserved_5,
			],
		};
		const invite = await this.client.game_manager.createInvite(interaction.member, game_role, inviteOptions);
		interaction.editReply(`Got it! [This bracket](${invite.url}) will be available on the ${this.client.channel(constants.qg.channels.integrations.game_invites)} channel.`);
	}
}
