import { MessageEmbed } from 'discord.js';
import fetch from 'node-fetch';
import { Color, FreeGame } from '../types/Base.js';
import {
  ErrorTicketManager,
  parseHTML,
  compareDate,
  contains,
  constants,
} from '../utils/Base.js';

/**
 * @typedef {import('../structures/Base').Client} Client
 */

const ETM = new ErrorTicketManager('Free Game Manager');

export default class FreeGameManager {
  /**
   * @param {Client} client The QG Client
   */
  constructor(client) {
    this.client = client;

    this.data = {
      fetchInterval: 600000,
      /** @type {FreeGame[]} */
      responses: [],
    };
  }

  init() {
    this.fetch();
    setInterval(() => {
      this.fetch();
    }, 600000);
  }

  /**
   * Fetches all the available free games on reddit.
   * @param {string} [url] The url of the free game
   */
  async fetch(url = '') {
    try {
      const response = await fetch(
        'https://www.reddit.com/r/FreeGameFindings/new/.json?limit=25&sort=new',
      )
        .then(data => data.json())
        .then(entry => entry.data.children.map(child => child.data));
      if (!response) return 'No response received.';
      const responses = [];
      for (const data of response) {
        const free_game = new FreeGame({
          title: parseHTML(data.title),
          url: data.url,
          author: data.author,
          description: parseHTML(data.selftext),
          created: new Date(data.created_utc * 1000),
          flair: data.link_flair_text,
          score: data.score,
          validity: data.upvote_ratio * 100,
          permalink: `https://www.reddit.com${data.permalink}`,
        });
        responses.push(free_game);

        const this_free_game =
          this.client.database_manager.getFreeGame(free_game);
        if (url) {
          const safe_url = url.trim().toLowerCase();
          if (
            safe_url === free_game.url.trim().toLowerCase() ||
            safe_url === free_game.permalink.trim().toLowerCase()
          ) {
            if (!this_free_game) {
              const result = await this.post(free_game);
              return result;
            }
            return 'This entry is already posted on the free games channel.';
          }
        } else {
          const elapsedMinutes = compareDate(free_game.created).totalMinutes;
          if (
            !this_free_game &&
            free_game.score >= 100 &&
            free_game.validity >= 75 &&
            elapsedMinutes >= 30 &&
            elapsedMinutes <= 300
          ) {
            this.post(free_game);
          }
        }
      }
      this.data.responses = responses;
      if (url) return 'Uh-oh! The link you provided is no longer valid.';
    } catch (error) {
      this.client.error_manager.mark(ETM.create('fetch', error));
      return 'An error has occured while performing fetch.';
    }
  }

  /**
   * Sends this free game to the free games channel.
   * @param {FreeGame} free_game The free game to post
   */
  async post(free_game) {
    try {
      const {
        author,
        title,
        description,
        flair,
        permalink,
        url,
        score,
        validity,
      } = free_game;

      const embed = new MessageEmbed({
        author: { name: 'Quarantine Gaming: Free Game/DLC Notification' },
        url: url,
        description: parseHTML(description),
        fields: [{ name: 'Author', value: author, inline: true }],
        footer: {
          iconURL: this.client.emojis.cache.find(e => e.name === 'reddit'),
          text: `Stats: ${score} upvotes with ${validity}% upvote ratio.`,
        },
      });

      const words = title.split(' ');
      const filters = ['other', 'alpha', 'beta', 'psa'];
      /** @type {String[]} */
      const filtered_title = [];
      let filter_instance = 0;
      for (const word of words) {
        if (contains(word, filters)) {
          return 'Uh-oh! This free game is marked as filtered.';
        }
        if (word.startsWith('[') || word.startsWith('(')) {
          filter_instance++;
        }
        if (filter_instance > 0) {
          filtered_title.push(word);
        }
        if (filter_instance > 0 && (word.endsWith(']') || word.endsWith(')'))) {
          filter_instance--;
        }
      }
      const safe_title = words
        .filter(word => !contains(word, filtered_title))
        .join(' ');
      embed.setTitle(`**${safe_title ?? title}**`);

      if (flair) {
        if (
          flair.toLowerCase().indexOf('comment') !== -1 ||
          flair.toLowerCase().indexOf('issue') !== -1
        ) {
          embed.addField('Flair', `[${flair}](${permalink})`, true);
        } else {
          embed.addField('Flair', String(flair), true);
        }
      }

      const color = new Color();
      /** @type {String[]} */
      const mentionables = [];
      const searchables = `${url.toLowerCase()} ${
        description?.toLowerCase() ?? '*'
      }`;

      if (contains(searchables, 'steampowered.com')) {
        mentionables.push(constants.qg.roles.steam);
        color.add({ red: 0, green: 157, blue: 255 });
      }
      if (contains(searchables, 'epicgames.com')) {
        mentionables.push(constants.qg.roles.epic);
        color.add({ red: 157, green: 255, blue: 0 });
      }
      if (contains(searchables, 'gog.com')) {
        mentionables.push(constants.qg.roles.gog);
        color.add({ red: 157, green: 0, blue: 255 });
      }
      if (contains(searchables, 'ubisoft.com')) {
        mentionables.push(constants.qg.roles.ubisoft);
        color.add({ red: 200, green: 120, blue: 255 });
      }
      if (contains(searchables, ['microsoft.com', 'xbox.com'])) {
        mentionables.push(constants.qg.roles.xbox);
        color.add({ red: 77, green: 222, blue: 31 });
      }
      if (contains(searchables, 'playstation.com')) {
        mentionables.push(constants.qg.roles.playstation);
        color.add({ red: 178, green: 54, blue: 255 });
      }
      if (contains(searchables, 'wii.com')) {
        mentionables.push(constants.qg.roles.wii);
        color.add({ red: 43, green: 228, blue: 255 });
      }
      if (mentionables.length === 0) {
        return "Uh-oh! This free game doesn't belong to any supported platforms.";
      }
      embed.setColor(color.toHex());

      // Image
      const image = await this.client.methods.fetchImage(title);
      if (image) {
        if (image.small) embed.setThumbnail(image.small);
        if (image.large) embed.setImage(image.large);
      }
      if (!embed.image.url) embed.setImage(constants.images.free_games_banner);

      // Mentionable Roles
      const mentionable_roles = mentionables.map(mentionable =>
        this.client.role(mentionable),
      );
      embed.addField('Platforms', mentionable_roles.join(', ') ?? 'None', true);

      // Send
      const message = await this.client.message_manager.sendToChannel(
        constants.qg.channels.integrations.free_games,
        {
          content: `${embed.title} is now available on ${mentionable_roles.join(
            ' and ',
          )}.`,
          embed: embed,
        },
      );
      free_game.title = embed.title;
      free_game.id = message.id;
      await this.client.database_manager.pushFreeGame(free_game);
      return `Done! Reference ID: \`${message.id}\``;
    } catch (error) {
      this.client.error_manager.mark(ETM.create('post', error));
      return 'An error has occured while performing post.';
    }
  }
}
