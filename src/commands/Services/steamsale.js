import axios from 'axios';
import { JSDOM } from 'jsdom';
import { SlashCommand } from '../../structures/Base.js';

/**
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 */

export default class SteamSale extends SlashCommand {
  constructor() {
    super({
      name: 'steamsale',
      description: 'Gets the next major steam sale date.',
    });
  }

  /**
   * Execute this command.
   * @param {CommandInteraction} interaction The interaction that triggered this command
   */
  async exec(interaction) {
    await interaction.defer({ ephemeral: true });

    const response = await axios
      .get('https://www.whenisthenextsteamsale.com/')
      .then(resp => {
        const { document } = new JSDOM(resp.data).window;
        const data = JSON.parse(
          document.getElementById('hdnNextSale').getAttribute('value'),
        );
        return {
          Name: data.Name,
          Length: data.Length,
          RemainingTime: {
            days: data.RemainingTime.split('.')[0],
            hours: data.RemainingTime.split('.')[1].split(':')[0],
            minutes: data.RemainingTime.split('.')[1].split(':')[1],
            seconds: data.RemainingTime.split('.')[1].split(':')[2],
          },
          confirmed: data.IsConfirmed,
        };
      })
      // eslint-disable-next-line no-empty-function
      .catch(() => {});

    if (response) {
      await interaction.editReply(
        `Steam ${response.Name} will start in ~${
          response.RemainingTime.days > 0
            ? `${response.RemainingTime.days} day${
                response.RemainingTime.days > 1 ? 's' : ''
              }`
            : 'a few hours'
        } and it will be available for ~${response.Length} days!`,
      );
    } else {
      await interaction.editReply(
        "There's a Steam sale happening now or within a few hours from now!",
      );
    }
  }
}
