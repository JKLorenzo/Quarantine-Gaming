const { Command } = require('discord.js-commando');
const axios = require('axios');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

module.exports = class SteamSale extends Command {
    constructor(client) {
        super(client, {
            name: 'steamsale',
            group: 'experience',
            memberName: 'steamsale',
            description: "Gets the next Steam Sale schedule."
        });
    }

    async run(message) {
        await message.say(`Getting information...`).then(async this_message => {
            let response;
            await axios.get('https://www.whenisthenextsteamsale.com/').then(resp => {
                const { document } = (new JSDOM(resp.data)).window;
                const data = JSON.parse(document.getElementById("hdnNextSale").getAttribute("value"));
                const info = {
                    Name: data.Name,
                    Length: data.Length,
                    RemainingTime: {
                        days: data.RemainingTime.split('.')[0],
                        hours: data.RemainingTime.split('.')[1].split(':')[0],
                        minutes: data.RemainingTime.split('.')[1].split(':')[1],
                        seconds: data.RemainingTime.split('.')[1].split(':')[2]
                    },
                    confirmed: data.IsConfirmed
                }
                response = info;
            }).catch(() => { });

            if (response) {
                await this_message.edit(`Steam ${response.Name} will start on ${response.RemainingTime.days} days ${response.RemainingTime.hours} hours ${response.RemainingTime.minutes} minutes ${response.RemainingTime.seconds} seconds and it will be available for ${response.Length} days! ${response.confirmed ? '' : '*Unconfirmed'}`).catch(error => {
                    g_interface.on_error({
                        name: 'run => .edit(else)',
                        location: 'steamsale.js',
                        error: error
                    });
                });
            } else {
                await this_message.edit(`No information is available right now.`).catch(error => {
                    g_interface.on_error({
                        name: 'run => .edit(else)',
                        location: 'steamsale.js',
                        error: error
                    });
                });
            }
        }).catch(error => {
            g_interface.on_error({
                name: 'run => .say(message)',
                location: 'steamsale.js',
                error: error
            });
        });
    }
};