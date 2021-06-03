import { MessageEmbed } from 'discord.js';
import { SlashCommand } from '../../structures/Base.js';
import { getPercentSimilarity, constants } from '../../utils/Base.js';

/**
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 */

export default class Game extends SlashCommand {
  constructor() {
    super({
      name: 'game',
      description:
        '[Staff/Mod/Booster] Whitelist or blacklist a game used in game roles and play roles.',
      options: [
        {
          name: 'mode',
          description:
            '[Staff/Mod] Whitelist or blacklist a game used in game roles and play roles.',
          type: 'STRING',
          choices: [
            {
              name: 'Whitelist',
              value: 'whitelist',
            },
            {
              name: 'Blacklist',
              value: 'blacklist',
            },
          ],
          required: true,
        },
        {
          name: 'game',
          description:
            'Enter the complete name of the game or mention its corresponding game role.',
          type: 'STRING',
          required: true,
        },
      ],
      defaultPermission: false,
      permissions: {
        roles: {
          allow: [
            constants.qg.roles.staff,
            constants.qg.roles.moderator,
            constants.qg.roles.booster,
          ],
        },
      },
    });
  }

  /**
   * @typedef {Object} Options
   * @property {'whitelist' | 'blacklist'} mode
   * @property {string} game
   */

  /**
   * Executes this command.
   * @param {CommandInteraction} interaction The interaction that triggered this command
   * @param {Options} options The options used by this command
   */
  async exec(interaction, options) {
    await interaction.defer({ ephemeral: true });

    const raw_name = options.game.trim();
    const safe_name = raw_name.toLowerCase();
    let game_name = this.client.role(raw_name)?.name;

    if (!game_name) {
      checkRole: for (const this_role of this.client.qg.roles.cache.array()) {
        if (this_role.hexColor !== constants.colors.game_role) continue;
        if (
          getPercentSimilarity(
            this_role.name.trim().toLowerCase(),
            safe_name,
          ) >= 75
        ) {
          game_name = this_role.name.trim();
          break checkRole;
        }
      }
    }
    if (!game_name) {
      checkPresence: for (const this_member of this.client.qg.members.cache.array()) {
        for (const this_activity of this_member.presence.activities) {
          if (this_activity.type !== 'PLAYING') continue;
          if (
            getPercentSimilarity(
              this_activity.name.trim().toLowerCase(),
              safe_name,
            ) >= 75
          ) {
            game_name = this_activity.name.trim();
            break checkPresence;
          }
        }
      }
    }

    const images = await this.client.methods.fetchImage(game_name ?? raw_name);
    const embed = new MessageEmbed({
      author: { name: 'Quarantine Gaming: Game Role Manager' },
      title: game_name ?? raw_name,
      thumbnail: { url: images?.small },
      description: `Game ${options.mode} requested by ${interaction.member}.`,
      fields: [{ name: 'Status', value: 'Failed' }],
      color: '#FFFF00',
    });

    if (!game_name) {
      embed.fields[0].value = 'Game not found';
    } else if (options.mode === 'whitelist') {
      const result = await this.client.database_manager.gameWhitelist(
        game_name,
      );
      if (result) embed.fields[0].value = 'Game Whitelisted';
    } else {
      const result = await this.client.database_manager.gameBlacklist(
        game_name,
      );
      if (result) embed.fields[0].value = 'Game Blacklisted';
    }

    await this.client.message_manager.sendToChannel(
      constants.cs.channels.game,
      embed,
    );

    await interaction.editReply(embed.fields[0].value);
  }
}
