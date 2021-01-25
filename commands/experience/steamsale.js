const Discord = require('discord.js');
const { Command } = require('discord.js-commando');
const { JSDOM } = require("jsdom");
const axios = require('axios');

module.exports = class SteamSale extends Command {
    constructor(client) {
        super(client, {
            name: 'steamsale',
            group: 'experience',
            memberName: 'steamsale',
            description: "Gets the next Steam Sale schedule.",
            guildOnly: true
        });
    }

    /** @type {Discord.Message} */
    async run(message) {
        const this_message = await message.say(`Getting information...`);
        const response = await axios.get('https://www.whenisthenextsteamsale.com/').then(resp => {
            const { document } = (new JSDOM(resp.data)).window;
            const data = JSON.parse(document.getElementById("hdnNextSale").getAttribute("value"));
            return {
                Name: data.Name,
                Length: data.Length,
                RemainingTime: {
                    days: data.RemainingTime.split('.')[0],
                    hours: data.RemainingTime.split('.')[1].split(':')[0],
                    minutes: data.RemainingTime.split('.')[1].split(':')[1],
                    seconds: data.RemainingTime.split('.')[1].split(':')[2]
                },
                confirmed: data.IsConfirmed
            };
        }).catch(() => { });

        if (response) {
            await this_message.edit(`${message.author}, Steam ${response.Name} will start in ~${response.RemainingTime.days > 0 ? `${response.RemainingTime.days} day${response.RemainingTime.days > 1 ? 's' : ''}` : 'a few hours'} and it will be available for ~${response.Length} days!`);
        } else {
            await this_message.edit(`${message.author}, There's a Steam sale happening now or within a few hours from now!`);
        }
    }
};