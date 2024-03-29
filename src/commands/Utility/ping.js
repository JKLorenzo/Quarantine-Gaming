import { SlashCommand } from '../../structures/Base.js';

/**
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 */

export default class Ping extends SlashCommand {
  constructor() {
    super({
      name: 'ping',
      description: 'Check the ping of this bot from the discord server.',
    });
  }

  /**
   * Execute this command.
   * @param {CommandInteraction} interaction The interaction that triggered this command
   */
  async exec(interaction) {
    await interaction.reply({
      content: `My current ping to the discord server is ${Math.round(
        interaction.client.ws.ping,
      )}ms.`,
      ephemeral: true,
    });
  }
}
