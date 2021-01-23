const { Command } = require('discord.js-commando');
const constants = require('../../modules/constants.js');
const functions = require('../../modules/functions.js');
/** @type {import('../../modules/general.js')} */
let general;

module.exports = class PushCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'push',
            group: 'management',
            memberName: 'push',
            description: '[Mod] Manually push a free game update url.',
            userPermissions: [constants.permissions.general.MANAGE_CHANNELS],
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