import { MessageAttachment, MessageEmbed } from 'discord.js';
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

  /**
   * Execute this command.
   * @param {CommandInteraction} interaction The interaction that triggered this command
   */
  async exec(interaction) {
    await interaction.defer({ ephemeral: true });

    await interaction.editReply({
      files: [new MessageAttachment('./src/assets/thumbnails/sound_icon.png')],
      embeds: [
        new MessageEmbed({
          author: { name: 'Quarantine Gaming: Experience' },
          title: 'Audio Control Extension for Voice Channels',
          thumbnail: {
            url: 'attachment://sound_icon.png',
          },
          description:
            'Mute or unmute all members on your current voice channel.',
          color: 'BLURPLE',
          footer: { text: 'Apply actions by clicking the buttons below.' },
        }),
      ],
      components: this.client.interaction_manager.components
        .get('audio_control')
        .getComponents(),
    });
  }
}
