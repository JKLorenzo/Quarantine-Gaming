const { MessageEmbed } = require('discord.js');
const app = require('./app.js');
const constants = require('./constants.js');
const functions = require('./functions.js');
const error_manager = require('./error_manager.js');
const message = require('./message.js');
const reaction = require('./reaction.js');

const error_ticket = error_manager.for('general.js');

module.exports = {
    checkUnlisted: function () {
        try {
            for (let this_member of app.guild.members.cache.array()) {
                // Check if any member doesnt have member role
                if (!this_member.user.bot && !this_member.roles.cache.has(constants.roles.member)) {
                    const created_from = functions.compareDate(this_member.user.createdAt);
                    const embed = new MessageEmbed();
                    embed.setAuthor('Quarantine Gaming: Unlisted Member');
                    embed.setTitle('Member Details');
                    embed.setThumbnail(this_member.user.displayAvatarURL());
                    embed.addFields([
                        { name: 'User:', value: this_member },
                        { name: 'ID:', value: this_member.id },
                        { name: 'Account Created:', value: created_from.days + " days " + created_from.hours + " hours " + created_from.minutes + " minutes" }
                    ]);
                    embed.setColor('#ff5f5f');

                    await message.sendToChannel(constants.channels.server.management, {
                        content: `This user doesn't have a member role. Manual action is required.`,
                        embed: embed
                    });
                }
            }
        } catch (error) {
            error_manager.mark(new error_ticket('checkUnlisted', error));
        }
    },
    gameInvite: async function (role, member, count, reserved) {
        try {
            const mention_role = app.guild.roles.cache.find(this_role => this_role.hexColor == '#00ffff' && role.name.startsWith(this_role.name));
            if (mention_role) {
                const embed = new MessageEmbed()
                    .setAuthor('Quarantine Gaming: Game Coordinator')
                    .setTitle(mention_role.name)
                    .addField(`Player 1:`, member);
                let reserved_count = 2;
                let members = new Array();
                if (reserved) {
                    for (let user of reserved.split(' ')) {
                        const this_member = app.member(user.trim());
                        if (this_member && !members.includes(this_member)) {
                            members.push(this_member);
                        }
                    }
                    for (let this_member of members) {
                        if (this_member.user.id != member.user.id) {
                            embed.addField(`Player ${reserved_count++}:`, this_member);
                        }
                    }
                }
                if (count == 0) {
                    embed.setDescription(`${member.displayName} wants to play ${mention_role}.`);
                } else {
                    embed.setDescription(`${member.displayName} is looking for **${count - 1}** other ${mention_role} player${count == 2 ? '' : 's'}.`);
                    for (let i = reserved_count; i <= count; i++) {
                        embed.addField(`Player ${i}:`, '\u200B');
                    }
                }

                const is_full = count != 0 && members.length + 1 >= count;
                if (is_full) {
                    embed.setFooter('Closed. This bracket is now full.');
                } else {
                    embed.setFooter(`Join this bracket by reacting below.`);
                }
                embed.setColor('#7b00ff');

                const emoji = app.guild.emojis.cache.find(emoji => emoji.name == functions.toAlphanumericString(mention_role.name));
                const qg_emoji = app.guild.emojis.cache.find(emoji => emoji.name == 'quarantinegaming');
                if (emoji) {
                    embed.setThumbnail(emoji.url);
                } else {
                    embed.setThumbnail(qg_emoji.url);
                }

                const this_message = await message.sendToChannel(constants.channels.integrations.game_invites, { content: `${member.displayName} is inviting you to play ${mention_role.name}! (${mention_role})`, embed: embed })
                this_message.delete({ timeout: 3600000 }).catch(() => { });
                if (!is_full) {
                    await reaction.addReaction(this_message, emoji ? emoji : qg_emoji).catch(error => error_manager.mark(new error_ticket('addReaction', error, 'gameInvite')));
                }
            }
        } catch (error) {
            error_manager.mark(new error_ticket('gameInvite', error));
        }
    }
}