let isUpdating = false, toUpdate = new Array();

function array_difference(a1, a2) {
    let a = [], diff = [];
    for (let i = 0; i < a1.length; i++) {
        a[a1[i]] = true;
    }
    for (let i = 0; i < a2.length; i++) {
        if (a[a2[i]]) {
            delete a[a2[i]];
        } else {
            a[a2[i]] = true;
        }
    }
    for (let k in a) {
        diff.push(k);
    }
    return diff;
}

async function updateMember() {
    while (toUpdate.length > 0) {
        const this_data = toUpdate.pop();
        const oldData = this_data.old;
        const newData = this_data.new;
        let this_member = newData.member ? newData.member : oldData.member;
        if (!this_member.user.bot) {
            let oldA = [], newA = [];
            if (oldData) oldA = oldData.activities.map(activity => activity.name);
            if (newData) newA = newData.activities.map(activity => activity.name);
            let diff = array_difference(oldA, newA);

            for (let this_activity_name of diff) {
                let newActivity, oldActivity
                if (newData) newActivity = newData.activities.find(activity => activity.name == this_activity_name);
                if (oldData) oldActivity = oldData.activities.find(activity => activity.name == this_activity_name);
                let this_activity = newActivity ? newActivity : oldActivity;
                if (this_activity.applicationID && this_activity.type == 'PLAYING') {
                    let this_game = this_activity.name.trim();
                    let this_vr_name = g_vrprefix + this_game;
                    let this_voice_role = g_interface.vars().guild.roles.cache.find(role => role.name == this_vr_name);
                    if (newActivity) {
                        // Check if the title of the game is not null and is not one of the ignored titles
                        if (this_game && !g_ignored_titles.includes(this_game)) {
                            // Check if user doesn't have this mentionable role
                            if (!this_member.roles.cache.find(role => role.name == this_game)) {
                                // Get the equivalent role of this game
                                let this_mentionable_role = g_interface.vars().guild.roles.cache.find(role => role.name == this_game);
                                // Check if this role exists
                                if (!this_mentionable_role) {
                                    // Create role on this guild
                                    await g_interface.vars().guild.roles.create({
                                        data: {
                                            name: this_game,
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
                            if (!this_voice_role) {
                                // Get reference role
                                let play_role = g_interface.vars().guild.roles.cache.find(role => role.name == '<PLAYROLES>');
                                // Create role on this guild
                                await g_interface.vars().guild.roles.create({
                                    data: {
                                        name: this_vr_name,
                                        color: '0x7b00ff',
                                        position: play_role.position,
                                        hoist: true
                                    },
                                    reason: `A new game is played by (${this_member.user.tag}).`
                                }).then(function (voice_role) {
                                    this_voice_role = voice_role;
                                }).catch(error => {
                                    g_interface.on_error({
                                        name: 'updateMember -> .create(this_vr_name)',
                                        location: 'dynamic_roles.js',
                                        error: error
                                    });
                                });
                            }

                            // Check if user doesn't have this voice room role
                            if (!this_member.roles.cache.find(role => role == this_voice_role)) {
                                // Assign role to this member
                                await this_member.roles.add(this_voice_role).catch(error => {
                                    g_interface.on_error({
                                        name: 'updateMember -> .add(this_voice_role)',
                                        location: 'dynamic_roles.js',
                                        error: error
                                    });
                                });
                            }
                        }
                    } else if (this_voice_role) {
                        // Remove role
                        await this_member.roles.remove(this_voice_role, 'This role is no longer valid.').catch(error => {
                            g_interface.on_error({
                                name: 'updateMember -> .remove(this_voice_role) [user]',
                                location: 'dynamic_roles.js',
                                error: error
                            });
                        });
                        // Check if the role is still in use
                        let role_in_use = false;
                        for (let this_guild_member of g_interface.vars().guild.members.cache.array()) {
                            if (this_guild_member.roles.cache.find(role => role == this_voice_role)) {
                                if (this_guild_member.presence.activities.map(activity => activity.name.trim()).includes(this_voice_role.name.substring(g_vrprefix.length))) {
                                    role_in_use = true;
                                } else {
                                    await this_guild_member.roles.remove(this_voice_role, 'This role is no longer valid.').catch(error => {
                                        g_interface.on_error({
                                            name: 'updateMember -> .remove(this_voice_role) [member]',
                                            location: 'dynamic_roles.js',
                                            error: error
                                        });
                                    });
                                }
                            }
                        }
                        if (!role_in_use) {
                            await this_voice_role.delete('This role is no longer in use.').catch(error => {
                                g_interface.on_error({
                                    name: 'updateMember -> .delete(this_voice_role)',
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
    isUpdating = false;
}

const init = async function () {
    // Add play roles
    for (let this_member of g_interface.vars().guild.members.cache.array()) {
        if (!this_member.user.bot) {
            for (let this_activity of this_member.presence.activities) {
                if (this_activity.applicationID && this_activity.type == 'PLAYING') {
                    let this_game = this_activity.name.trim();
                    let this_vr_name = g_vrprefix + this_game;
                    let this_voice_role = g_interface.vars().guild.roles.cache.find(role => role.name == this_vr_name);
                    // Check if the title of the game is not null and is not one of the ignored titles
                    if (this_game && !g_ignored_titles.includes(this_game)) {
                        // Check if user doesn't have this mentionable role
                        if (!this_member.roles.cache.find(role => role.name == this_game)) {
                            // Get the equivalent role of this game
                            let this_mentionable_role = g_interface.vars().guild.roles.cache.find(role => role.name == this_game);
                            // Check if this role exists
                            if (!this_mentionable_role) {
                                // Create role on this guild
                                await g_interface.vars().guild.roles.create({
                                    data: {
                                        name: this_game,
                                        color: '0x00ffff',
                                        mentionable: true,
                                        hoist: true
                                    },
                                    reason: `A new game is played by (${this_member.user.tag}).`
                                }).then(async function (this_created_role) {
                                    this_mentionable_role = this_created_role;
                                }).catch(error => {
                                    g_interface.on_error({
                                        name: 'init -> .create(this_game)',
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
                        if (!this_voice_role) {
                            // Get reference role
                            let play_role = g_interface.vars().guild.roles.cache.find(role => role.name == '<PLAYROLES>');
                            // Create role on this guild
                            await g_interface.vars().guild.roles.create({
                                data: {
                                    name: this_vr_name,
                                    color: '0x7b00ff',
                                    position: play_role.position,
                                    hoist: true
                                },
                                reason: `A new game is played by (${this_member.user.tag}).`
                            }).then(async function (voice_role) {
                                this_voice_role = voice_role;
                            }).catch(error => {
                                g_interface.on_error({
                                    name: 'init -> .create(this_vr_name)',
                                    location: 'dynamic_roles.js',
                                    error: error
                                });
                            });
                        }

                        // Check if user doesn't have this voice room role
                        if (!this_member.roles.cache.find(role => role == this_voice_role)) {
                            // Assign role to this member
                            await this_member.roles.add(this_voice_role).catch(error => {
                                g_interface.on_error({
                                    name: 'init -> .add(this_voice_role)',
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
    for (let this_role of g_interface.vars().guild.roles.cache.array()) {
        if (this_role.name.startsWith(g_vrprefix)) {
            // Check if the role is still in use
            let role_in_use = false;
            for (let this_member of g_interface.vars().guild.members.cache.array()) {
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
                console.log(`Delete: ${this_role.name}`)
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
    for (let this_channel of g_interface.vars().guild.channels.cache.array()) {
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