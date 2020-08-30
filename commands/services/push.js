const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');

module.exports = class PushCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'push',
            group: 'services',
            memberName: 'push',
            description: 'Accepts manual push commands of free game updates.',
            guildOnly: true,
            userPermissions: ["ADMINISTRATOR"],
            args: [
                {
                    key: 'title',
                    prompt: 'Enter the raw title of the giveaway.',
                    type: 'string',
                },
                {
                    key: 'link',
                    prompt: 'Enter the link to the giveaway.',
                    type: 'string',
                }
            ]
        });
    }

    run(message, {title, link}) {
        g_interface.push({
            title: title,
            url: link
        });
        return;
    }
};