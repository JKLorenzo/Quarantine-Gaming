import { MessageEmbed } from 'discord.js';
import fetch from 'node-fetch';
import { Color, FreeGame } from '../types/Base.js';
import { ErrorTicketManager, fetchImage, parseHTML, compareDate, contains, constants } from '../utils/Base.js';

/**
 * @typedef {import('../structures/Base').Client} Client
 */

const ETM = new ErrorTicketManager('Free Game Manager');

export default class FreeGameManager {
	/** @param {Client} client */
	constructor(client) {
		this.client = client;

		this.data = {
			fetchInterval: 600000,
			/** @type {FreeGame[]} */
			responses: new Array(),
			intervalID: null,
		};

		this.actions = {
			start: () => {
				this.data.intervalID = setInterval(() => {
					this.fetch();
				}, this.data.fetchInterval);
			},
			stop: () => {
				if (this.data.intervalID) clearInterval(this.data.intervalID);
				this.data.intervalID = null;
			},
		};
	}

	/**
	 * Fetches all the available free games on reddit.
	 * @param {String} url
	 */
	async fetch(url = '') {
		try {
			const response = await fetch('https://www.reddit.com/r/FreeGameFindings/new/.json?limit=25&sort=new').then(data => data.json()).then(entry => entry.data.children.map(child => child.data));
			if (!response) return;
			const responses = new Array();
			for (const data of response) {
				const free_game = new FreeGame({
					title: parseHTML(data.title),
					url: data.url,
					author: data.author,
					description: parseHTML(data.selftext),
					flair: data.link_flair_text,
					score: data.score,
					validity: data.upvote_ratio * 100,
					permalink: `https://www.reddit.com${data.permalink}`,
				});
				responses.push(free_game);

				const this_free_game = this.client.database_manager.getFreeGame(free_game);
				if (url) {
					if (url.trim().toLowerCase() == free_game.url.trim().toLowerCase() || url.trim().toLowerCase() == free_game.permalink.trim().toLowerCase()) {
						if (!this_free_game) return await this.post(free_game);
						return 'This entry is already posted on the free games channel.';
					}
				} else {
					const elapsedMinutes = compareDate(new Date(free_game.createdAt * 1000)).totalMinutes;
					if (!this_free_game && free_game.score >= 100 && free_game.validity >= 75 && elapsedMinutes >= 30 && elapsedMinutes <= 300) {
						return await this.post(free_game);
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
	 * @param {FreeGame} free_game
	 */
	async post(free_game) {
		try {
			const { author, title, description, flair, permalink, url, validity } = free_game;

			const embed = new MessageEmbed({
				author: { name: 'Quarantine Gaming: Free Game/DLC Notification' },
				url: url,
				description: parseHTML(description),
				fields: [
					{ name: 'Author', value: author, inline: true },
				],
				footer: { text: `You will be redirected to \`${(new URL(url)).hostname}\`.` },
			});

			const words = title.split(' ');
			const filters = ['other', 'alpha', 'beta', 'psa'];
			/** @type {String[]} */
			const filtered_title = new Array();
			let filter_instance = 0;
			for (const word of words) {
				if (contains(word, filters)) return 'Uh-oh! This free game is marked as filtered.';
				if (word.startsWith('[') || word.startsWith('(')) filter_instance++;
				if (filter_instance > 0) filtered_title.push(word);
				if (filter_instance > 0 && (word.endsWith(']') || word.endsWith(')'))) filter_instance--;
			}
			const safe_title = words.filter(word => !contains(word, filtered_title)).join(' ');
			embed.setTitle(`**${safe_title ? safe_title : title}**`);

			if (flair) {
				if (flair.toLowerCase().indexOf('comment') !== -1 || flair.toLowerCase().indexOf('issue') !== -1) {
					embed.addField('Flair', `[${flair}](${permalink})`, true);
				} else {
					embed.addField('Flair', flair, true);
				}
			} else {
				embed.addField('Validity', validity, true);
			}

			const color = new Color();
			/** @type {String[]} */
			const mentionables = new Array();
			const searchables = url.toLowerCase() + ' ' + (description ? description.toLowerCase() : '*');

			if (contains(searchables, 'steampowered.com')) {
				mentionables.push(constants.roles.steam);
				color.add({ red: 0, green: 157, blue: 255 });
			}
			if (contains(searchables, 'epicgames.com')) {
				mentionables.push(constants.roles.epic);
				color.add({ red: 157, green: 255, blue: 0 });
			}
			if (contains(searchables, 'gog.com')) {
				mentionables.push(constants.roles.gog);
				color.add({ red: 157, green: 0, blue: 255 });
			}
			if (contains(searchables, 'ubisoft.com')) {
				mentionables.push(constants.roles.ubisoft);
				color.add({ red: 200, green: 120, blue: 255 });
			}
			if (contains(searchables, ['playstation.com', 'wii.com', 'xbox.com', 'microsoft.com'])) {
				mentionables.push(constants.roles.console);
				color.add({ red: 200, green: 80, blue: 200 });
			}
			if (mentionables.length == 0) return 'Uh-oh! This free game doesn\'t belong to any supported platforms.';
			embed.setColor(color.toHex());

			// Image
			const image = await fetchImage(title);
			if (image) {
				if (image.small) embed.setThumbnail(image.small);
				if (image.large) embed.setImage(image.large);
			}
			if (!embed.image.url) embed.setImage(constants.images.free_games_banner);

			// Mentionable Roles
			const mentionable_roles = mentionables.map(mentionable => this.client.role(mentionable));
			embed.addField('Platforms', mentionable_roles.join(', '), true);

			// Send
			const message = await this.client.message_manager.sendToChannel(constants.channels.integrations.free_games, { content: embed.title + ' is now available on ' + mentionable_roles.join(' and ') + '.', embed: embed });
			free_game.title = embed.title;
			free_game.id = message.id;
			await this.client.database_manager.pushFreeGame(free_game);
			return `Done! Reference ID: \`${message.id}\``;
		} catch(error) {
			this.client.error_manager.mark(ETM.create('fetch', error));
			return 'An error has occured while performing post.';
		}
	}
}