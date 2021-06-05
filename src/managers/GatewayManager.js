import { Collection, MessageEmbed } from 'discord.js';
import { ErrorTicketManager, compareDate, constants } from '../utils/Base.js';

/**
 * @typedef {import('discord.js').Invite} Invite
 * @typedef {import('discord.js').Message} Message
 * @typedef {import('discord.js').GuildMember} GuildMember
 * @typedef {import('discord.js').TextChannel} TextChannel
 * @typedef {import('../structures/Base').Client} Client
 */

const ETM = new ErrorTicketManager('Gateway Manager');

export default class GatewayManager {
  /**
   * @param {Client} client The QG Client
   */
  constructor(client) {
    this.client = client;

    /** @type {Collection<String, Invite>} */
    this.data = new Collection();

    client.on('inviteCreate', async invite => {
      if (invite.guild.id !== constants.qg.guild) return;
      try {
        this.invites.set(invite.code, invite);

        const expire_date = invite.expiresAt;
        const formatted_date = [
          `\`${new Date(expire_date)
            .toString()
            .split(' ')
            .splice(0, 5)
            .join(' ')}\``,
          `(${compareDate(expire_date).estimate})`,
        ].join(' ');

        const description = [`**Created By:** ${invite.inviter}`];
        if (invite.targetUser) {
          description.push(`**Target User:** ${invite.targetUser}`);
        }
        if (invite.memberCount) {
          description.push(
            `**Target Guild Member Count:** ${invite.memberCount}`,
          );
        }
        if (typeof invite.maxUses === 'number') {
          description.push(`**Max Uses:** ${invite.maxUses ?? 'Infinite'}`);
        }
        if (invite.expiresAt) {
          description.push(`**Expires:** ${formatted_date}`);
        }

        await client.message_manager.sendToChannel(
          constants.cs.channels.gateway_events,
          new MessageEmbed({
            author: { name: 'Quarantine Gaming: Server Gateway' },
            title: 'Invite Created',
            description: description.join('\n'),
            thumbnail: { url: invite.inviter.displayAvatarURL() },
            footer: { text: `Reference ID: ${invite.code}` },
            color: 'BLURPLE',
          }),
        );
      } catch (error) {
        this.client.error_manager.mark(ETM.create('inviteCreate', error));
      }
    });

    client.on('inviteDelete', async invite => {
      if (invite.guild.id !== constants.qg.guild) return;
      try {
        invite = this.invites.get(invite.code) ?? invite;

        const expire_date = invite.expiresAt;
        const formatted_date = [
          `\`${new Date(expire_date)
            .toString()
            .split(' ')
            .splice(0, 5)
            .join(' ')}\``,
          `(${compareDate(expire_date).estimate})`,
        ].join(' ');

        const description = [`**Created By:** ${invite.inviter}`];
        if (invite.targetUser) {
          description.push(`**Target User:** ${invite.targetUser}`);
        }
        if (invite.memberCount) {
          description.push(
            `**Target Guild Member Count:** ${invite.memberCount}`,
          );
        }
        if (typeof invite.maxUses === 'number') {
          description.push(`**Max Uses:** ${invite.maxUses ?? 'Infinite'}`);
        }
        if (invite.expiresAt) {
          description.push(`**Expires:** ${formatted_date}`);
        }

        await client.message_manager.sendToChannel(
          constants.cs.channels.gateway_events,
          new MessageEmbed({
            author: { name: 'Quarantine Gaming: Server Gateway' },
            title: 'Invite Deleted',
            description: description.join('\n'),
            thumbnail: { url: invite.inviter.displayAvatarURL() },
            footer: { text: `Reference ID: ${invite.code}` },
            color: 'BLURPLE',
          }),
        );

        if (invite.maxUses !== 1 || Date.now() >= invite.expiresTimestamp) {
          this.invites.delete(invite.code);
        }
      } catch (error) {
        this.client.error_manager.mark(ETM.create('inviteDelete', error));
      }
    });

    client.on('guildMemberAdd', async member => {
      if (member.guild.id !== constants.qg.guild) return;
      try {
        const current_invites = await client.qg.fetchInvites();

        const created_day = member.user.createdAt;
        const formatted_date = [
          `\`${new Date(created_day)
            .toString()
            .split(' ')
            .splice(0, 5)
            .join(' ')}\``,
          `(${compareDate(created_day).estimate} ago)`,
        ].join(' ');

        await client.message_manager.sendToChannel(
          constants.cs.channels.gateway_events,
          new MessageEmbed({
            author: { name: 'Quarantine Gaming: Server Gateway' },
            title: member.user.tag,
            description: [
              `**Profile:** ${member}`,
              `**Created:** ${formatted_date}`,
            ].join('\n'),
            thumbnail: { url: member.user.displayAvatarURL() },
            footer: { text: `Member Join • Reference ID: ${member.user.id}` },
            color: 'GREEN',
          }),
        );

        if (member.user.bot) return;

        let invite_used = null;
        const diff = current_invites
          .difference(this.invites)
          .filter(i => i.expiresTimestamp > Date.now() && i.maxUses === 1);
        if (diff.size === 1) {
          invite_used = diff.first();
          this.invites.delete(invite_used.code);
        } else {
          for (const current_invite of current_invites.array()) {
            const this_invite = this.invites.get(current_invite.code);
            if (
              !this_invite ||
              (this_invite && Date.now() > this_invite.expiresTimestamp)
            ) {
              continue;
            }
            if (current_invite.uses <= this_invite.uses) {
              continue;
            }
            invite_used = current_invite;
            break;
          }
        }
        await this.ScreenMember(member, invite_used);
        await this.client.database_manager.setMemberData({
          id: member.id,
          name: member.displayName,
          tagname: member.user.tag,
        });
      } catch (error) {
        this.client.error_manager.mark(ETM.create('guildMemberAdd', error));
      }
    });

    client.on('guildMemberUpdate', async (oldMember, newMember) => {
      if (newMember.user.bot) return;
      if (newMember.guild.id !== constants.qg.guild) return;
      try {
        if (newMember.pending || oldMember.pending === newMember.pending) {
          return;
        }

        /** @type {TextChannel} */
        const channel = client.channel(constants.cs.channels.gateway);
        const messages = await channel.messages.fetch();
        let message = messages.find(this_message => {
          const member = client.member(
            this_message.embeds[0]?.fields[0]?.value,
          );
          return (
            member?.id === newMember.id &&
            this_message.embeds[0]?.fields[3]?.value === 'Pending'
          );
        });

        if (!newMember.user.bot) {
          await client.message_manager.sendToUser(
            newMember,
            [
              "Almost there! Don't worry, you don't need to do anything from here.",
              'We just need to confirm a few more things before granting you access to this server.',
            ].join('\n'),
          );
        }

        if (!message) message = await this.ScreenMember(newMember, null, false);

        const embed = message.embeds[0];
        embed.fields[3].value = 'Action Required';
        embed.setColor('YELLOW');

        const action_message = await message.edit({
          content: null,
          embed: embed.setFooter(
            'Apply actions by clicking one of the buttons below.',
          ),
          components: this.client.interaction_manager.components
            .get('member_screening')
            .getComponents(),
        });
        await action_message.reply(
          `${newMember} wants to join the server, ${this.client.cs.roles.everyone}.`,
        );
      } catch (error) {
        this.client.error_manager.mark(ETM.create('guildMemberUpdate', error));
      }
    });

    client.on('guildMemberRemove', async member => {
      if (member.guild.id !== constants.qg.guild) return;
      try {
        const joined_day = member.joinedAt;
        const formatted_date = [
          `\`${new Date(joined_day)
            .toString()
            .split(' ')
            .splice(0, 5)
            .join(' ')}\``,
          `(${compareDate(joined_day).estimate} ago)`,
        ].join(' ');

        await client.message_manager.sendToChannel(
          constants.cs.channels.gateway_events,
          new MessageEmbed({
            author: { name: 'Quarantine Gaming: Server Gateway' },
            title: member.user.tag,
            description: [
              `**Profile:** ${member}`,
              `**Joined:** ${formatted_date}`,
            ].join('\n'),
            thumbnail: { url: member.user.displayAvatarURL() },
            footer: { text: `Member Leave • Reference ID: ${member.user.id}` },
            color: 'RED',
          }),
        );
      } catch (error) {
        this.client.error_manager.mark(ETM.create('guildMemberRemove', error));
      }
    });

    client.on('guildBanAdd', async ban => {
      if (ban.guild.id !== constants.qg.guild) return;

      await client.message_manager.sendToChannel(
        constants.cs.channels.gateway_events,
        new MessageEmbed({
          author: { name: 'Quarantine Gaming: Server Gateway' },
          title: ban.user.tag,
          description: [
            `**Profile:** ${ban.user}`,
            `**Reason:** ${ban.reason ?? 'No reason given'}`,
          ].join('\n'),
          thumbnail: { url: ban.user.displayAvatarURL() },
          footer: { text: `Member Ban • Reference ID: ${ban.user.id}` },
          color: 'DARK_RED',
        }),
      );
    });

    client.on('guildBanRemove', async ban => {
      if (ban.guild.id !== constants.qg.guild) return;

      await client.message_manager.sendToChannel(
        constants.cs.channels.gateway_events,
        new MessageEmbed({
          author: { name: 'Quarantine Gaming: Server Gateway' },
          title: ban.user.tag,
          description: [
            `**Profile:** ${ban.user}`,
            `**Ban Reason:** ${ban.reason ?? 'No reason given'}`,
          ].join('\n'),
          thumbnail: { url: ban.user.displayAvatarURL() },
          footer: { text: `Member Unban • Reference ID: ${ban.user.id}` },
          color: 'AQUA',
        }),
      );
    });
  }

  async init() {
    try {
      this.invites = await this.client.qg.fetchInvites();
      this.client.message_manager.sendToChannel(
        constants.cs.channels.logs,
        '✅ - Gateway Manager',
      );
    } catch (error) {
      this.client.message_manager.sendToChannel(
        constants.cs.channels.logs,
        '❌ - Gateway Manager',
      );
      throw error;
    }
  }

  /**
   * @private Screens this member
   * @param {GuildMember} member The member to screen
   * @param {Invite} [invite] The invite used by this member
   * @param {boolean} [showWelcome] Whether to show the welcome message or not
   * @returns {Promise<Message>}
   */
  async ScreenMember(member, invite, showWelcome = true) {
    try {
      if (member.user.bot) return;

      if (showWelcome) {
        await this.client.message_manager.sendToUser(member, {
          content: [
            `Hi ${member.user.username}, and welcome to **Quarantine Gaming**!`,
            'Before you will be given full access to this server, you must first ' +
              "complete the server's screening process.",
          ].join('\n'),
        });
      }

      const created_day = member.user.createdAt;
      const embed = new MessageEmbed({
        author: { name: 'Quarantine Gaming: Server Gateway' },
        title: 'Member Screening',
        thumbnail: { url: member.user.displayAvatarURL() },
        fields: [
          {
            name: `Profile: (${member.user.username})`,
            value: member.toString(),
          },
          {
            name: `Inviter Profile: (${invite?.inviter?.username ?? 'N\\A'})`,
            value: invite?.inviter?.toString() ?? 'No information',
          },
          {
            name: `Account Created: (${compareDate(created_day).estimate} ago)`,
            value: new Date(created_day).toString(),
          },
          { name: 'Status:', value: 'Pending' },
        ],
        footer: {
          text: 'Member must complete the membership verfication gate.',
        },
        color: 'BLURPLE',
      });

      // Check if there is already a screening process for this user
      /** @type {TextChannel} */
      const channel = this.client.channel(constants.cs.channels.gateway);
      const messages = await channel.messages.fetch();
      const message = messages.find(this_message => {
        const this_member = this.client.member(
          this_message.embeds[0]?.fields[0]?.value,
        );
        return (
          this_member?.id === member.id &&
          (this_message.embeds[0]?.fields[3]?.value === 'Pending' ||
            this_message.embeds[0]?.fields[3]?.value === 'Action Required')
        );
      });

      return message
        ? await message.edit({
            content: null,
            embed: embed,
            components: [],
          })
        : await this.client.message_manager.sendToChannel(
            constants.cs.channels.gateway,
            embed,
          );
    } catch (error) {
      this.client.error_manager.mark(ETM.create('ScreenMember', error));
    }
  }
}
