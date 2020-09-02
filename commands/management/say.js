const { Command } = require('discord.js-commando');

module.exports = class Say extends Command {
    constructor(client) {
        super(client, {
            name: 'say',
            group: 'management',
            memberName: 'say',
            description: 'Sends a message to a channel.',
            userPermissions: ["ADMINISTRATOR"],
            guildOnly: true,
            args: [
                {
                    key: 'channel',
                    prompt: 'Mention the channel where you want to send the message.',
                    type: 'channel'
                },
                {
                    key: 'content',
                    prompt: 'Enter the message to send.',
                    type: 'string'
                }
            ]
        });
    }

    async run(message, { channel, content }) {
        message.delete();
        return g_interface.get('guild').channels.cache.get(channel.id).send(`${content}`);
    }
};