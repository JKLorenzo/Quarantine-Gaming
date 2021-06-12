import { SlashCommand } from '../../structures/Base.js';

/**
 * @typedef {import('discord.js').GuildMember} GuildMember
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 */

export default class Transfer extends SlashCommand {
  constructor() {
    super({
      name: 'transfer',
      description:
        'Transfers a member from another voice channel to your current voice channel.',
      options: [
        {
          name: 'member_1',
          description: "Select the member you'd like to transfer.",
          type: 'USER',
          required: true,
        },
        {
          name: 'member_2',
          description: "Select the member you'd like to transfer.",
          type: 'USER',
        },
        {
          name: 'member_3',
          description: "Select the member you'd like to transfer.",
          type: 'USER',
        },
        {
          name: 'member_4',
          description: "Select the member you'd like to transfer.",
          type: 'USER',
        },
        {
          name: 'member_5',
          description: "Select the member you'd like to transfer.",
          type: 'USER',
        },
      ],
    });
  }

  /**
   * @typedef {Object} Options
   * @property {GuildMember} member_1
   * @property {GuildMember} [member_2]
   * @property {GuildMember} [member_3]
   * @property {GuildMember} [member_4]
   * @property {GuildMember} [member_5]
   */

  /**
   * Execute this command.
   * @param {CommandInteraction} interaction The interaction that triggered this command
   * @param {Options} options The options used by this command
   */
  async exec(interaction, options) {
    const voice_channel = this.client.member(interaction.member)?.voice.channel;
    if (!voice_channel) {
      return interaction.reply({
        content: 'You must be active on a voice channel to use this command.',
        ephemeral: true,
      });
    }
    await interaction.defer({ ephemeral: true });

    /** @type {GuildMember[]} */
    const members = Object.keys(options).map(name => options[name]);
    const available = members.filter(m => m.voice.channel);

    const transfer_message = `You have been transferred to ${voice_channel} by ${interaction.member}.`;
    await this.client.methods.voiceChannelTransfer(
      voice_channel,
      available,
      transfer_message,
    );

    return interaction.editReply(
      `Successfully transferred ${available.join(', ')} to ${voice_channel}.`,
    );
  }
}
