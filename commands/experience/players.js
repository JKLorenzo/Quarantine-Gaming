const Discord = require('discord.js');
const { Command } = require('discord.js-commando');
const functions = require('../../modules/functions.js');
/** @type {import('../../modules/app.js')} */
let app;
/** @type {import('../../modules/message_manager.js')} */
let message_manager;

module.exports = class PlayersCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'players',
            group: 'experience',
            memberName: 'players',
            description: 'Show all players who played a specified game.',
            guildOnly: true,
            args: [
                {
                    key: 'role',
                    prompt: "Mention the play role you want to check.",
                    type: 'role',
                    validate: role => {
                        // Link
                        app = this.client.modules.app;

                        const game_role_mentionable = app.role(role);
                        if (game_role_mentionable) {
                            return game_role_mentionable.hexColor == '#00fffe' && functions.contains(game_role_mentionable.name, ' ⭐');
                        } else {
                            return false;
                        }
                    }
                }
            ]
        });
    }

    /**
     * @param {Discord.Message} message 
     * @param {{role: Discord.RoleResolvable}} 
     */
    run(message, { role }) {
        // Link
        app = this.client.modules.app;
        message_manager = this.client.modules.message_manager;

        const game_role_mentionable = app.role(role);
        const players = new Array();
        const alphabetical = new Array();
        const in_game = new Array();
        const online = new Array();
        const unavailable = new Array();

        if (game_role_mentionable) {
            const game_role = app.guild().roles.cache.find(role => game_role_mentionable.name.startsWith(role.name) && role.hexColor == '#00ffff');
            if (game_role) {
                for (const member of app.guild().members.cache.array()) {
                    if (member.roles.cache.has(game_role.id)) {
                        players.push(member);
                        alphabetical.push(member.displayName)
                    }
                }

                if (players.length > 0) {
                    // sort players 
                    alphabetical.sort();
                    for (const name of alphabetical) {
                        for (const player of players) {
                            const this_player = app.member(player);
                            if (this_player.displayName == name) {
                                if (this_player.roles.cache.find(role => role.name == `Play ${game_role.name}`)) {
                                    in_game.push(this_player);
                                } else if (this_player.presence.status == 'online') {
                                    online.push(this_player);
                                } else {
                                    unavailable.push(this_player);
                                }
                            }
                        }
                    }

                    const embed = new Discord.MessageEmbed();
                    embed.setAuthor('Quarantine Gaming: List of Players')
                    embed.setTitle(game_role.name)
                    embed.setDescription(`All members who have played this game before are as follows:`);
                    if (in_game.length > 0) {
                        embed.addField(`In Game: ${in_game.length}`, in_game.join(', '));
                    }
                    if (online.length > 0) {
                        embed.addField(`Online: ${online.length}`, online.join(', '));
                    }
                    if (unavailable.length > 0) {
                        embed.addField(`Away / Busy / Offline : ${unavailable.length}`, unavailable.join(', '));
                    }
                    embed.setFooter(`${players.length} players total.`)
                    embed.setColor('#25ff00');

                    const emoji = app.guild().emojis.cache.find(emoji => emoji.name == game_role.name.trim().split(' ').join('').split(':').join('').split('-').join(''));
                    const qg_emoji = app.guild().emojis.cache.find(emoji => emoji.name == 'quarantinegaming');
                    if (emoji) {
                        embed.setThumbnail(emoji.url);
                    } else {
                        embed.setThumbnail(qg_emoji.url);
                    }

                    message_manager.sendToChannel(message.channel, embed);
                }
            }
        } else {
            message.reply('No information is available right now. Please try again later.');
        }
    }
};