import { MessageActionRow, MessageButton } from 'discord.js';
import { MessageComponent } from '../structures/Base.js';

/**
 * @typedef {import('discord.js').MessageComponentInteraction} MessageComponentInteraction
 */

export default class GameScreening extends MessageComponent {
  constructor() {
    super({
      name: 'game_screening',
      options: [
        new MessageActionRow({
          components: [
            new MessageButton({
              customID: 'approve',
              label: 'Approve',
              style: 'SUCCESS',
            }),
            new MessageButton({
              customID: 'deny',
              label: 'Deny',
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

    return this;
  }

  /**
   * @typedef {'approve' | 'deny'} CustomIDs
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
    const game_name = embed.fields[0].value;
    const moderator = this.client.member(interaction.member);

    switch (customID) {
      case 'approve':
        await this.client.database_manager.updateGame(game_name, {
          status: 'Approved',
        });
        embed.fields[2].value = `Approved by ${moderator}`;
        embed.setColor('GREEN');
        break;
      case 'deny':
        await this.client.database_manager.updateGame(game_name, {
          status: 'Denied',
        });
        embed.fields[2].value = `Denied by ${moderator}`;
        embed.setColor('FUCHSIA');
        break;
    }

    await message.edit({
      embeds: [embed.setFooter(new Date().toString())],
      components: [],
    });
  }
}
