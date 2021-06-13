import { MessageActionRow, MessageButton } from 'discord.js';
import { MessageComponent } from '../structures/Base.js';
import { constants } from '../utils/Base.js';

/**
 * @typedef {import('discord.js').MessageComponentInteraction} MessageComponentInteraction
 */

export default class MemberScreening extends MessageComponent {
  constructor() {
    super({
      name: 'member_screening',
      options: [
        new MessageActionRow({
          components: [
            new MessageButton({
              customID: 'approve',
              label: 'Approve',
              style: 'SUCCESS',
            }),
            new MessageButton({
              customID: 'kick',
              label: 'Deny',
              style: 'PRIMARY',
            }),
            new MessageButton({
              customID: 'ban',
              label: 'Ignore requests from this user',
              style: 'DANGER',
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
      emojis.find(e => e.name === 'accept'),
    );
    this.options[0].components[1].setEmoji(
      emojis.find(e => e.name === 'reject'),
    );
    this.options[0].components[2].setEmoji(
      emojis.find(e => e.name === 'banned'),
    );

    return this;
  }

  /**
   * @typedef {'approve' | 'kick' | 'ban'} CustomIDs
   */

  /**
   * Executes this component
   * @param {MessageComponentInteraction} interaction The interaction that triggered this component
   * @param {CustomIDs} customID The customID of the component
   */
  async exec(interaction, customID) {
    await interaction.deferUpdate();

    let message = this.client.message(
      interaction.message.channel,
      interaction.message,
    );
    if (message.partial) message = await message.fetch();

    const embed = message.embeds[0];
    const member = this.client.member(embed.fields[0].value);
    const inviter = this.client.member(embed.fields[1].value);
    const moderator = this.client.member(interaction.member);

    if (member) {
      const data = {};
      switch (customID) {
        case 'approve':
          await this.client.role_manager.add(member, constants.qg.roles.member);
          if (inviter) data.inviter = inviter.id;
          if (moderator) data.moderator = moderator.id;
          await this.client.database_manager.updateMemberData(member.id, data);
          embed.fields[3].value = `Approved by ${moderator}`;
          embed.setColor('GREEN');
          break;
        case 'kick':
          await member.kick();
          embed.fields[3].value = `Kicked by ${moderator}`;
          embed.setColor('FUCHSIA');
          break;
        case 'ban':
          await member.ban({
            reason: `Gateway Ban by ${moderator.displayName}.`,
          });
          embed.fields[3].value = `Banned by ${moderator}`;
          embed.setColor('RED');
          break;
      }
    } else {
      embed.fields[3].value = 'User not found ⚠';
      embed.setColor('LUMINOUS_VIVID_PINK');
    }

    await message.edit({
      embeds: [embed.setFooter(new Date().toString())],
      components: [],
    });

    const messages = await message.channel.messages.fetch();
    const ping_messages = messages.filter(msg =>
      msg.content.startsWith(member.toString()),
    );
    await message.channel.bulkDelete(ping_messages);

    if (!member) return;

    // Send screening result to user
    let feedback = null;
    if (customID === 'approve') {
      feedback = [
        'Hooraaay! 🥳 Your membership request has been approved!',
        'You will now have access to all the features of this server!',
        '',
        [
          'You can view the commands supported by this server by typing `/`',
          "in any of the server's text channels. (Ex. `/ping`)",
        ].join(' '),
      ].join('\n');
    } else if (customID === 'kick') {
      feedback =
        'Sorry, it seemed like your request to join this server was denied.';
    } else if (customID === 'ban') {
      feedback =
        'Sorry, it seemed like your request to join this server was denied indefinitely.';
    }
    if (feedback) {
      await this.client.message_manager.sendToUser(member, feedback);
    }
  }
}
