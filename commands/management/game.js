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
                    prompt: `Enter the name of the game.`,
                    type: 'string',
                    validate: name => name.trim().length > 0
                }
            ]
        });
    }

    async run(message, { mode, name }) {
        let updated = false;
        switch (mode) {
            case 'whitelist':
                if (await g_db.pushWhitelisted(name.trim())) {
                    updated = await g_dynamic_roles.init();
                }
                break;
            case 'blacklist':
                if (await g_db.pushBlacklisted(name.trim())) {
                    updated = await g_dynamic_roles.init();
                };
                break;
        }
        if (updated){
            message.say('Updated!');
        } else {
            message.say('No changes made!');
        }
    }
};