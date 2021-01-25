const Discord = require('discord.js');
const { Command } = require('discord.js-commando');
const constants = require('../../modules/constants.js');
const functions = require('../../modules/functions.js');
/** @type {import('../../modules/app.js')} */
let app;
/** @type {import('../../modules/database.js')} */
let database;

module.exports = class Game extends Command {
    constructor(client) {
        super(client, {
            name: 'game',
            group: 'management',
            memberName: 'game',
            description: '[Mod] Whitelist or blacklist a game.',
            args: [
                {
                    key: 'mode',
                    prompt: 'whitelist or blacklist?',
                    type: 'string',
                    oneOf: ['whitelist', 'blacklist']
                },
                {
                    key: 'name',
                    prompt: `Enter the name of the game. (Case insensitive)`,
                    type: 'string',
                    validate: name => name.trim().length > 0
                }
            ]
        });
    }

    /**
     * @param {Discord.Message} message 
     * @param {{mode: String, name: String}} 
     */
    async run(message, { mode, name }) {
        // Link
        const Modules = functions.parseModules(GlobalModules);
        app = Modules.app;
        database = Modules.database;

        // Check user permissions
        if (!app.hasRole(message.author, [constants.roles.staff, constants.roles.moderator])) {
            return message.reply("You don't have permissions to use this command.");
        }

        // Check if anyone is playing this game name
        name = name.trim().toLowerCase();
        let updated = false;
        const reply = await message.reply('Checking for players...').catch(() => { });;
        let game_name = '';
        // Check Roles
        for (const this_role of app.guild().roles.cache.array()) {
            if (functions.contains(this_role.name.trim().toLowerCase(), name)) {
                game_name = this_role.name.trim();
            }
        }
        // Check Presence
        for (const this_member of app.guild().members.cache.array()) {
            for (const this_activity of this_member.presence.activities) {
                if (functions.compareString(this_activity.name.trim().toLowerCase(), name) >= 75) {
                    game_name = this_activity.name.trim();
                }
            }
        }

        await functions.sleep(2500);

        if (game_name) {
            await reply.edit(`Game title matched: ${game_name}. Updating databases...`).catch(() => { });;
            switch (mode) {
                case 'whitelist':
                    updated = await database.gameWhitelist(game_name);
                    break;
                case 'blacklist':
                    updated = await database.gameBlacklist(game_name);
                    break;
            }

            await functions.sleep(2500);

            if (updated) {
                await reply.edit(`Changes made! ${game_name} is now ${mode}ed.`).catch(() => { });;
            } else {
                await reply.edit(`No changes made. Failed to ${mode} ${game_name} while updating my database.`).catch(() => { });;
            }
        } else {
            await reply.edit(`No changes made. No match found for ${name}. `).catch(() => { });;
        }
    }
};