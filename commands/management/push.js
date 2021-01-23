const { Command } = require('discord.js-commando');
const functions = require('../../modules/functions.js');
let general = require('../../modules/general.js')

module.exports = class PushCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'push',
            group: 'management',
            memberName: 'push',
            description: '[Admin Only] Manually push a free game update url.',
            userPermissions: ["ADMINISTRATOR"],
            args: [
                {
                    key: 'url',
                    prompt: 'Enter the url to the giveaway or the permalink of the source.',
                    type: 'string',
                }
            ]
        });
    }

    async run(message, { url }) {
        // Link
        const Modules = functions.parseModules(GlobalModules);
        general = Modules.general;

        const reply = await message.reply('Checking...');
        reply.edit(await general.freeGameFetch(url));
    }
};