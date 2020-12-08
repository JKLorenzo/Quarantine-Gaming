const { Command } = require('discord.js-commando');

module.exports = class Game extends Command {
    constructor(client) {
        super(client, {
            name: 'game',
            group: 'management',
            memberName: 'game',
            description: '[Admin Only] Whitelist or blacklist a game.',
            userPermissions: ["ADMINISTRATOR"],
            args: [
                {
                    key: 'mode',
                    prompt: 'whitelist or blacklist?',
                    type: 'string',
                    oneOf: ['whitelist', 'blacklist']
                },
                {
                    key: 'name',
                    prompt: `Enter the name of the game. Case insensitive.`,
                    type: 'string',
                    validate: name => name.trim().length > 0
                }
            ]
        });
    }

    async run(message, { mode, name }) {
        let updated = false;
        let reply = await message.reply('Updating database...').catch(() => { });;
        switch (mode) {
            case 'whitelist':
                if (await g_db.pushWhitelisted(name.trim())) {
                    await g_functions.sleep(2500);
                    reply.edit('Applying changes...').catch(() => { });;
                    updated = await g_dynamic_roles.init();
                }
                break;
            case 'blacklist':
                if (await g_db.pushBlacklisted(name.trim())) {
                    await g_functions.sleep(2500);
                    reply.edit('Applying changes...').catch(() => { });;
                    updated = await g_dynamic_roles.init();
                };
                break;
        }

        await g_functions.sleep(2500);
        if (updated) {
            reply.edit(`Updated! ${name} is now ${mode}ed.`).catch(() => { });;
        } else {
            reply.edit(`No changes made. Failed to ${mode} ${name}.`).catch(() => { });;
        }
    }
};