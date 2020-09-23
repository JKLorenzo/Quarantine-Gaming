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
                        if (this_role) {
                            return this_role.hexColor == '#00ffff'
                        } else {
                            return false;
                        }

                    }
                },
                {
                    key: 'count',
                    prompt: "[Optional] Enter the number of players you're looking for, including yourself. (Range: 2 - 25; Default: 0)",
                    type: 'integer',
                    default: 0,
                    validate: count => (count > 1 && count < 26) || count == 0
                }
            ]
        });
    }

    async run(message, { role, count }) {
        message.delete({ timeout: 300000, reason: 'Timed Out' }).catch(console.error);
        let role_id = `${role}`.substring(3, `${role}`.length - 1);
        let this_role = g_interface.get('guild').roles.cache.find(role => role.id == role_id);
        let this_member = g_interface.get('guild').member(message.author);
        let embed = new MessageEmbed();
        embed.setAuthor('Quarantine Gaming: Game Coordinator');
        embed.setTitle(this_role.name);
        embed.addField(`Player 1:`, this_member.toString());
        if (count == 0) {
            embed.setDescription(`${this_member.displayName} wants to play ${this_role}.`);
        } else {
            embed.setDescription(`${this_member.displayName} is looking for **${count - 1}** other ${this_role} player${count == 2 ? '' : 's'}.`);
            for (let i = 2; i <= count; i++) {
                embed.addField(`Player ${i}:`, '\u200B');
            }
        }
        embed.setFooter(`Join this bracket by reacting below.`);
        embed.setColor('#7b00ff');

        let emoji = g_interface.get('guild').emojis.cache.find(emoji => emoji.name == this_role.name.split(' ').join('').split(':').join('').split('-').join(''));
        let qg_emoji = g_interface.get('guild').emojis.cache.find(emoji => emoji.name == 'quarantinegaming');
        if (emoji) {
            embed.setThumbnail(emoji.url);
        } else {
            embed.setThumbnail(qg_emoji.url);
        }
        await message.say(embed).then(async message => {
            message.delete({ timeout: 300000, reason: 'Timed Out' }).catch(console.error);
            if (emoji) {
                await message.react(emoji).catch(error => {
                    g_interface.on_error({
                        name: 'run -> .react(custom)',
                        location: 'play.js',
                        error: error
                    });
                });
            } else {
                await message.react(qg_emoji).catch(error => {
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