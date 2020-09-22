const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');

module.exports = class PlayCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'play',
            group: 'services',
            memberName: 'play',
            description: 'Invite members to play a game.',
            guildOnly: true,
            args: [
                {
                    key: 'role',
                    prompt: "Mention the play role you want to play.",
                    type: 'role',
                    validate: role => {
                        let role_id = `${role}`.substring(3, `${role}`.length - 1);
                        let this_role = g_interface.get('guild').roles.cache.find(role => role.id == role_id);
                        return this_role.hexColor == '#00ffff'
                    }
                },
                {
                    key: 'count',
                    prompt: "Enter the number of players you're looking for.",
                    type: 'integer',
                    default: 16856654,
                    validate: count => count > 0
                }
            ]
        });
    }

    async run(message, { role, count }) {
        let role_id = `${role}`.substring(3, `${role}`.length - 1);
        let this_role = g_interface.get('guild').roles.cache.find(role => role.id == role_id);
        let embed = new MessageEmbed();
        embed.setAuthor('Quarantine Gaming: Game Coordinator');
        embed.setTitle('Looking for Players');
        embed.addField(`Player 1:`, message.author)
        if (count > 0 && count != 16856654) {
            embed.setDescription(`${message.author} is looking for **${count - 1}** other ${this_role} players.`)
            for (let i = 2; i <= count; i++) {
                embed.addField(`Player ${i}:`, '\u200B');
            }
        } else {
            embed.setDescription(`${message.author} wants to play ${this_role}.`)
        }
        embed.setFooter('Secure your slot by reacting below.')
        embed.setColor('#7b00ff')

        let emoji = g_interface.get('guild').emojis.cache.find(emoji => emoji.name == this_role.name.split(' ').join('').split(':').join('').split('-').join(''));
        if (emoji) {
            embed.setThumbnail(emoji.url);
        }
        await message.say(embed).then(async message => {
            if (emoji) {
                await message.react(emoji).catch(error => {
                    g_interface.on_error({
                        name: 'run -> .react(custom)',
                        location: 'play.js',
                        error: error
                    });
                });
            } else {
                await message.react('Ⓜ').catch(error => {
                    g_interface.on_error({
                        name: 'run -> .react(default)',
                        location: 'play.js',
                        error: error
                    });
                });
            }
        }).catch(error => {
            g_interface.on_error({
                name: 'run -> .say()',
                location: 'play.js',
                error: error
            });
        });
    }
};