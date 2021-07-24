import { MessageEmbed } from 'discord.js';
import { SlashCommand } from '../../structures/Base.js';
import { compareDate, constants } from '../../utils/Base.js';

/**
 * @typedef {import('discord.js').GuildMember} GuildMember
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 */

export default class CheckUser extends SlashCommand {
  constructor() {
    super({
      name: 'checkuser',
      description: 'Shows all the information of a user.',
      options: [
        {
          name: 'user',
          description: "The user you'd like to check",
          type: 'USER',
          required: true,
        },
      ],
    });
  }

  /**
   * @typedef {Object} Options
   * @property {GuildMember} [user]
   */

  /**
   * Execute this command.
   * @param {CommandInteraction} interaction The interaction that triggered this command
   * @param {Options} options The options used by this command
   */
  async exec(interaction, options) {
    await interaction.defer({ ephemeral: true });

    const member = options.user;
    const data = await this.client.database_manager.getMemberData(member.id);
    const inviter = this.client.member(data.inviter);
    const moderator = this.client.member(data.moderator);

    const created_day = member.user.createdAt;
    const created_day_formatted = [
      `\`${new Date(created_day)
        .toString()
        .split(' ')
        .splice(0, 5)
        .join(' ')}\``,
      `(${compareDate(created_day).estimate} ago)`,
    ].join(' ');

    const joined_day = member.joinedAt;
    const joined_day_formatted = [
      `\`${new Date(joined_day)
        .toString()
        .split(' ')
        .splice(0, 5)
        .join(' ')}\``,
      `(${compareDate(joined_day).estimate} ago)`,
    ].join(' ');

    const roles = member.roles.cache
      .filter(role => {
        if (role.hexColor === constants.colors.game_role) return false;
        if (role.hexColor === constants.colors.play_role) return false;
        if (role.name.startsWith('Team 🔰')) return false;
        return true;
      })
      .sorted((r1, r2) => r2.position - r1.position)
      .map(role => role.toString())
      .join(', ');

    const games = member.roles.cache
      .filter(role => role.hexColor === constants.colors.game_role)
      .sorted((r1, r2) => r2.name - r1.name)
      .map(role => role.toString())
      .join(', ');

    const embed = new MessageEmbed({
      author: { name: 'Quarantine Gaming: Member Catalog' },
      title: member.user.tag,
      fields: [
        {
          name: 'Profile:',
          value: member.toString(),
          inline: true,
        },
        {
          name: 'User ID:',
          value: member.user.id,
          inline: true,
        },
        {
          name: 'Status:',
          value: member.presence.status
            .replace('online', 'Online')
            .replace('idle', 'AFK')
            .replace('offline', 'Offline or Invisible')
            .replace('dnd', 'Do Not Disturb'),
          inline: true,
        },
        {
          name: 'Invited by:',
          value: inviter?.toString() ?? 'N/A',
        },
        {
          name: 'Moderated by:',
          value: moderator?.toString() ?? 'N/A',
        },
        {
          name: 'Joined Discord on:',
          value: created_day_formatted,
        },
        {
          name: 'Joined Quarantine Gaming on:',
          value: joined_day_formatted,
        },
        {
          name: 'Roles:',
          value: roles.length ? roles : 'None',
        },
        {
          name: 'Games:',
          value: games.length ? games : 'None',
        },
      ],
      color: '#FFFF00',
      timestamp: new Date(),
    });

    interaction.editReply({ embeds: [embed] });
  }
}
