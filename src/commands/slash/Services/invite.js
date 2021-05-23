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
					name: 'game_role',
					description: 'Select the game role representing the game you wanted to play.',
					type: 'ROLE',
					required: true,
				},
				{
					name: 'description',
					description: 'Enter a custom message to be added into this game invite.',
					type: 'STRING',
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
			],
		});
	}

	/**
     * @param {CommandInteraction} interaction
     * @param {{game_role: Role, player_count?: Number}} options
     */
	async exec(interaction, options) {
		if (options.game_role.hexColor !== constants.colors.game_role) {
			return interaction.reply('Invalid game role. Please try again.', { ephemeral: true });
		}

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
		const invite = await this.client.game_manager.createInvite(interaction.member, options.game_role, inviteOptions);
		interaction.editReply(`Got it! [This bracket](${invite.url}) will be available on the ${this.client.channel(constants.channels.integrations.game_invites)} channel.`);
	}
}
