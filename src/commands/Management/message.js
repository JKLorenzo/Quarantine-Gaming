import { MessageEmbed } from 'discord.js';
import { SlashCommand } from '../../structures/Base.js';
import { constants } from '../../utils/Base.js';

/**
 * @typedef {import('discord.js').TextChannel} TextChannel
 * @typedef {import('discord.js').VoiceChannel} VoiceChannel
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 */

export default class Message extends SlashCommand {
  constructor() {
    super({
      name: 'message',
      description:
        '[Staff/Mod] Sends a message to a member or a channel as Quarantine Gaming.',
      options: [
        {
          name: 'channel',
          description:
            '[Staff/Mod] Sends a message to a channel as Quarantine Gaming.',
          type: 'SUB_COMMAND',
          options: [
            {
              name: 'channel',
              description: 'The channel where the message will be sent.',
              type: 'CHANNEL',
              required: true,
            },
            {
              name: 'message',
              description: 'The message to send to the channel.',
              type: 'STRING',
              required: true,
            },
          ],
        },
        {
          name: 'dm',
          description:
            '[Staff/Mod] Sends a message to a member as Quarantine Gaming.',
          type: 'SUB_COMMAND',
          options: [
            {
              name: 'member',
              description: 'The member where the message will be sent.',
              type: 'USER',
              required: true,
            },
            {
              name: 'message',
              description: 'The message to send to the member.',
              type: 'STRING',
              required: true,
            },
          ],
        },
      ],
      defaultPermission: false,
      permissions: {
        roles: {
          allow: [constants.qg.roles.staff, constants.qg.roles.moderator],
        },
      },
    });
  }

  /**
   * @typedef {Object} Options
   * @property {'channel' | 'dm'} option
   * @property {TextChannel | VoiceChannel} [channel]
   * @property {GuildMember} [member]
   * @property {String} message
   */

  /**
   * Execute this command.
   * @param {CommandInteraction} interaction The interaction that triggered this command
   * @param {Options} options The options used by this command
   */
  async exec(interaction, options) {
    await interaction.defer({ ephemeral: true });

    options = options[Object.keys(options)[0]];

    if (options.option === 'channel') {
      const channel = options.channel;
      if (channel.isText()) {
        await this.client.message_manager.sendToChannel(
          channel,
          this.transformMessage(options.message),
        );
      } else {
        await this.client.speech_manager.say(
          channel,
          options.message
            .split(' ')
            .map(
              word =>
                this.client.channel(word)?.name ??
                this.client.member(word)?.displayName ??
                this.client.role(word)?.name ??
                word,
            )
            .join(' '),
        );
      }
    } else {
      const member = options.member;
      if (member.user.bot) {
        return interaction.editReply(
          'Failed to send the message. Supplied member must not be a bot.',
        );
      }
      await this.client.message_manager.sendToUser(member, options.message);
    }
    await interaction.editReply('Message sent!');
  }

  /**
   * @private
   * @param {string} message The message to transform
   * @returns {string | Object} The original message or the transformed message
   */
  transformMessage(message) {
    if (typeof message !== 'string') return message;

    switch (message) {
      case 'rr fgu_pc':
        return this.freeGameUpdatesPC();
      case 'rr fgu_cs':
        return this.freeGameUpdatesCS();
      case 'rr nsfw':
        return this.notSafeForWork();
      default:
        return message;
    }
  }

  /**
   * @private
   * @returns {Object}
   */
  freeGameUpdatesPC() {
    return {
      embeds: [
        new MessageEmbed({
          author: { name: 'Quarantine Gaming: Free Game Updates' },
          title: 'Subscribe to get Updated',
          description: [
            `All free game notifications will be made available on our ${this.client.channel(
              constants.qg.channels.integrations.free_games,
            )} channel.`,
            '',
            `**${this.client.qg.emojis.cache.find(
              e => e.name === 'steam',
            )} - Steam (${this.client.role(constants.qg.roles.steam)})**`,
            'Notifies you with games that are currently free on Steam.',
            '',
            `**${this.client.qg.emojis.cache.find(
              e => e.name === 'epic_games',
            )} - Epic Games (${this.client.role(constants.qg.roles.epic)})**`,
            'Notifies you with games that are currently free on Epic Games.',
            '',
            `**${this.client.qg.emojis.cache.find(
              e => e.name === 'gog',
            )} - GOG (${this.client.role(constants.qg.roles.gog)})**`,
            'Notifies you with games that are currently free on GOG.',
            '',
            `**${this.client.qg.emojis.cache.find(
              e => e.name === 'ubisoft',
            )} - UPlay (${this.client.role(constants.qg.roles.ubisoft)})**`,
            'Notifies you with games that are currently free on UPlay.',
          ].join('\n'),
          image: { url: constants.images.free_games_banner_1 },
          footer: { text: 'Update your role by clicking the buttons below.' },
          color: 'GREEN',
        }),
      ],
      components: [
        this.client.interaction_manager.components
          .get('fgu')
          .getComponents()[0],
      ],
    };
  }

  /**
   * @private
   * @returns {Object}
   */
  freeGameUpdatesCS() {
    const emojis = this.client.emojis.cache;
    return {
      embeds: [
        new MessageEmbed({
          author: { name: 'Quarantine Gaming: Free Game Updates' },
          title: 'Subscribe to get Updated',
          description: [
            `All free game notifications will be made available on our ${this.client.channel(
              constants.qg.channels.integrations.free_games,
            )} channel.`,
            '',
            `**${emojis.find(
              e => e.name === 'xbox',
            )} - Xbox (${this.client.role(constants.qg.roles.xbox)})**`,
            'Notifies you with games that are currently free for Xbox One/360.',
            '',
            `**${emojis.find(
              e => e.name === 'playstation',
            )} - PlayStation (${this.client.role(
              constants.qg.roles.playstation,
            )})**`,
            'Notifies you with games that are currently free for PlayStation 3/4/Vita.',
            '',
            `**${emojis.find(e => e.name === 'wii')} - Wii (${this.client.role(
              constants.qg.roles.wii,
            )})**`,
            'Notifies you with games that are currently free for Wii U/3DS/Switch.',
          ].join('\n'),
          image: { url: constants.images.free_games_banner },
          footer: { text: 'Update your role by clicking the buttons below.' },
          color: 'GREEN',
        }),
      ],
      components: [
        this.client.interaction_manager.components
          .get('fgu')
          .getComponents()[1],
      ],
    };
  }

  /**
   * @private
   * @returns {Object}
   */
  notSafeForWork() {
    return {
      embeds: [
        new MessageEmbed({
          author: { name: 'Quarantine Gaming: NSFW Content' },
          title: 'Unlock NSFW Bots and Channel',
          description: [
            `The ${this.client.role(
              constants.qg.roles.nsfw_bot,
            )} and the ${this.client.channel(
              constants.qg.channels.text.explicit,
            )} channel will be unlocked after getting the role.`,
            '',
            `**🔴 - Not Safe For Work (${this.client.role(
              constants.qg.roles.nsfw,
            )})**`,
            'The marked content may contain nudity, intense sexuality, profanity, ' +
              'violence or other potentially disturbing subject matter.',
          ].join('\n'),
          image: { url: constants.images.nsfw_banner },
          footer: { text: 'Update your role by clicking the button below.' },
          color: 'FUCHSIA',
        }),
      ],
      components: this.client.interaction_manager.components
        .get('nsfw')
        .getComponents(),
    };
  }
}
