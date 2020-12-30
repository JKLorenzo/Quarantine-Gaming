const { MessageEmbed } = require('discord.js');
const app = require('./app.js');
const constants = require('./constants.js');
const functions = require('./functions.js');
const error_manager = require('./error_manager.js');
const message = require('./message.js');
const reaction = require('./reaction.js');
const role = require('./role.js');
const database = require('./database.js');

const error_ticket = error_manager.for('general.js');

const OfflineManager = functions.createManager(1000);
const ActivityManager = functions.createManager(5000);

module.exports = {
    checkUnlisted: async function () {
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
    memberOffline: async function (member) {
        await OfflineManager.queue();
        try {
            // Remove Dedicated Channel Role
            if (member.roles.cache.has(constants.roles.dedicated)) {
                await role.remove(member, constants.roles.dedicated);
            }

            // Remove all Dedicated Channel's Text Channel Roles
            let text_channel_role = null;
            do {
                text_channel_role = member.roles.cache.find(role => role.name.startsWith('Text'));
                if (text_channel_role) await role.remove(member, text_channel_role);
            } while (text_channel_role);

            // Remove all Team Roles
            let team_role = null;
            do {
                team_role = member.roles.cache.find(role => role.name.startsWith('Team'));
                if (team_role) await role.remove(member, team_role);
            } while (team_role);
        } catch (error) {
            error_manager.mark(new error_ticket('memberOffline', error));
        }
        OfflineManager.finish();
    },
    memberActivityUpdate: async function (member, data) {
        await ActivityManager.queue();
        try {
            const activity = data.activity;
            const activity_name = activity.name.trim();
            if (activity.type == 'PLAYING' && !database.gameTitles().blacklisted.includes(activity_name.toLowerCase()) && (activity.applicationID || database.gameTitles().whitelisted.includes(activity_name.toLowerCase()))) {
                const streaming_role = app.role(constants.roles.streaming);
                const game_role = app.guild.roles.cache.find(role => role.name == activity_name) || await role.create({ name: activity_name, color: '0x00ffff' });
                let play_role = app.guild.roles.cache.find(role => role.name == 'Play ' + activity_name);

                if (!app.guild.roles.cache.find(role => role.name == activity_name + ' ⭐')) await role.create({ name: activity_name + ' ⭐', color: '0x00fffe' });

                if (data.new) {
                    if (play_role) {
                        // Bring Play Role to Top
                        await play_role.setPosition(streaming_role.position - 1);
                    } else {
                        // Create Play Role
                        play_role = await role.create({ name: 'Play ' + activity_name, color: '0x7b00ff', position: streaming_role.position, hoist: true });
                    }
                    await role.add(member, game_role);
                    await role.add(member, play_role);
                } else if (play_role) {
                    // Remove Play Role from this member
                    if (member.roles.cache.has(play_role.id)) {
                        await role.remove(member, play_role);
                    }
                    // Check if Play Role is still in use
                    let role_in_use = false;
                    for (const this_member of app.guild.members.cache.array()) {
                        if (this_member.roles.cache.find(role => role == play_role)) {
                            // Check if this member is still playing
                            if (this_member.presence.activities.map(activity => activity.name.trim()).includes(play_role.name.substring(5))) {
                                role_in_use = true;
                            }
                        }
                    }
                    // Delete inactive Play Roles
                    if (!role_in_use) {
                        // Delete Play Role
                        await role.delete(play_role);
                    }
                }
            }
        } catch (error) {
            error_manager.mark(new error_ticket('memberActivityUpdate', error));
        }
        ActivityManager.finish();
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