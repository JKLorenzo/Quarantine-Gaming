import { SlashCommand } from '../../../structures/Base.js';
import { constants } from '../../../utils/Base.js';

/**
 * @typedef {import('discord.js').Role} Role
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 */

export default class Invite extends SlashCommand {
	constructor() {
		super({
			name: 'invite',
			description: 'Invite members to play a game.',
			options: [
				{
					name: 'game',
					description: 'Select the game you wanted to play. Note: Only the 25 most-played games in this server are listed.',
					type: 'STRING',
					choices: [],
					required: true,
				},
				{
					name: 'player_count',
					description: 'Enter the number of players you\'re looking for. (25 Max including reserved)',
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

		// Get all the game roles
		const games = this.client.guild.roles.cache.filter(r => {
			if (r.hexColor !== constants.colors.game_role) return false;
			if (r.members.size < 2) return false;
			return true;
		}).array();

		// Sort game roles based on the number of players
		const most_played_games = games.sort((a, b) => a.members.size - b.members.size);

		// Get the first 25 game roles
		const first_25_games = most_played_games.filter((value, index) => index < 25);
		// Sort these game roles alphabetically
		const first_25_game_names = first_25_games.map(role => role.name).sort();

		// Register these roles as choices to this slash command
		first_25_game_names.forEach(game_name => {
			this.options[0].choices.push({
				name: game_name.trim(),
				value: first_25_games.find(role => role.name === game_name).id,
			});
		});

		return this;
	}

	/**
     * @param {CommandInteraction} interaction
     * @param {{game: String, player_count?: Number}} options
     */
	async exec(interaction, options) {
		const game_role = this.client.role(options.game);
		if (!game_role) return interaction.reply('Invite failed. The game you specified is no longer supported.', { ephemeral: true });

		await interaction.defer(true);

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
		interaction.editReply(`Got it! [This bracket](${invite.url}) will be available on the ${this.client.channel(constants.channels.integrations.game_invites)} channel.`);
	}
}
