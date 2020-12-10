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
        // Check if anyone is playing this game name
        let reply = await message.reply('Checking for players...').catch(() => { });;
        let has_players = false
        // Check roles
        for (let this_role of g_channels.get().guild.roles.cache.array()) {
            if (this_role.name == name.trim()) {
                has_players = true;
            }
        }
        if (has_players) {
            // Check presence
            for (let this_member of g_channels.get().guild.members.cache.array()) {
                if (this_member.presence.activities.map(activity => activity.name.trim().toLowerCase()).includes(name.trim().toLowerCase())) {
                    has_players = true;
                }
            }
        }

        await g_functions.sleep(2500);

        if (has_players) {
            reply.edit('Updating databases...').catch(() => { });;
            if ((mode == 'whitelist' && await g_db.pushWhitelisted(name.trim())) || (mode == 'blacklist' && await g_db.pushBlacklisted(name.trim()))) {
                await g_functions.sleep(2500);
                reply.edit('Applying changes...').catch(() => { });;
                updated = await g_dynamic_roles.init();
            }

            await g_functions.sleep(2500);

            if (updated) {
                reply.edit(`Updated! ${name} is now ${mode}ed.`).catch(() => { });;
            } else {
                reply.edit(`No changes made. Failed to ${mode} ${name} while updating.`).catch(() => { });;
            }
        } else {
            reply.edit(`No changes made. Failed to ${mode} ${name}. No active players found.`).catch(() => { });;
        }
    }
};