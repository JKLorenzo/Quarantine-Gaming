import { MessageEmbed } from 'discord.js';
import { SlashCommand } from '../../structures/Base.js';
import { constants } from '../../utils/Base.js';

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
			thumbnail: { url: constants.images.audio_control_thumbnail },
			fields: [
				{ name: 'Actions:', value: '🟠 - Mute', inline: true },
				{ name: '\u200b', value: '🟢 - Unmute', inline: true },
			],
			color: '#ffff00',
			footer: { text: 'Apply selected actions by reacting below.' },
		});

		await this.client.message_manager.sendToChannel(interaction.channel, embed).then(async reply => {
			await this.client.reaction_manager.add(reply, ['🟠', '🟢']);
			if (reply && reply.deletable) reply.delete({ timeout: 1800000 }).catch(e => void e);
		});

		interaction.editReply('Done!');
	}
}