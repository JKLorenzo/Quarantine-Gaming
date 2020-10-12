const { MessageEmbed } = require('discord.js');
let isUpdating = false, toUpdate = new Array();

async function updateMember() {
    while (toUpdate.length > 0) {
        const this_data = toUpdate.shift();
        const oldData = this_data.old;
        const newData = this_data.new;
        let this_member = newData.member ? newData.member : oldData.member;
        if (!this_member.user.bot) {
            let oldA = new Array(), newA = new Array();
            if (oldData) oldA = oldData.activities.map(activity => activity.name.trim());
            if (newData) newA = newData.activities.map(activity => activity.name.trim());
            let diff = g_functions.array_difference(oldA, newA);

            // DEBUGGING =============================================
            let embed = new MessageEmbed().setTimestamp();
            embed.setAuthor('Quarantine Gaming: Presence Debugging', g_client.user.displayAvatarURL());
            embed.setTitle('Presence Update');
            let description = new Array();
            description.push(`Old: ${oldA.join(', ')}`);
            description.push(`New: ${newA.join(', ')}`);
            description.push(`Queue: ${diff.join(', ')}`);

            for (let this_activity_name of diff) {
                description.push(`\nProcessing: ${this_activity_name}`);
                let newActivity, oldActivity
                if (newData) newActivity = newData.activities.find(activity => activity.name.trim() == this_activity_name);
                if (oldData) oldActivity = oldData.activities.find(activity => activity.name.trim() == this_activity_name);

                description.push(`Old Activity Name: |${oldActivity ? oldActivity.name ? oldActivity.name : 'Not Found' : 'NULL'}|`);
                description.push(`New Activity Name: |${newActivity ? newActivity.name ? newActivity.name : 'Not Found' : 'NULL'}|`);
                
                let this_activity = newActivity ? newActivity : oldActivity;

                description.push(`Selected: ${newActivity ? 'New Activity': 'Old Activity'}`);
                description.push(`Game: ${this_activity.type == 'PLAYING' ? this_activity.applicationID ? 'VERIFIED' : 'UNVERIFIED' : 'NOT A GAME'}`);

                if (this_activity.applicationID && this_activity.type == 'PLAYING') {
                    let this_game_name = this_activity.name.trim();
                    let this_play_name = g_vrprefix + this_game_name;
                    let this_play_role = g_channels.get().guild.roles.cache.find(role => role.name == this_play_name);
                    if (newActivity) {
                        // Check if the title of the game is not null and is not one of the ignored titles
                        if (this_game_name && !g_ignored_titles.includes(this_game_name)) {
                            // Check if user doesn't have this mentionable role
                            if (!this_member.roles.cache.find(role => role.name == this_game_name)) {
                                // Get the equivalent role of this game
                                let this_mentionable_role = g_channels.get().guild.roles.cache.find(role => role.name == this_game_name);
                                // Check if this role exists
                                if (!this_mentionable_role) {
                                    // Create role on this guild
                                    await g_channels.get().guild.roles.create({
                                        data: {
                                            name: this_game_name,
                                            color: '0x00ffff',
                                            mentionable: true
                                        },
                                        reason: `A new game is played by (${this_member.user.tag}).`
                                    }).then(function (this_created_role) {
                                        this_mentionable_role = this_created_role;
                                    }).catch(error => {
                                        g_interface.on_error({
                                            name: 'updateMember -> .create(data, reason)',
                                            location: 'dynamic_roles.js',
                                            error: error
                                        });
                                    });
                                }
                                // Assign role to this member
                                await this_member.roles.add(this_mentionable_role).catch(error => {
                                    g_interface.on_error({
                                        name: 'updateMember -> .add(this_mentionable_role)',
                                        location: 'dynamic_roles.js',
                                        error: error
                                    });
                                });
                            }

                            // Check if this role doesn't exists
                            if (!this_play_role) {
                                // Get reference role
                                let play_role = g_channels.get().guild.roles.cache.find(role => role.name == '<PLAYROLES>');
                                // Create role on this guild
                                await g_channels.get().guild.roles.create({
                                    data: {
                                        name: this_play_name,
                                        color: '0x7b00ff',
                                        position: play_role.position,
                                        hoist: true
                                    },
                                    reason: `A new game is played by (${this_member.user.tag}).`
                                }).then(function (play_role) {
                                    this_play_role = play_role;
                                }).catch(error => {
                                    g_interface.on_error({
                                        name: 'updateMember -> .create(this_play_name)',
                                        location: 'dynamic_roles.js',
                                        error: error
                                    });
                                });
                            }

                            // Check if user doesn't have this voice room role
                            if (!this_member.roles.cache.find(role => role == this_play_role)) {
                                // Assign role to this member
                                await this_member.roles.add(this_play_role).catch(error => {
                                    g_interface.on_error({
                                        name: 'updateMember -> .add(this_play_role)',
                                        location: 'dynamic_roles.js',
                                        error: error
                                    });
                                });
                            }
                        }
                    } else if (this_play_role) {
                        // Remove role
                        await this_member.roles.remove(this_play_role, 'This role is no longer valid.').catch(error => {
                            g_interface.on_error({
                                name: 'updateMember -> .remove(this_play_role) [user]',
                                location: 'dynamic_roles.js',
                                error: error
                            });
                        });
                        // Check if the role is still in use
                        let role_in_use = false;
                        for (let this_guild_member of g_channels.get().guild.members.cache.array()) {
                            if (this_guild_member.roles.cache.find(role => role == this_play_role)) {
                                if (this_guild_member.presence.activities.map(activity => activity.name.trim()).includes(this_play_role.name.substring(g_vrprefix.length))) {
                                    role_in_use = true;
                                } else {
                                    await this_guild_member.roles.remove(this_play_role, 'This role is no longer valid.').catch(error => {
                                        g_interface.on_error({
                                            name: 'updateMember -> .remove(this_play_role) [member]',
                                            location: 'dynamic_roles.js',
                                            error: error
                                        });
                                    });
                                }
                            }
                        }
                        if (!role_in_use) {
                            await this_play_role.delete('This role is no longer in use.').catch(error => {
                                g_interface.on_error({
                                    name: 'updateMember -> .delete(this_play_role)',
                                    location: 'dynamic_roles.js',
                                    error: error
                                });
                            });
                        }
                    }
                }
            }
            embed.setDescription(description.join('\n'));
            if (oldA.length > 0 || newA.length > 0) g_channels.get().testing.send(embed);
        }
    }
    isUpdating = false;
}

const init = async function () {
    // Add play roles
    for (let this_member of g_channels.get().guild.members.cache.array()) {
        if (!this_member.user.bot) {
            for (let this_activity of this_member.presence.activities) {
                if (this_activity.applicationID && this_activity.type == 'PLAYING') {
                    let this_game_name = this_activity.name.trim();
                    let this_play_name = g_vrprefix + this_game_name;
                    let this_play_role = g_channels.get().guild.roles.cache.find(role => role.name == this_play_name);
                    // Check if the title of the game is not null and is not one of the ignored titles
                    if (this_game_name && !g_ignored_titles.includes(this_game_name)) {
                        // Check if user doesn't have this mentionable role
                        if (!this_member.roles.cache.find(role => role.name == this_game_name)) {
                            // Get the equivalent role of this game
                            let this_mentionable_role = g_channels.get().guild.roles.cache.find(role => role.name == this_game_name);
                            // Check if this role exists
                            if (!this_mentionable_role) {
                                // Create role on this guild
                                await g_channels.get().guild.roles.create({
                                    data: {
                                        name: this_game_name,
                                        color: '0x00ffff',
                                        mentionable: true,
                                        hoist: true
                                    },
                                    reason: `A new game is played by (${this_member.user.tag}).`
                                }).then(async function (this_created_role) {
                                    this_mentionable_role = this_created_role;
                                }).catch(error => {
                                    g_interface.on_error({
                                        name: 'init -> .create(this_game_name)',
                                        location: 'dynamic_roles.js',
                                        error: error
                                    });
                                });
                            }
                            // Assign role to this member
                            await this_member.roles.add(this_mentionable_role).catch(error => {
                                g_interface.on_error({
                                    name: 'init -> .add(this_mentionable_role)',
                                    location: 'dynamic_roles.js',
                                    error: error
                                });
                            });
                        }

                        // Check if this role doesn't exists
                        if (!this_play_role) {
                            // Get reference role
                            let play_role = g_channels.get().guild.roles.cache.find(role => role.name == '<PLAYROLES>');
                            // Create role on this guild
                            await g_channels.get().guild.roles.create({
                                data: {
                                    name: this_play_name,
                                    color: '0x7b00ff',
                                    position: play_role.position,
                                    hoist: true
                                },
                                reason: `A new game is played by (${this_member.user.tag}).`
                            }).then(async function (play_role) {
                                this_play_role = play_role;
                            }).catch(error => {
                                g_interface.on_error({
                                    name: 'init -> .create(this_play_name)',
                                    location: 'dynamic_roles.js',
                                    error: error
                                });
                            });
                        }

                        // Check if user doesn't have this voice room role
                        if (!this_member.roles.cache.find(role => role == this_play_role)) {
                            // Assign role to this member
                            await this_member.roles.add(this_play_role).catch(error => {
                                g_interface.on_error({
                                    name: 'init -> .add(this_play_role)',
                                    location: 'dynamic_roles.js',
                                    error: error
                                });
                            });
                        }
                    }
                }
            }
        }
    }

    // Remove unused play roles
    for (let this_role of g_channels.get().guild.roles.cache.array()) {
        if (this_role.name.startsWith(g_vrprefix)) {
            // Check if the role is still in use
            let role_in_use = false;
            for (let this_member of g_channels.get().guild.members.cache.array()) {
                if (this_member.roles.cache.find(role => role == this_role)) {
                    if (this_member.presence.activities.map(activity => activity.name.trim()).includes(this_role.name.substring(g_vrprefix.length))) {
                        role_in_use = true;
                    } else {
                        await this_member.roles.remove(this_role, 'This role is no longer valid.').catch(error => {
                            g_interface.on_error({
                                name: 'init -> .remove(this_role)',
                                location: 'dynamic_roles.js',
                                error: error
                            });
                        });
                    }
                }
            }
            if (!role_in_use) {
                await this_role.delete('This role is no longer in use.').catch(error => {
                    g_interface.on_error({
                        name: 'init -> .delete(this_role)',
                        location: 'dynamic_roles.js',
                        error: error
                    });
                });
            }
        }
    }

    // Remove empty play channels
    for (let this_channel of g_channels.get().guild.channels.cache.array()) {
        if (this_channel.type == 'voice' && this_channel.name.startsWith(g_vrprefix)) {
            if (this_channel.members.size == 0) {
                await this_channel.delete('This channel is no longer in use.').catch(error => {
                    g_interface.on_error({
                        name: 'init -> .delete(this_channel)',
                        location: 'dynamic_roles.js',
                        error: error
                    });
                });
            }
        }
    }
}

const update = function (oldData, newMember) {
    let this_data = {
        old: oldData,
        new: newMember
    }

    toUpdate.push(this_data);
    if (!isUpdating) {
        isUpdating = true;
        updateMember();
    }
}

// Interface Module Functions
module.exports = {
    init,
    update
}