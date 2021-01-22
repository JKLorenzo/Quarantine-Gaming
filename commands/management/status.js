const { Command } = require('discord.js-commando');
const functions = require('../../modules/functions.js');
let app = require('../../modules/app.js');

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
        // Link 
        const Modules = functions.parseModules(GlobalModules);
        app = Modules.app;

        const reply = await message.reply('Updating status...');
        const activity = await app.setActivity(value, String(type).toUpperCase());

        if (activity) {
            reply.edit(`Status updated!`).catch(() => { });
        } else {
            reply.edit(`Failed to update status.`).catch(() => { });
        }
    }
};