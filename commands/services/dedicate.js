const { Command } = require('discord.js-commando');

module.exports = class DedicateCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'dedicate',
            group: 'services',
            memberName: 'dedicate',
            description: 'Manually create a dedicated voice and text channel.',
            guildOnly: true,
            args: [
                {
                    key: 'name',
                    prompt: 'Enter the name of the channel.',
                    type: 'string',
                    validate: name => name.length > 0
                }
            ]
        });
    }

    run(message, { name }) {
        message.delete({ timeout: 5000 }).catch(error => { });
        g_channels.dedicate(message.member, name);
        return;
    }
};