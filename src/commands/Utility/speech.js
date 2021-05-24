import { SlashCommand } from '../../structures/Base.js';

/**
 * @typedef {import('discord.js').VoiceChannel} VoiceChannel
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 */

export default class Speech extends SlashCommand {
	constructor() {
		super({
			name: 'speech',
			description: 'Say a message to a voice channel using Quarantine Gaming\'s TTS.',
			options: [
				{
					name: 'voice_channel',
					description: 'Select the target voice channel',
					type: 'CHANNEL',
					required: true,
				},
				{
					name: 'message',
					description: 'Enter the message to be coverted as speech.',
					type: 'STRING',
					required: true,
				},
			],
		});
	}

	/**
     *
     * @param {CommandInteraction} interaction
     * @param {{voice_channel: VoiceChannel, message: String}} options
     */
	async exec(interaction, options) {
		if (options.voice_channel.isText()) return interaction.reply('You must select a valid voice channel.', { ephemeral: true });
		await interaction.defer(true);
		await this.client.speech_manager.say(options.voice_channel, options.message);
		interaction.editReply(`Speech was delivered successfully to ${options.voice_channel}.`);
	}
}