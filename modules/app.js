const { CommandoClient } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');
const constants = require('./constants.js');
const functions = require('./functions.js');
const message = require('./message.js');
const error_manager = require('./error_manager.js');
const role = require('./role.js');
const database = require('./database.js');
const general = require('./general.js');
const channel = require('./channel.js');

let global_client = new CommandoClient();
let initialized = false;

const error_ticket = error_manager.for('app.js');

module.exports = {
    isInitialized: initialized,
    client: global_client,
    guild: global_client.guilds.cache.get(constants.guild),
    channel: function (resolvable) {
        return this.guild.channels.resolve(resolvable);
    },
    role: function (resolvable) {
        return this.guild.roles.resolve(resolvable);
    },
    member: function (user) {
        return this.guild.member(user);
    },
    setActivity: function (value, type = 'LISTENING') {
        return global_client.user.setActivity(value.trim(), {
            type: type.trim().toUpperCase()
        });
    },
    initialize: async function (client) {
        try {
            global_client = client;

            await this.setActivity('!help');

            // Manage Active Dedicated Channels
            for (const dedicated_channel of this.channel(constants.channels.category.dedicated).children.array()) {
                if (dedicated_channel.type == 'text') {
                    const linked_data = dedicated_channel.topic.split(' ');
                    const voice_channel = this.channel(linked_data[0]);
                    const text_role = this.role(linked_data[1]);
                    const team_role = this.role(linked_data[2]);

                    for (const this_member of voice_channel.members.array()) {
                        // Give text role
                        if (!this_member.user.bot && !this_member.roles.cache.has(text_role.id)) {
                            await role.add(this_member, text_role).catch(error => error_manager.mark(new error_ticket(`add text_role to ${this_member}`, error, 'initialize')));
                        }
                        // Give team role
                        if (!this_member.user.bot && !this_member.roles.cache.has(team_role.id)) {
                            await role.add(this_member, team_role).catch(error => error_manager.mark(new error_ticket(`add team_role to ${this_member}`, error, 'initialize')));
                        }
                        // Hide other dedicated channels
                        if (!this_member.user.bot && !this_member.roles.cache.has(constants.roles.dedicated)) {
                            await role.add(this_member, constants.roles.dedicated).catch(error => error_manager.mark(new error_ticket(`add dedicated_role to ${this_member}`, error, 'initialize')));
                        }
                    }

                    for (const this_member of this.guild.members.cache.array()) {
                        if (!this_member.user.bot) {
                            if (this_member.roles.cache.has(text_role.id)) {
                                // Remove roles related to dedicated channels
                                if (!this_member.voice || this_member.voice.channelID != voice_channel.id) {
                                    await role.remove(this_member, text_role).catch(error => error_manager.mark(new error_ticket(`remove text_role from ${this_member}`, error, 'initialize')));
                                    await role.remove(this_member, team_role).catch(error => error_manager.mark(new error_ticket(`remove team_role from ${this_member}`, error, 'initialize')));
                                }
                            }

                            if (this_member.roles.cache.has(constants.roles.dedicated)) {
                                // Show all active dedicated channels
                                if (!this_member.voice || !this_member.voice.channel || this_member.voice.channel.parent != constants.channels.category.dedicated) {
                                    await role.remove(this_member, constants.roles.dedicated).catch(error => error_manager.mark(new error_ticket(`remove dedicated_role from ${this_member}`, error, 'initialize')));
                                }
                            }
                        }
                    }
                }
            }

            // Manage Inactive Dedicated Channel Related Roles
            for (const this_member of this.guild.members.cache.array()) {
                for (const this_role of this_member.roles.cache.array()) {
                    if (this_role.id == constants.roles.dedicated) {
                        // Remove Dedicated Channel Role
                        if ((this_member.voice && this_member.voice.channel && this_member.voice.channel.parent && this_member.voice.channel.parent.id != constants.channels.category.dedicated) || !(this_member.voice && this_member.voice.channel)) {
                            await role.remove(this_member, this_role);
                        }
                    } else if (this_role.name.startsWith('Text')) {
                        // Remove Text Role
                        const text_channel = this.channel(this_role.name.split(' ')[1]);
                        if (!text_channel || (text_channel && !text_channel.members.find(member => member.user.id == this_member.user.id))) {
                            await role.remove(this_member, this_role);
                        }
                    }
                }
            }

            // Manage Inactive Dedicated Channel Related Channels
            for (const dedicated_channel of this.channel(constants.channels.category.dedicated).children.array()) {
                if (dedicated_channel.type == 'voice' && dedicated_channel.parent && dedicated_channel.parentID == constants.channels.category.dedicated) {
                    let empty = true;
                    for (const this_member of dedicated_channel.members.array()) {
                        if (!this_member.user.bot) empty = false;
                    }
                    if (empty) {
                        const text_channel = this.guild.channels.cache.find(channel => channel.type == 'text' && channel.topic && channel.topic.split(' ')[0] == dedicated_channel.id);
                        const linked_data = text_channel.topic.split(' ');
                        const text_role = this.role(linked_data[1]);
                        const team_role = this.role(linked_data[2]);

                        await channel.delete(dedicated_channel);
                        await channel.delete(text_channel);
                        await role.delete(text_role);
                        await role.delete(team_role);
                    }
                }
            }

            // Add and Create Play Roles and Game Roles
            for (const this_member of this.guild.members.cache.array()) {
                if (!this_member.user.bot) {
                    for (const this_activity of this_member.presence.activities) {
                        const activity_name = this_activity.name.trim();
                        if (this_activity.type == 'PLAYING' && !database.gameTitles().blacklisted.includes(activity_name.toLowerCase()) && (this_activity.applicationID || database.gameTitles().whitelisted.includes(activity_name.toLowerCase()))) {
                            const game_role = this.guild.roles.cache.find(role => role.name == activity_name) || await role.create({ name: activity_name, color: '0x00ffff' });
                            if (!this.guild.roles.cache.find(role => role.name == activity_name + ' ⭐')) {
                                // Create Game Role Mentionable
                                await role.create({ name: activity_name + ' ⭐', color: '0x00fffe' });
                            }

                            if (!this_member.roles.cache.has(game_role.id)) {
                                // Add Game Role to this member
                                await role.add(this_member, game_role);
                            }

                            const streaming_role = this.role(constants.roles.streaming);
                            let play_role = this.guild.roles.cache.find(role => role.name == 'Play ' + activity_name);
                            if (play_role) {
                                // Bring Play Role to Top
                                await play_role.setPosition(streaming_role.position - 1);
                            } else {
                                // Create Play Role
                                play_role = await role.create({ name: 'Play ' + activity_name, color: '0x7b00ff', position: streaming_role.position, hoist: true });
                            }

                            if (!this_member.roles.cache.has(play_role.id)) {
                                // Add Play Role to this member
                                await role.add(this_member, play_role);
                            }
                        }
                    }
                }
            }

            // Manage Inactive Play Roles
            for (const this_role of this.guild.roles.cache.array()) {
                if (this_role.hexColor == '#7b00ff' && this_role.name.startsWith('Play')) {
                    // Check if Play Role is still in use
                    let role_in_use = false;
                    for (const this_member of this.guild.members.cache.array()) {
                        if (this_member.roles.cache.find(role => role == this_role)) {
                            // Check if this member is still playing
                            if (this_member.presence.activities.map(activity => activity.name.trim()).includes(this_role.name.substring(5))) {
                                role_in_use = true;
                            } else {
                                // Remove Play Role from this member
                                await role.remove(this_member, this_role);
                            }
                        }
                    }
                    // Delete blacklisted and inactive Play Roles
                    if (!role_in_use || database.gameTitles().blacklisted.includes(this_role.name.substring(5).toLowerCase())) {
                        // Delete Play Role
                        await role.delete(this_role);
                    }
                } else if (this_role.hexColor == '#00ffff' && database.gameTitles().blacklisted.includes(this_role.name.toLowerCase())) {
                    // Delete Game Role
                    await role.delete(this_role);
                } else if (this_role.hexColor == '#00fffe' && database.gameTitles().blacklisted.includes(this_role.name.toLowerCase())) {
                    // Delete Game Role Mentionable
                    await role.delete(this_role);
                }
            }

            // Auto Dedicate
            setInterval(() => {
                try {
                    const channels_for_dedication = new Array();
                    for (const this_channel of this.channel(constants.channels.category.voice).children.array()) {
                        if (this_channel.type == 'voice') channels_for_dedication.push(this_channel);
                    }
                    for (const this_channel of this.channel(constants.channels.category.dedicated).children.array()) {
                        if (this_channel.type == 'voice') channels_for_dedication.push(this_channel);
                    }
                    for (const this_channel of channels_for_dedication) {
                        if (this_channel.members.size > 1) {
                            // Get baseline activity
                            let baseline_role, same_acitivities, diff_acitivities;
                            for (const this_member of this_channel.members.array()) {
                                for (const this_role of this_member.roles.cache.array()) {
                                    if (!baseline_role && this_role.name.startsWith('Play')) {
                                        // Check how many users have the same roles
                                        same_acitivities = 0;
                                        diff_acitivities = 0;
                                        for (const the_member of this_channel.members.array()) {
                                            if (the_member.roles.cache.find(role => role == this_role)) {
                                                same_acitivities++;
                                            } else if (the_member.roles.cache.find(role => role.name.startsWith('Play'))) {
                                                diff_acitivities++;
                                            }
                                        }
                                        if (same_acitivities > 1 && same_acitivities > diff_acitivities && !this_role.name.substring(5).startsWith(this_channel.name.substring(2))) {
                                            baseline_role = this_role;
                                            general.dedicateChannel(this_channel, this_role.name.substring(5));
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (error) {
                    error_manager.mark(new error_ticket('Auto Dedicate', error, 'initialize'));
                }
            }, 120000);

            if (process.env.STARTUP_REASON) {
                const embed = new MessageEmbed();
                embed.setColor('#ffff00');
                embed.setAuthor('Quarantine Gaming', client.user.displayAvatarURL());
                embed.setTitle('Startup Initiated');
                embed.addField('Reason', process.env.STARTUP_REASON);

                await message.sendToChannel(constants.channels.qg.logs, embed);
            }

            console.log('Initialized');
            initialized = true;
        } catch (error) {
            error_manager.mark(new error_ticket('initialize', error));
        }
    }
}