const { Command } = require('discord.js-commando');
const fetch = require('node-fetch');

module.exports = class PushCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'push',
            group: 'management',
            memberName: 'push',
            description: '[Admin Only] Manually push a free game update link.',
            userPermissions: ["ADMINISTRATOR"],
            args: [
                {
                    key: 'link',
                    prompt: 'Enter the link to the giveaway or the permalink of the source.',
                    type: 'string',
                }
            ]
        });
    }

    async run(message, { link }) {
        try {
            message.reply('Checking...').then(this_message => {
                this_message.edit(await g_fgu.get(link));
            });
        } catch (error) {
            g_interface.on_error({
                name: 'run',
                location: 'push.js',
                error: error
            });
        }
    }
};