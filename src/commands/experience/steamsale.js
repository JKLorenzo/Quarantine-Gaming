// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');
const Commando = require('discord.js-commando');
const { JSDOM } = require('jsdom');
const axios = require('axios');

module.exports = class SteamSale extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'steamsale',
			group: 'experience',
			memberName: 'steamsale',
			description: 'Gets the next Steam Sale schedule.',
			guildOnly: true,
		});
	}

	/** @type {Commando.CommandoMessage} */
	async run(message) {
		message.delete({ timeout: 10000 }).catch(e => void e);
		const reply = await message.say('Getting information...');
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

		if (response) {
			reply.edit(`${message.author}, Steam ${response.Name} will start in ~${response.RemainingTime.days > 0 ? `${response.RemainingTime.days} day${response.RemainingTime.days > 1 ? 's' : ''}` : 'a few hours'} and it will be available for ~${response.Length} days!`);
		}
		else {
			reply.edit(`${message.author}, There's a Steam sale happening now or within a few hours from now!`).then(this_message => {
				this_message.delete({ timeout: 10000 }).catch(e => void e);
			}).catch(e => void e);
		}
	}
};