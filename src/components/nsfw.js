import { MessageActionRow, MessageButton } from 'discord.js';
import { MessageComponent } from '../structures/Base.js';
import { constants } from '../utils/Base.js';

/**
 * @typedef {import('discord.js').MessageComponentInteraction} MessageComponentInteraction
 */

export default class NotSafeForWork extends MessageComponent {
  constructor() {
    super({
      name: 'nsfw',
      options: [
        new MessageActionRow({
          components: [
            new MessageButton({
              customID: 'button',
              label: 'Enable or Disable NSFW Content',
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
      emojis.find(e => e.name === 'pepe_peek'),
    );

    return this;
  }

  /**
   * Executes this component
   * @param {MessageComponentInteraction} interaction The interaction that triggered this component
   */
  async exec(interaction) {
    await interaction.defer({ ephemeral: true });
    const member = this.client.member(interaction.member);

    if (member.roles.cache.has(constants.qg.roles.nsfw)) {
      await this.client.role_manager.remove(member, constants.qg.roles.nsfw);
      await interaction.editReply(
        `${
          interaction.member
        }, you will now be able to interact with the ${this.client.channel(
          constants.qg.channels.text.explicit,
        )} channel.`,
      );
    } else {
      await this.client.role_manager.add(member, constants.qg.roles.nsfw);
      await interaction.editReply(
        `${
          interaction.member
        }, you will no longer be able to interact with the ${this.client.channel(
          constants.qg.channels.text.explicit,
        )} channel.`,
      );
    }
  }
}
