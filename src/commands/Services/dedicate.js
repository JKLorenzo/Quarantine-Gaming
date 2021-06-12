import { MessageEmbed } from 'discord.js';
import { SlashCommand } from '../../structures/Base.js';
import { parseMention, constants } from '../../utils/Base.js';

/**
 * @typedef {import('discord.js').TextChannel} TextChannel
 * @typedef {import('discord.js').CategoryChannel} CategoryChannel
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 */

export default class Dedicate extends SlashCommand {
  constructor() {
    super({
      name: 'dedicate',
      description: 'Create a dedicated channel for your current voice channel.',
      options: [
        {
          name: 'custom_name',
          description: 'Enter the name of the dedicated channel to create.',
          type: 'STRING',
        },
        {
          name: 'lock',
          description: 'Would you like to lock this dedicated channel?',
          type: 'BOOLEAN',
        },
      ],
    });
  }

  /**
   * @typedef {Object} Options
   * @property {string} [custom_name]
   * @property {boolean} [lock]
   */

  /**
   * Execute this command.
   * @param {CommandInteraction} interaction The interaction that triggered this command
   * @param {Options} options The options used by this command
   */
  async exec(interaction, options) {
    await interaction.defer({ ephemeral: true });
    const reply_message = [];

    const member = this.client.member(interaction.user);
    let voice_channel = member.voice.channel;
    if (!voice_channel) {
      reply_message.push(
        'You must be connected to any voice channels to create a dedicated channel.',
      );
      return interaction.editReply(reply_message.join('\n'));
    }

    // Format custom name if it is mentionable
    if (options.custom_name) {
      options.custom_name =
        this.client.member(options.custom_name)?.displayName ??
        this.client.role(options.custom_name)?.name ??
        this.client.channel(options.custom_name)?.name ??
        options.custom_name;
    }

    if (
      voice_channel.parentID === constants.qg.channels.category.dedicated_voice
    ) {
      if (
        options.custom_name &&
        options.custom_name !== voice_channel.name.substring(1)
      ) {
        reply_message.push(
          `Alright, renaming your dedicated channel to **${options.custom_name}**.`,
        );
        await interaction.editReply(reply_message.join('\n'));
      }
    } else {
      if (!options.custom_name) {
        const game_name = this.client.methods.getMostPlayedGame(
          voice_channel.members.array(),
        );
        options.custom_name = game_name?.length
          ? game_name
          : member.displayName;
      }

      reply_message.push(
        `Got it! Please wait while I'm preparing **${options.custom_name}** voice and text channels.`,
      );
      await interaction.editReply(reply_message.join('\n'));
    }

    const data = await this.client.dedicated_channel_manager.create(
      voice_channel,
      options.custom_name,
    );
    if (data) {
      voice_channel = data.voice_channel;
      if (data.transfer_process) {
        reply_message.push(
          `You will be transfered to ${data.voice_channel} dedicated channel momentarily.`,
        );
        await interaction.editReply(reply_message.join('\n'));
        await data.transfer_process;
        reply_message.push(
          `Transfer complete! Here are your dedicated ${data.voice_channel} ` +
            `voice and ${data.text_channel} text channels.`,
        );
        await interaction.editReply(reply_message.join('\n'));
      }
    }

    if (typeof options.lock === 'boolean') {
      reply_message.push(
        `${
          options.lock ? 'Locking' : 'Unlocking'
        } ${voice_channel} dedicated channel.`,
      );
      await interaction.editReply(reply_message.join('\n'));

      if (options.lock) {
        await voice_channel.updateOverwrite(constants.qg.roles.member, {
          CONNECT: false,
        });
      } else {
        await voice_channel.updateOverwrite(constants.qg.roles.member, {
          CONNECT: true,
        });
      }

      /** @type {CategoryChannel} */
      const dedicated_text_channels_category = this.client.channel(
        constants.qg.channels.category.dedicated,
      );
      /** @type {Array<TextChannel>} */
      const dedicated_text_channels =
        dedicated_text_channels_category.children.array();
      const text_channel = dedicated_text_channels.find(
        channel =>
          channel.topic &&
          parseMention(channel.topic.split(' ')[0]) === voice_channel.id,
      );
      const embed = new MessageEmbed({
        author: { name: 'Quarantine Gaming: Dedicated Channels' },
        title: 'Permission Changed',
        description: `${member} ${
          options.lock ? 'locked' : 'unlocked'
        } this channel.`,
        color: '#FFE500',
        timestamp: new Date(),
      });
      await this.client.message_manager.sendToChannel(text_channel, {
        embeds: [embed],
      });
    }

    reply_message.push('All done!');
    await interaction.editReply(reply_message.join('\n'));
  }
}
