const { MessageEmbed } = require('discord.js');
const app = require('./app.js');
const constants = require('./constants.js');
const functions = require('./functions.js');
const error_manager = require('./error_manager.js');
const message = require('./message.js');
const reaction = require('./reaction.js');
const role = require('./role.js');
const channel = require('./channel.js');
const database = require('./database.js');
const speech = require('./speech.js');

const error_ticket = error_manager.for('general.js');

const OfflineManager = functions.createManager(1000);
const ActivityManager = functions.createManager(5000);
const VoiceManager = functions.createManager(1000);
const DedicateManager = functions.createManager(10000);

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
    memberVoiceUpdate: async function (member, oldState, newState) {
        await VoiceManager.queue();
        try {
            if (oldState.channel && oldState.channel.parent.id == constants.channels.category.dedicated) {
                const text_channel = app.channel(constants.channels.category.dedicated).children.find(channel => channel.type == 'text' && channel.topic && channel.topic.split(' ')[0] == oldState.channelID);
                const linked_data = text_channel.topic.split(' ');
                const text_role = app.role(linked_data[1]);
                const team_role = app.role(linked_data[2]);

                if (oldState.channel.members.size > 0 && !(oldState.channel.members.size == 1 && oldState.channel.members.first().user.bot)) {
                    await role.remove(member, text_role);
                    await role.remove(member, team_role);
                    const embed = new MessageEmbed();
                    embed.setAuthor('Quarantine Gaming: Dedicated Channels');
                    embed.setTitle(oldState.channel.name);
                    embed.setDescription(`${oldState.member} left this channel.`);
                    embed.setThumbnail(member.user.displayAvatarURL());
                    embed.setFooter(`${member.user.tag} (${member.user.id})`);
                    embed.setTimestamp();
                    embed.setColor('#7b00ff');
                    await message.sendToChannel(text_channel, embed);
                } else {
                    await channel.delete(oldState.channel);
                    await channel.delete(text_channel);
                    await role.delete(text_role);
                    await role.delete(team_role);
                }
            }

            if (newState.channel) {
                // Check if members are streaming
                const streamers = new Array();
                for (const this_member of newState.channel.members.array()) {
                    if (member.user.id != this_member.user.id && this_member.roles.cache.has(constants.roles.streaming)) {
                        streamers.push(this_member);
                    }
                }
                // Notify member
                if (streamers.length > 0) {
                    const embed = new MessageEmbed();
                    embed.setAuthor('Quarantine Gaming: Information');
                    embed.setTitle(`${streamers.length > 1 ? `${streamers.map(member => member.displayName).join(' and ')} are` : `${streamers.map(member => member.displayName)} is`} currently Streaming`);
                    embed.setDescription('Please observe proper behavior on your current voice channel.');
                    embed.setImage('https://pa1.narvii.com/6771/d33918fa87ad0d84b7dc854dcbf6a8545c73f94d_hq.gif');
                    embed.setColor('#5dff00');
                    await message.sendToUser(member, embed);
                }

                if (newState.channel.parent.id == constants.channels.category.dedicated) {
                    const text_channel = app.channel(constants.channels.category.dedicated).children.find(channel => channel.type == 'text' && channel.topic && channel.topic.split(' ')[0] == newState.channelID);
                    const linked_data = text_channel.topic.split(' ');
                    const text_role = app.role(linked_data[1]);
                    const team_role = app.role(linked_data[2]);

                    // Add Text Role
                    if (!member.roles.cache.has(text_role.id)) {
                        const embed = new MessageEmbed();
                        embed.setAuthor('Quarantine Gaming: Dedicated Channels');
                        embed.setTitle(newState.channel.name);
                        embed.setDescription(`${newState.member} joined this channel.`);
                        embed.setThumbnail(newState.member.user.displayAvatarURL());
                        embed.setFooter(`${newState.member.user.tag} (${newState.member.user.id})`);
                        embed.setTimestamp();
                        embed.setColor('#7b00ff');
                        await message.sendToChannel(text_channel, embed);
                        await role.add(member, text_role);
                    }

                    // Add Team Role
                    if (!member.roles.cache.has(team_role.id)) {
                        await role.add(member, team_role);
                    }

                    // Add Dedicated Role
                    if (!member.roles.cache.has(constants.roles.dedicated)) {
                        await role.add(member, constants.roles.dedicated);
                    }
                } else {
                    // Remove Text Role
                    if (member.roles.cache.has(constants.roles.dedicated)) {
                        await role.remove(member, constants.roles.dedicated);
                    }
                }
            } else {
                // Remove Streaming Role
                if (member.roles.cache.has(constants.roles.steaming)) {
                    await role.remove(member, constants.roles.steaming)
                }
                // Remove Text Role
                if (member.roles.cache.has(constants.roles.dedicated)) {
                    await role.remove(member, constants.roles.dedicated);
                }
            }
        } catch (error) {
            error_manager.mark(new error_ticket('memberVoiceUpdate', error));
        }
        VoiceManager.finish();
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
    },
    dedicateChannel: async function (origin, name) {
        await DedicateManager.queue();
        try {
            const channel_name = '🔰' + name;
            const channel_origin = app.channel(origin);
            if (channel_origin) {
                if (channel_origin.parentID == constants.channels.category.dedicated) {
                    // Rename
                    await channel_origin.setName(channel_name);
                    const text_channel = app.channel(constants.channels.category.dedicated).children.find(channel => channel.type == 'text' && channel.topic && channel.topic.split(' ')[0] == this_channel.id);
                    await text_channel.setName(channel_name);
                    const hoisted_role = app.role(text_channel.topic.split(' ')[2]);
                    await hoisted_role.setName(`Team ${channel_name}`);

                    // Set info
                    const channel_desc = new Array();
                    channel_desc.push(`• Only members who are in this voice channel can view this text channel.`);
                    channel_desc.push(`• You can't view other dedicated channels once you're connected to one.`);
                    channel_desc.push(`• ${text_channel} voice and text channels will automatically be deleted once everyone is disconnected from these channels.`);
                    channel_desc.push(`• You can lock this channel by doing **!dedicate lock**, and you can do **!dedicate unlock** to unlock it.`);
                    channel_desc.push(`• You can transfer anyone from another voice channel to this voice channel by doing **!transfer <@member>**.\n\u200b\u200bEx: "!transfer ${app.client.user}"`);
                    channel_desc.push(`• You can also transfer multiple users at once.\n\u200b\u200bEx: "!transfer ${app.client.user} ${app.client.user}"`);
                    channel_desc.push(`Note: ${app.role(constants.roles.staff)} and ${app.role(constants.roles.music_bot)} can interact with these channels.`);
                    const embed = new MessageEmbed();
                    embed.setAuthor('Quarantine Gaming: Dedicated Channels');
                    embed.setTitle(`Voice and Text Channels for ${channel_name}`);
                    embed.setDescription(channel_desc.join('\n\n'));
                    embed.setColor('#7b00ff');

                    const profile = app.guild.members.cache.find(member => member.displayName == name);
                    const emoji = app.guild.emojis.cache.find(emoji => emoji.name == name.split(' ').join('').split(':').join('').split('-').join(''));
                    const qg_emoji = app.guild.emojis.cache.find(emoji => emoji.name == 'quarantinegaming');
                    if (profile) {
                        embed.setThumbnail(profile.user.displayAvatarURL());
                    } else if (emoji) {
                        embed.setThumbnail(emoji.url);
                    } else {
                        embed.setThumbnail(qg_emoji.url);
                    }

                    await message.sendToChannel(text_channel, embed);
                } else {
                    // Notify
                    await speech.say(`Transferring to ${name} dedicated channel. Please wait.`, channel_origin);

                    const dedicated_voice_channel = await channel.create({
                        name: channel_name,
                        type: 'voice',
                        parent: constants.channels.category.dedicated,
                        position: 1,
                        permissionOverwrites: [
                            {
                                id: constants.roles.everyone,
                                deny: ["CREATE_INSTANT_INVITE", "MANAGE_CHANNELS", "MANAGE_ROLES", "MANAGE_WEBHOOKS", "CONNECT", 'MUTE_MEMBERS', 'DEAFEN_MEMBERS', 'MOVE_MEMBERS', 'PRIORITY_SPEAKER']
                            },
                            {
                                id: constants.roles.dedicated,
                                deny: ["VIEW_CHANNEL"]
                            },
                            {
                                id: constants.roles.member,
                                allow: ["CONNECT", 'SPEAK', "STREAM"],
                            },
                            {
                                id: constants.roles.music_bot,
                                allow: ["CONNECT"]
                            }
                        ],
                        bitrate: 128000
                    });

                    const dedicated_text_role = await role.create({
                        name: `Text ${dedicated_voice_channel.id}`
                    });

                    const team_role = await role.create({
                        name: `Team ${channel_name}`,
                        color: '#00a5ff',
                        position: app.channel(constants.roles.dedicated).position,
                        hoist: true
                    });

                    const dedicated_text_channel = await channel.create({
                        name: channel_name,
                        type: 'text',
                        parent: constants.channels.category.dedicated,
                        position: 1,
                        permissionOverwrites: [
                            {
                                id: constants.roles.everyone,
                                deny: ["CREATE_INSTANT_INVITE", "MANAGE_CHANNELS", "MANAGE_ROLES", "MANAGE_WEBHOOKS", "VIEW_CHANNEL", "MENTION_EVERYONE", "MANAGE_MESSAGES", 'MUTE_MEMBERS', 'DEAFEN_MEMBERS', 'MOVE_MEMBERS', 'PRIORITY_SPEAKER']
                            },
                            {
                                id: constants.roles.music_bot,
                                allow: ["VIEW_CHANNEL"]
                            },
                            {
                                id: dedicated_text_role.id,
                                allow: ["VIEW_CHANNEL", "SEND_TTS_MESSAGES", "EMBED_LINKS", "ATTACH_FILES"]
                            }
                        ],
                        topic: `${dedicated_voice_channel.id} ${dedicated_text_role.id} ${team_role.id}`
                    });

                    await dedicated_voice_channel.updateOverwrite(dedicated_text_role, {
                        VIEW_CHANNEL: true
                    });

                    // Set info
                    const channel_desc = new Array();
                    channel_desc.push(`• Only members who are in this voice channel can view this text channel.`);
                    channel_desc.push(`• You can't view other dedicated channels once you're connected to one.`);
                    channel_desc.push(`• ${dedicated_text_role} voice and text channels will automatically be deleted once everyone is disconnected from these channels.`);
                    channel_desc.push(`• You can lock this channel by doing **!dedicate lock**, and you can do **!dedicate unlock** to unlock it.`);
                    channel_desc.push(`• You can transfer anyone from another voice channel to this voice channel by doing **!transfer <@member>**.\n\u200b\u200bEx: "!transfer ${app.client.user}"`);
                    channel_desc.push(`• You can also transfer multiple users at once.\n\u200b\u200bEx: "!transfer ${app.client.user} ${app.client.user}"`);
                    channel_desc.push(`Note: ${app.role(constants.roles.staff)} and ${app.role(constants.roles.music_bot)} can interact with these channels.`);
                    const embed = new MessageEmbed();
                    embed.setAuthor('Quarantine Gaming: Dedicated Channels');
                    embed.setTitle(`Voice and Text Channels for ${channel_name}`);
                    embed.setDescription(channel_desc.join('\n\n'));
                    embed.setColor('#7b00ff');

                    const profile = app.guild.members.cache.find(member => member.displayName == name);
                    const emoji = app.guild.emojis.cache.find(emoji => emoji.name == name.split(' ').join('').split(':').join('').split('-').join(''));
                    const qg_emoji = app.guild.emojis.cache.find(emoji => emoji.name == 'quarantinegaming');
                    if (profile) {
                        embed.setThumbnail(profile.user.displayAvatarURL());
                    } else if (emoji) {
                        embed.setThumbnail(emoji.url);
                    } else {
                        embed.setThumbnail(qg_emoji.url);
                    }

                    await message.sendToChannel(dedicated_text_channel, embed);

                    // Sort members
                    const streamers = [], members = [];
                    for (const this_member of channel_origin.members.array()) {
                        if (this_member.roles.cache.has(constants.roles.streaming)) {
                            streamers.push(this_member);
                        } else {
                            members.push(this_member);
                        }
                    }
                    // Transfer streamers
                    for (const this_member of streamers) {
                        await this_member.voice.setChannel(voice_channel);
                        await functions.sleep(1000);
                    }
                    // Transfer members
                    for (const this_member of members) {
                        if (this_member.user.id != g_client.user.id) {
                            await this_member.voice.setChannel(voice_channel);
                            await functions.sleep(1000);
                        }
                    }
                }
            }
        } catch (error) {
            error_manager.mark(new error_ticket('dedicateChannel', error));
        }
        DedicateManager.finish();
    }
}