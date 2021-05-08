const { Command } = require('discord-akairo');
const { JSDOM } = require('jsdom');
const axios = require('axios');

/**
 * @typedef {import('../../../structures/Base.js').Client} Client
 * @typedef {import('../../../structures/Base.js').ExtendedMessage} ExtendedMessage
 */

module.exports = class SteamSale extends Command {
	constructor() {
		super('steamsale', {
			aliases: ['steamsale'],
			category: 'Services',
			description: 'Gets the next major steam sale date.',
		});
	}

	/** @param {ExtendedMessage} message */
	async exec(message) {
		const reply = await message.reply('Gathering information. Please wait.');

		const response = await axios.get('https://www.whenisthenextsteamsale.com/').then(resp => {
			const { document } = (new JSDOM(resp.data)).window;
			const data = JSON.parse(document.getElementById('hdnNextSale').getAttribute('value'));
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
		}).catch(e => void e);

		message.delete({ timeout: 30000 }).catch(e => void e);
		reply.delete({ timeout: 30000 }).catch(e => void e);

		if (!response) return reply.edit('There\'s a Steam sale happening now or within a few hours from now!');
		return reply.edit(`Steam ${response.Name} will start in ~${response.RemainingTime.days > 0 ? `${response.RemainingTime.days} day${response.RemainingTime.days > 1 ? 's' : ''}` : 'a few hours'} and it will be available for ~${response.Length} days!`);
	}
};