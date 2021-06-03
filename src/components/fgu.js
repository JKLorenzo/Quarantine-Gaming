import { MessageActionRow, MessageButton } from 'discord.js';
import { MessageComponent } from '../structures/Base.js';
import { constants } from '../utils/Base.js';

/**
 * @typedef {import('discord.js').MessageComponentInteraction} MessageComponentInteraction
 */

export default class FreeGameUpdate extends MessageComponent {
  constructor() {
    super({
      name: 'fgu',
      options: [
        new MessageActionRow({
          components: [
            new MessageButton({
              customID: 'steam',
              label: 'Steam',
              style: 'SECONDARY',
            }),
            new MessageButton({
              customID: 'epic',
              label: 'Epic Games',
              style: 'SECONDARY',
            }),
            new MessageButton({
              customID: 'gog',
              label: 'GOG',
              style: 'SECONDARY',
            }),
            new MessageButton({
              customID: 'ubisoft',
              label: 'UPlay',
              style: 'SECONDARY',
            }),
          ],
        }),
        new MessageActionRow({
          components: [
            new MessageButton({
              customID: 'xbox',
              label: 'Xbox',
              style: 'SECONDARY',
            }),
            new MessageButton({
              customID: 'playstation',
              label: 'PlayStation',
              style: 'SECONDARY',
            }),
            new MessageButton({
              customID: 'wii',
              label: 'Wii',
              style: 'SECONDARY',
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
      emojis.find(e => e.name === 'steam'),
    );
    this.options[0].components[1].setEmoji(
      emojis.find(e => e.name === 'epic_games'),
    );
    this.options[0].components[2].setEmoji(emojis.find(e => e.name === 'gog'));
    this.options[0].components[3].setEmoji(
      emojis.find(e => e.name === 'ubisoft'),
    );

    this.options[1].components[0].setEmoji(emojis.find(e => e.name === 'xbox'));
    this.options[1].components[1].setEmoji(
      emojis.find(e => e.name === 'playstation'),
    );
    this.options[1].components[2].setEmoji(emojis.find(e => e.name === 'wii'));

    return this;
  }

  /**
   * @typedef {'steam'
   *  | 'epic'
   *  | 'gog'
   *  | 'ubisoft'
   *  | 'xbox'
   *  | 'playstation'
   *  | 'wii'
   * } CustomIDs
   */

  /**
   * Executes this component
   * @param {MessageComponentInteraction} interaction The interaction that triggered this component
   * @param {CustomIDs} customID The customID of the component
   */
  async exec(interaction, customID) {
    const member = this.client.member(interaction.member);

    switch (customID) {
      case 'steam':
        if (member.roles.cache.has(constants.qg.roles.steam)) {
          await this.client.role_manager.remove(
            member,
            constants.qg.roles.steam,
          );
        } else {
          await this.client.role_manager.add(member, constants.qg.roles.steam);
        }
        break;
      case 'epic':
        if (member.roles.cache.has(constants.qg.roles.epic)) {
          await this.client.role_manager.remove(
            member,
            constants.qg.roles.epic,
          );
        } else {
          await this.client.role_manager.add(member, constants.qg.roles.epic);
        }
        break;
      case 'gog':
        if (member.roles.cache.has(constants.qg.roles.gog)) {
          await this.client.role_manager.remove(member, constants.qg.roles.gog);
        } else {
          await this.client.role_manager.add(member, constants.qg.roles.gog);
        }
        break;
      case 'ubisoft':
        if (member.roles.cache.has(constants.qg.roles.ubisoft)) {
          await this.client.role_manager.remove(
            member,
            constants.qg.roles.ubisoft,
          );
        } else {
          await this.client.role_manager.add(
            member,
            constants.qg.roles.ubisoft,
          );
        }
        break;
      case 'xbox':
        if (member.roles.cache.has(constants.qg.roles.xbox)) {
          await this.client.role_manager.remove(
            member,
            constants.qg.roles.xbox,
          );
        } else {
          await this.client.role_manager.add(member, constants.qg.roles.xbox);
        }
        break;
      case 'playstation':
        if (member.roles.cache.has(constants.qg.roles.playstation)) {
          await this.client.role_manager.remove(
            member,
            constants.qg.roles.playstation,
          );
        } else {
          await this.client.role_manager.add(
            member,
            constants.qg.roles.playstation,
          );
        }
        break;
      case 'wii':
        if (member.roles.cache.has(constants.qg.roles.wii)) {
          await this.client.role_manager.remove(member, constants.qg.roles.wii);
        } else {
          await this.client.role_manager.add(member, constants.qg.roles.wii);
        }
        break;
    }

    await interaction.deferUpdate();
  }
}
