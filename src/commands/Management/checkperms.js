import { MessageEmbed, Permissions, Role } from 'discord.js';
import { SlashCommand } from '../../structures/Base.js';
import { constants } from '../../utils/Base.js';

const {
  ADD_REACTIONS,
  ADMINISTRATOR,
  ATTACH_FILES,
  BAN_MEMBERS,
  CHANGE_NICKNAME,
  CONNECT,
  CREATE_INSTANT_INVITE,
  DEAFEN_MEMBERS,
  EMBED_LINKS,
  KICK_MEMBERS,
  MANAGE_CHANNELS,
  MANAGE_EMOJIS,
  MANAGE_GUILD,
  MANAGE_MESSAGES,
  MANAGE_NICKNAMES,
  MANAGE_ROLES,
  MANAGE_WEBHOOKS,
  MENTION_EVERYONE,
  MOVE_MEMBERS,
  MUTE_MEMBERS,
  PRIORITY_SPEAKER,
  READ_MESSAGE_HISTORY,
  REQUEST_TO_SPEAK,
  SEND_MESSAGES,
  SEND_TTS_MESSAGES,
  SPEAK,
  STREAM,
  USE_APPLICATION_COMMANDS,
  USE_EXTERNAL_EMOJIS,
  USE_VAD,
  VIEW_AUDIT_LOG,
  VIEW_CHANNEL,
  VIEW_GUILD_INSIGHTS,
} = Permissions.FLAGS;

/**
 * @typedef {import('discord.js').GuildMember} GuildMember
 * @typedef {import('discord.js').GuildChannel} GuildChannel
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 */

export default class CheckPerms extends SlashCommand {
  constructor() {
    super({
      name: 'checkperms',
      description: '[Staff/Mod] Gets the permissions of a member or a role.',
      options: [
        {
          name: 'userperms',
          description: '[Staff/Mod] Gets the permissions of a user.',
          type: 'SUB_COMMAND',
          options: [
            {
              name: 'user',
              description: 'The target user to check the permissions.',
              type: 'USER',
              required: true,
            },
            {
              name: 'channel',
              description: 'The channel to check the permissions from.',
              type: 'CHANNEL',
              required: true,
            },
            {
              name: 'advanced',
              description: 'Include server permissions.',
              type: 'BOOLEAN',
            },
          ],
        },
        {
          name: 'roleperms',
          description: '[Staff/Mod] Gets the permissions of a role.',
          type: 'SUB_COMMAND',
          options: [
            {
              name: 'role',
              description: 'The target role to check the permissions.',
              type: 'ROLE',
              required: true,
            },
            {
              name: 'channel',
              description: 'The channel to check the permissions from.',
              type: 'CHANNEL',
              required: true,
            },
            {
              name: 'advanced',
              description: 'Include server permissions.',
              type: 'BOOLEAN',
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
   * @property {GuildMember} [user]
   * @property {Role} [role]
   * @property {GuildChannel} channel
   * @property {boolean} [advanced]
   */

  /**
   * Execute this command.
   * @param {CommandInteraction} interaction The interaction that triggered this command
   * @param {Options} options The options used by this command
   */
  async exec(interaction, options) {
    await interaction.defer({ ephemeral: true });

    options = options[Object.keys(options)[0]];

    const target = options.user || options.role;
    const channel = options.channel;
    const advanced = options.advanced;

    const entity_permissions = channel.permissionsFor(target);
    const server_permissions = {
      flags: [
        ADMINISTRATOR,
        BAN_MEMBERS,
        CHANGE_NICKNAME,
        KICK_MEMBERS,
        MANAGE_EMOJIS,
        MANAGE_GUILD,
        MANAGE_NICKNAMES,
        VIEW_AUDIT_LOG,
        VIEW_GUILD_INSIGHTS,
      ],
      result: [],
    };
    const general_channel_permissions = {
      flags: [VIEW_CHANNEL, MANAGE_CHANNELS, MANAGE_ROLES, MANAGE_WEBHOOKS],
      result: [],
    };
    const membership_permissions = {
      flags: [CREATE_INSTANT_INVITE],
      result: [],
    };
    const text_channel_permissions = {
      flags: [
        SEND_MESSAGES,
        EMBED_LINKS,
        ATTACH_FILES,
        ADD_REACTIONS,
        USE_EXTERNAL_EMOJIS,
        MENTION_EVERYONE,
        MANAGE_MESSAGES,
        READ_MESSAGE_HISTORY,
        SEND_TTS_MESSAGES,
        USE_APPLICATION_COMMANDS,
      ],
      result: [],
    };
    const voice_channel_permissions = {
      flags: [
        CONNECT,
        SPEAK,
        STREAM,
        USE_VAD,
        PRIORITY_SPEAKER,
        MUTE_MEMBERS,
        DEAFEN_MEMBERS,
        MOVE_MEMBERS,
      ],
      result: [],
    };
    const stage_channel_permissions = {
      flags: [REQUEST_TO_SPEAK],
      result: [],
    };
    const others_permissions = [];

    for (let [permission_name, permission] of Object.entries(
      Permissions.FLAGS,
    ).sort()) {
      permission_name = permission_name
        .split('_')
        .map(word => {
          if (word === 'TTS') return 'Text-to-Speech';
          if (word === 'VAD') return 'Voice Activity';
          return word.charAt(0).toUpperCase() + word.substring(1).toLowerCase();
        })
        .join(' ');

      const this_permission = `${
        entity_permissions.has(permission) ? '✅' : '❌'
      } - ${permission_name}`;
      if (server_permissions.flags.includes(permission)) {
        server_permissions.result.push(this_permission);
      } else if (general_channel_permissions.flags.includes(permission)) {
        general_channel_permissions.result.push(this_permission);
      } else if (membership_permissions.flags.includes(permission)) {
        membership_permissions.result.push(this_permission);
      } else if (text_channel_permissions.flags.includes(permission)) {
        text_channel_permissions.result.push(this_permission);
      } else if (voice_channel_permissions.flags.includes(permission)) {
        voice_channel_permissions.result.push(this_permission);
      } else if (stage_channel_permissions.flags.includes(permission)) {
        stage_channel_permissions.result.push(this_permission);
      } else {
        others_permissions.push(this_permission);
      }
    }

    const embed = new MessageEmbed({
      author: { name: 'Quarantine Gaming: Permission Flags' },
      title: `${target instanceof Role ? 'Role' : 'Member'} Permissions Report`,
      description: `${target} permissions on ${channel} channel.`,
      color: '#FFFF00',
      timestamp: new Date(),
    });

    if (advanced) {
      embed.addField(
        'Server Permissions',
        server_permissions.result.join('\n'),
      );
    }
    embed.addField(
      'General Channel Permissions',
      general_channel_permissions.result.join('\n'),
    );
    embed.addField(
      'Membership Permissions',
      membership_permissions.result.join('\n'),
    );
    switch (channel.type) {
      case 'text':
      case 'news':
      case 'store':
        embed.addField(
          'Text Channel Permissions',
          text_channel_permissions.result.join('\n'),
        );
        break;
      case 'voice':
        embed.addField(
          'Voice Channel Permissions',
          voice_channel_permissions.result.join('\n'),
        );
        break;
      case 'category':
        embed.addField(
          'Text Channel Permissions',
          text_channel_permissions.result.join('\n'),
        );
        embed.addField(
          'Voice Channel Permissions',
          voice_channel_permissions.result.join('\n '),
        );
        break;
    }
    if (others_permissions.length) {
      embed.addField(
        'Uncategorized Permissions',
        others_permissions.join('\n'),
      );
    }

    interaction.editReply(embed);
  }
}
