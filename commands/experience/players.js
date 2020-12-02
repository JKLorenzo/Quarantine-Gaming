const { Command } = require('discord.js-commando');
const { MessageEmbed, Message } = require('discord.js');

module.exports = class PlayersCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'players',
            group: 'experience',
            memberName: 'players',
            description: 'Show all players who played a specified game.',
            args: [
                {
                    key: 'role',
                    prompt: "Mention the play role you want to check.",
                    type: 'role',
                    validate: role => {
                        let role_id = `${role}`.substring(3, `${role}`.length - 1);
                        let this_role = g_channels.get().guild.roles.cache.find(role => role.id == role_id);
                        if (this_role) {
                            return this_role.hexColor == '#00fffe' && this_role.name.split(' ⭐').length == 2;
                        } else {
                            return false;
                        }
                    }
                }
            ]
        });
    }

    run(message, { role }) {
        const role_id = `${role}`.substring(3, `${role}`.length - 1);
        let this_role = g_channels.get().guild.roles.cache.find(role => role.id == role_id);
        let players = new Array();
        let alphabetical = new Array();
        let in_game = new Array();
        let online = new Array();
        let unavailable = new Array();

        if (this_role) {
            this_role = g_channels.get().guild.roles.cache.find(role => this_role.name.startsWith(role.name) && role.hexColor == '#00ffff');
            if (this_role) {
                for (let member of g_channels.get().guild.members.cache.array()) {
                    if (member.roles.cache.has(this_role.id)) {
                        players.push(member);
                        alphabetical.push(member.displayName)
                    }
                }

                if (players.length > 0) {
                    // sort players 
                    alphabetical.sort();
                    for (let name of alphabetical) {
                        for (let this_player of players) {
                            if (this_player.displayName == name) {
                                if (this_player.roles.cache.find(role => role.name == `Play ${this_role.name}`)) {
                                    in_game.push(this_player);
                                } else if (this_player.presence.status == 'online') {
                                    online.push(this_player);
                                } else {
                                    unavailable.push(this_player);
                                }
                            }
                        }
                    }

                    let embed = new MessageEmbed();
                    embed.setAuthor('Quarantine Gaming: List of Players')
                    embed.setTitle(this_role.name)
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
                    embed.setTimestamp();

                    let emoji = g_channels.get().guild.emojis.cache.find(emoji => emoji.name == this_role.name.trim().split(' ').join('').split(':').join('').split('-').join(''));
                    let qg_emoji = g_channels.get().guild.emojis.cache.find(emoji => emoji.name == 'quarantinegaming');
                    if (emoji) {
                        embed.setThumbnail(emoji.url);
                    } else {
                        embed.setThumbnail(qg_emoji.url);
                    }

                    return message.say(embed).catch(error => {
                        g_interface.on_error({
                            name: 'run -> .reply(embed)',
                            location: 'players.js',
                            error: error
                        });
                    });
                }
            }
        }

        return message.reply('No information is available right now. Please try again later.').catch(error => {
            g_interface.on_error({
                name: 'run -> .reply(message)',
                location: 'players.js',
                error: error
            });
        })
    }
};