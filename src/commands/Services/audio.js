import { MessageEmbed } from 'discord.js';
import { SlashCommand } from '../../structures/Base.js';

/**
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 */

export default class Audio extends SlashCommand {
	constructor() {
		super({
			name: 'audio',
			description: 'Summon the audio control extension for voice channels.',
		});
	}

	/** @param {CommandInteraction} interaction */
	async exec(interaction) {
		await interaction.defer({ ephemeral: true });

		const embed = new MessageEmbed({
			author: { name: 'Quarantine Gaming: Experience' },
			title: 'Audio Control Extension for Voice Channels',
			description: 'Mute or unmute all members on your current voice channel.',
			color: 'BLURPLE',
			footer: { text: 'Apply actions by clicking the buttons below.' },
		});

		await interaction.editReply({
			embeds: [embed],
			components: this.client.interaction_manager.components.get('audio_control').getComponents(),
		});
	}
}