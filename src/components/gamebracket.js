import { MessageActionRow, MessageButton } from 'discord.js';
import { MessageComponent } from '../structures/Base.js';

/**
 * @typedef {import('discord.js').MessageComponentInteraction} MessageComponentInteraction
 */

export default class GameBracket extends MessageComponent {
	constructor() {
		super({
			name: 'gamebracket',
			options: [
				new MessageActionRow({
					components: [
						new MessageButton({
							customID: 'join',
							label: 'Join this Bracket',
							style: 'PRIMARY',
						}),
						new MessageButton({
							customID: 'leave',
							label: 'Leave',
							style: 'DANGER',
						}),
					],
				}),
			],
		});
	}

	async init(client) {
		this.client = client;

		this.options[0].components[0].setEmoji(this.client.guild.emojis.cache.find(e => e.name === 'blob_game'));

		return this;
	}

	/**
     * @param {MessageComponentInteraction} interaction
     * @param {'join' | 'leave'} customID
     */
	async exec(interaction, customID) {
		await interaction.deferUpdate();
		await this.client.game_manager.processBracket(interaction.message, customID, interaction.member);
	}
}