import { MessageEmbed } from 'discord.js';
import { SlashCommand } from '../../structures/Base.js';
import { constants } from '../../utils/Base.js';

/**
 * @typedef {import('discord.js').TextChannel} TextChannel
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 */

export default class Purge extends SlashCommand {
  constructor() {
    super({
      name: 'purge',
      description:
        '[Staff/Mod] Removes a number of messages on the current channel.',
      options: [
        {
          name: 'message_count',
          description: 'The number of messages to delete.',
          type: 'INTEGER',
          required: true,
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
   * @property {number} message_count
   */

  /**
   * Execute this command.
   * @param {CommandInteraction} interaction The interaction that triggered this command
   * @param {Options} options The options used by this command
   */
  async exec(interaction, options) {
    await interaction.defer({ ephemeral: true });

    let retries = 3;
    let deleted_messages_count = 0;
    const deleted_messages = [];
    /** @type {TextChannel} */
    const channel = interaction.channel;

    do {
      const messages_to_delete = [];
      const authors_id = [];
      await channel.messages.fetch().then(messages => {
        for (const this_message of messages.array()) {
          if (this_message.deletable) {
            messages_to_delete.push(this_message);
            authors_id[this_message.id] = [
              this_message?.author ?? 'Unavailable',
            ];
          }
          if (messages_to_delete.length >= options.message_count) break;
        }
      });
      await channel.bulkDelete(messages_to_delete, true).then(messages => {
        for (const this_message of messages.array()) {
          deleted_messages_count++;
          if (deleted_messages[authors_id[this_message.id]]) {
            deleted_messages[authors_id[this_message.id]] += 1;
          } else {
            deleted_messages[authors_id[this_message.id]] = 1;
          }
        }
      });
      retries--;
    } while (retries > 0 && deleted_messages_count < options.message_count);
    const elapsedTime = (Date.now() - interaction.createdTimestamp) / 1000;

    const embed = new MessageEmbed({
      author: { name: 'Quarantine Gaming: Message Cleanup' },
      title: 'Channel Purge Complete',
      description: `A total of ${deleted_messages_count} messages were removed.`,
      fields: [
        {
          name: 'Affected Authors:',
          value: Object.entries(deleted_messages)
            .map(entry => `${entry[0]}: ${entry[1]}`)
            .join('\n'),
        },
      ],
      footer: {
        text: `This process took ${elapsedTime.toFixed(2)} seconds to finish.`,
      },
      timestamp: new Date(),
      color: '#FFFF00',
    });

    await interaction.editReply({ embeds: [embed] });
  }
}
