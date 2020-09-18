const { Command } = require('discord.js-commando');

module.exports = class Send extends Command {
    constructor(client) {
        super(client, {
            name: 'send',
            group: 'management',
            memberName: 'send',
            description: '[Admin Only] Send a message to a channel as Quarantine Gaming.',
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