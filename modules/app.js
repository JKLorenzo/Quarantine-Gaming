const { CommandoClient } = require('discord.js-commando');
const { MessageEmbed, TextChannel } = require('discord.js');
const constants = require('./constants.js');
const functions = require('./functions.js');
let message_manager = require('./message_manager.js');
let error_manager = require('./error_manager.js');
let role_manager = require('./role_manager.js');
let database = require('./database.js');
let general = require('./general.js');
let channel_manager = require('./channel_manager.js');

const error_ticket = error_manager.for('app.js');
let client = new CommandoClient();
let initialized = false;

module.exports = {
    isInitialized: function () {
        return initialized;
    },
    client: function () {
        return client;
    },
    guild: function () {
        return this.client().guilds.cache.get(constants.guild);
    },
    channel: function (GuildChannelResolvable) {
        return this.guild().channels.resolve(GuildChannelResolvable) || this.guild().channels.resolve(functions.parseMention(GuildChannelResolvable));
    },
    role: function (RoleResolvable) {
        return this.guild().roles.resolve(RoleResolvable) || this.guild().roles.resolve(functions.parseMention(RoleResolvable));
    },
    message: function (GuildChannelResolvable, MessageResolvable) {
        /** @type {TextChannel} */
        const channel = this.channel(GuildChannelResolvable);
        if (channel)
            return channel.messages.resolve(MessageResolvable);
        return null;
    },
    member: function (UserResolvable) {
        return this.guild().members.resolve(UserResolvable) || this.guild().members.resolve(functions.parseMention(UserResolvable));
    },
    setActivity: function (value, type = 'LISTENING') {
        return this.client().user.setActivity(value.trim(), {
            type: type.trim().toUpperCase()
        });
    },
    initialize: async function (t_client, t_Modules) {
        // Link
        client = t_client;
        const Modules = functions.parseModules(t_Modules);
        message_manager = Modules.message_manager;
        error_manager = Modules.error_manager;
        role_manager = Modules.role_manager;
        database = Modules.database;
        general = Modules.general;
        channel_manager = Modules.channel_manager;

        try {
            await this.setActivity('Debugging (v3)', 'PLAYING');

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
                            await role_manager.add(this_member, text_role).catch(error => error_manager.mark(new error_ticket(`add text_role to ${this_member}`, error, 'initialize')));
                        }
                        // Give team role
                        if (!this_member.user.bot && !this_member.roles.cache.has(team_role.id)) {
                            await role_manager.add(this_member, team_role).catch(error => error_manager.mark(new error_ticket(`add team_role to ${this_member}`, error, 'initialize')));
                        }
                        // Hide other dedicated channels
                        if (!this_member.user.bot && !this_member.roles.cache.has(constants.roles.dedicated)) {
                            await role_manager.add(this_member, constants.roles.dedicated).catch(error => error_manager.mark(new error_ticket(`add dedicated_role to ${this_member}`, error, 'initialize')));
                        }
                    }

                    for (const this_member of this.guild().members.cache.array()) {
                        if (!this_member.user.bot) {
                            if (this_member.roles.cache.has(text_role.id)) {
                                // Remove roles related to dedicated channels
                                if (!this_member.voice || this_member.voice.channelID != voice_channel.id) {
                                    await role_manager.remove(this_member, text_role).catch(error => error_manager.mark(new error_ticket(`remove text_role from ${this_member}`, error, 'initialize')));
                                    await role_manager.remove(this_member, team_role).catch(error => error_manager.mark(new error_ticket(`remove team_role from ${this_member}`, error, 'initialize')));
                                }
                            }

                            if (this_member.roles.cache.has(constants.roles.dedicated)) {
                                // Show all active dedicated channels
                                if (!this_member.voice || !this_member.voice.channel || this_member.voice.channel.parent != constants.channels.category.dedicated) {
                                    await role_manager.remove(this_member, constants.roles.dedicated).catch(error => error_manager.mark(new error_ticket(`remove dedicated_role from ${this_member}`, error, 'initialize')));
                                }
                            }
                        }
                    }
                }
            }

            // Manage Inactive Dedicated Channel Related Roles
            for (const this_member of this.guild().members.cache.array()) {
                for (const this_role of this_member.roles.cache.array()) {
                    if (this_role.id == constants.roles.dedicated) {
                        // Remove Dedicated Channel Role
                        if ((this_member.voice && this_member.voice.channel && this_member.voice.channel.parent && this_member.voice.channel.parent.id != constants.channels.category.dedicated) || !(this_member.voice && this_member.voice.channel)) {
                            await role_manager.remove(this_member, this_role);
                        }
                    } else if (this_role.name.startsWith('Text')) {
                        // Remove Text Role
                        const text_channel = this.channel(this_role.name.split(' ')[1]);
                        if (!text_channel || (text_channel && !text_channel.members.find(member => member.user.id == this_member.user.id))) {
                            await role_manager.remove(this_member, this_role);
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
                        const text_channel = this.guild().channels.cache.find(channel => channel.type == 'text' && channel.topic && channel.topic.split(' ')[0] == dedicated_channel.id);
                        const linked_data = text_channel.topic.split(' ');
                        const text_role = this.role(linked_data[1]);
                        const team_role = this.role(linked_data[2]);

                        await channel_manager.delete(dedicated_channel);
                        await channel_manager.delete(text_channel);
                        await role_manager.delete(text_role);
                        await role_manager.delete(team_role);
                    }
                }
            }

            // Add and Create Play Roles and Game Roles
            for (const this_member of this.guild().members.cache.array()) {
                if (!this_member.user.bot) {
                    for (const this_activity of this_member.presence.activities) {
                        const activity_name = this_activity.name.trim();
                        if (this_activity.type == 'PLAYING' && !database.gameTitles().blacklisted.includes(activity_name.toLowerCase()) && (this_activity.applicationID || database.gameTitles().whitelisted.includes(activity_name.toLowerCase()))) {
                            const game_role = this.guild().roles.cache.find(role => role.name == activity_name) || await role_manager.create({ name: activity_name, color: '0x00ffff' });
                            if (!this.guild().roles.cache.find(role => role.name == activity_name + ' ⭐')) {
                                // Create Game Role Mentionable
                                await role_manager.create({ name: activity_name + ' ⭐', color: '0x00fffe' });
                            }

                            if (!this_member.roles.cache.has(game_role.id)) {
                                // Add Game Role to this member
                                await role_manager.add(this_member, game_role);

                                const streaming_role = this.role(constants.roles.streaming);
                                let play_role = this.guild().roles.cache.find(role => role.name == 'Play ' + activity_name);
                                if (play_role) {
                                    // Bring Play Role to Top
                                    await play_role.setPosition(streaming_role.position - 1);
                                } else {
                                    // Create Play Role
                                    play_role = await role_manager.create({ name: 'Play ' + activity_name, color: '0x7b00ff', position: streaming_role.position, hoist: true });
                                }

                                if (!this_member.roles.cache.has(play_role.id)) {
                                    // Add Play Role to this member
                                    await role_manager.add(this_member, play_role);
                                }
                            }
                        }
                    }
                }
            }

            // Manage Inactive Play Roles
            for (const this_role of this.guild().roles.cache.array()) {
                if (this_role.hexColor == '#7b00ff' && this_role.name.startsWith('Play')) {
                    // Check if Play Role is still in use
                    let role_in_use = false;
                    for (const this_member of this.guild().members.cache.array()) {
                        if (this_member.roles.cache.find(role => role == this_role)) {
                            // Check if this member is still playing
                            if (this_member.presence.activities.map(activity => activity.name.trim()).includes(this_role.name.substring(5))) {
                                role_in_use = true;
                            } else {
                                // Remove Play Role from this member
                                await role_manager.remove(this_member, this_role);
                            }
                        }
                    }
                    // Delete blacklisted and inactive Play Roles
                    if (!role_in_use || database.gameTitles().blacklisted.includes(this_role.name.substring(5).toLowerCase())) {
                        // Delete Play Role
                        await role_manager.delete(this_role);
                    }
                } else if (this_role.hexColor == '#00ffff' && database.gameTitles().blacklisted.includes(this_role.name.toLowerCase())) {
                    // Delete Game Role
                    await role_manager.delete(this_role);
                } else if (this_role.hexColor == '#00fffe' && database.gameTitles().blacklisted.includes(this_role.name.toLowerCase())) {
                    // Delete Game Role Mentionable
                    await role_manager.delete(this_role);
                }
            }

            // Manage Inactive Streamers
            for (const this_member of this.guild().members.cache.array()) {
                if (this_member.roles.cache.has(constants.roles.streaming)) {
                    await role_manager.remove(this_member, constants.roles.streaming);
                }
            }

            // Check for unlisted members
            await general.memberUnlisted();

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

            // Free Games
            setTimeout(async () => {
                // Initial Fetch after 10mins
                await general.freeGameFetch();
                await general.freeGameUpdate();

                // Future Fetch every 30mins
                setInterval(() => {
                    general.freeGameFetch();
                }, 1800000);
                // Future Update every 3hrs
                setInterval(() => {
                    general.freeGameUpdate();
                }, 10800000);
            }, 600000);

            if (process.env.STARTUP_REASON) {
                const embed = new MessageEmbed();
                embed.setColor('#ffff00');
                embed.setAuthor('Quarantine Gaming', this.client().user.displayAvatarURL());
                embed.setTitle('Startup Initiated');
                embed.addField('Reason', process.env.STARTUP_REASON);

                await message_manager.sendToChannel(constants.channels.qg.logs, embed);
            }

            console.log('Initialized');
            initialized = true;
        } catch (error) {
            console.error('Initializing Failed');
            error_manager.mark(new error_ticket('initialize', error));
        }
    }
}