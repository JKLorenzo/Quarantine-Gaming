/* eslint-disable no-await-in-loop */

import { MessageActionRow, MessageButton } from 'discord.js';
import { MessageComponent } from '../structures/Base.js';
import { sleep } from '../utils/Base.js';

/**
 * @typedef {import('discord.js').MessageComponentInteraction} MessageComponentInteraction
 */

export default class AudioControl extends MessageComponent {
  constructor() {
    super({
      name: 'audio_control',
      options: [
        new MessageActionRow({
          components: [
            new MessageButton({
              customID: 'mute',
              label: 'Mute',
              style: 'DANGER',
            }),
            new MessageButton({
              customID: 'unmute',
              label: 'Unmute members on your voice channel',
              style: 'PRIMARY',
            }),
          ],
        }),
      ],
    });
  }

  init(client) {
    this.client = client;

    const emojis = this.client.emojis.cache;
    this.options[0].components[0].setEmoji(
      emojis.find(e => e.name === 'muted'),
    );
    this.options[0].components[1].setEmoji(
      emojis.find(e => e.name === 'unmute'),
    );

    return this;
  }

  /**
   * @typedef {'mute' | 'unmute'} CustomIDs
   */

  /**
   * Executes this component
   * @param {MessageComponentInteraction} interaction The interaction that triggered this component
   * @param {CustomIDs} customID The customID of the component
   */
  async exec(interaction, customID) {
    const member = this.client.member(interaction.member);
    if (member.voice.channel) {
      await interaction.deferUpdate();
      switch (customID) {
        case 'mute':
          for (const this_member of member.voice.channel.members.array()) {
            if (this_member.voice.mute) continue;
            await this_member.voice.setMute(true);
            await sleep(500);
          }
          break;
        case 'unmute':
          for (const this_member of member.voice.channel.members.array()) {
            if (!this_member.voice.mute) continue;
            await this_member.voice.setMute(false);
            await sleep(500);
          }
          break;
      }
    }
  }
}
