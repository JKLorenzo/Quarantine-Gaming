const { Command } = require('discord.js-commando');

module.exports = class Status extends Command {
    constructor(client) {
        super(client, {
            name: 'status',
            group: 'management',
            memberName: 'status',
            description: "[Admin Only] Updates the status of this bot.",
            userPermissions: ["ADMINISTRATOR"],
            args: [
                {
                    key: 'type',
                    prompt: 'Enter the type of this status update. [PLAYING, LISTENING]',
                    type: 'string',
                    oneOf: ['playing', 'listening']
                },
                {
                    key: 'value',
                    prompt: `The value of this status.`,
                    type: 'string',
                    validate: value => value.length > 0
                },
            ]
        });
    }

    async run(message, { type, value }) {
        let reply = await message.reply('Updating status...').catch(() => { });
        await g_functions.sleep(2500);
        let activity = await g_functions.setActivity(value, type.toUpperCase()).catch(error => {
            g_interface.on_error({
                name: `run -> .setActivity() [${type}, ${value}]`,
                location: 'status.js',
                error: error
            });
        });

        if (activity) {
            reply.edit(`Status updated!`).catch(() => { });
        } else {
            reply.edit(`Failed to update status.`).catch(() => { });
        }
    }
};