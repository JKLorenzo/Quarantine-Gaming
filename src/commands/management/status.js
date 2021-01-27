const Discord = require('discord.js');
const { Command } = require('discord.js-commando');
const functions = require('../../modules/functions.js');
/** @type {import('../../modules/app.js')} */
let app;

module.exports = class Status extends Command {
    constructor(client) {
        super(client, {
            name: 'status',
            group: 'management',
            memberName: 'status',
            description: "[Staff] Updates the status of this bot.",
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

    /**
     * 
     * @param {Discord.Message} message 
     * @param {{type: String, value: String}}
     */
    async run(message, { type, value }) {
        // Link 
        const Modules = functions.parseModules(GlobalModules);
        app = Modules.app;

        // Check user permissions
        if (!app.hasRole(message.author, [constants.roles.staff])) {
            return message.reply("You don't have permissions to use this command.");
        }

        const reply = await message.reply('Updating status...');
        const activity = await app.setActivity(value, type.toUpperCase());
        if (activity) {
            reply.edit(`Status updated!`).catch(() => { });
        } else {
            reply.edit(`Failed to update status.`).catch(() => { });
        }
    }
};