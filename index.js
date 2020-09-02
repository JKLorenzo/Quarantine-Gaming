const { CommandoClient } = require('discord.js-commando');
const path = require('path');
const { MessageEmbed } = require('discord.js');
const db = require(path.join(__dirname, 'internal_commands', 'database.js'));
const interface = require(path.join(__dirname, 'internal_commands', 'interface.js'));
const feed = require(path.join(__dirname, 'internal_commands', 'feed.js'));
const fgu = require(path.join(__dirname, 'internal_commands', 'fgu.js'));
const dynamic_channel = require(path.join(__dirname, 'internal_commands', 'dynamic_channel.js'));

// Global Variables
global.rootDir = path.resolve(__dirname);
global.g_db = db;
global.g_interface = interface;

const vr_prefix = 'Play ';
const ignored_titles = [
    'StartupWindow', 'Error', 'modlauncher', 'BlueStacks', 'NoxPlayer'
];
const client = new CommandoClient({
    commandPrefix: '!',
    owner: '393013053488103435',
    partials: [
        'MESSAGE', 'REACTION'
    ]
});

client.registry
    .registerDefaultTypes()
    .registerGroups([
        ['management', 'Server Management'],
        ['services', 'Server Services']
    ])
    .registerDefaultGroups()
    .registerDefaultCommands({
        eval: false,
        ping: false,
        prefix: false,
        commandState: false,
    })
    .registerCommandsIn(path.join(__dirname, 'commands'));

client.once('ready', async () => {
    console.log('-------------{  Startup  }-------------');
    interface.init(client);
    dynamic_channel.init(client);
    db.init(client);
    fgu.init(client);
    feed.init(client);

    // Add play roles
    for (let this_member of g_interface.get('guild').members.cache.array()) {
        if (!this_member.user.bot) {
            for (let this_activity of this_member.presence.activities) {
                if (this_activity.type == 'PLAYING') {
                    let this_game = this_activity.name.trim();
                    let this_vr_name = vr_prefix + this_game;
                    let this_voice_role = g_interface.get('guild').roles.cache.find(role => role.name == this_vr_name);
                    // Check if the title of the game is not null and is not one of the ignored titles
                    if (this_game && !ignored_titles.includes(this_game)) {
                        // Check if user doesn't have this mentionable role
                        if (!this_member.roles.cache.find(role => role.name == this_game)) {
                            // Get the equivalent role of this game
                            let this_mentionable_role = g_interface.get('guild').roles.cache.find(role => role.name == this_game);
                            // Check if this role exists
                            if (!this_mentionable_role) {
                                // Get reference role
                                let play_role = g_interface.get('guild').roles.cache.find(role => role.name == '<PLAYROLES>');
                                // Create role on this guild
                                await g_interface.get('guild').roles.create({
                                    data: {
                                        name: this_game,
                                        color: '0x00ffff',
                                        mentionable: true,
                                        position: play_role.position,
                                        hoist: true
                                    },
                                    reason: `A new game is played by (${this_member.user.tag}).`
                                }).then(async function (this_created_role) {
                                    this_mentionable_role = this_created_role;
                                }).catch(error => {
                                    g_interface.on_error({
                                        name: 'ready -> .create(this_game)',
                                        location: 'index.js',
                                        error: error
                                    });
                                });
                            }
                            // Assign role to this member
                            await this_member.roles.add(this_mentionable_role).catch(error => {
                                g_interface.on_error({
                                    name: 'ready -> .add(this_mentionable_role)',
                                    location: 'index.js',
                                    error: error
                                });
                            });
                        }

                        // Check if this role doesn't exists
                        if (!this_voice_role) {
                            // Get reference role
                            let play_role = g_interface.get('guild').roles.cache.find(role => role.name == '<PLAYROLES>');
                            // Create role on this guild
                            await g_interface.get('guild').roles.create({
                                data: {
                                    name: this_vr_name,
                                    color: '0x7b00ff',
                                    mentionable: true,
                                    position: play_role.position,
                                    hoist: true
                                },
                                reason: `A new game is played by (${this_member.user.tag}).`
                            }).then(async function (voice_role) {
                                this_voice_role = voice_role;
                            }).catch(error => {
                                g_interface.on_error({
                                    name: 'ready -> .create(this_vr_name)',
                                    location: 'index.js',
                                    error: error
                                });
                            });
                        }

                        // Check if user doesn't have this voice room role
                        if (!this_member.roles.cache.find(role => role == this_voice_role)) {
                            // Assign role to this member
                            await this_member.roles.add(this_voice_role).catch(error => {
                                g_interface.on_error({
                                    name: 'ready -> .add(this_voice_role)',
                                    location: 'index.js',
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
    for (let this_role of g_interface.get('guild').roles.cache.array()) {
        if (this_role.name.startsWith(vr_prefix)) {
            // Check if the role is still in use
            let role_in_use = false;
            for (let this_member of g_interface.get('guild').members.cache.array()) {
                if (this_member.roles.cache.find(role => role == this_role)) {
                    if (this_member.presence.activities.map(activity => activity.name.trim()).includes(this_role.name.substring(vr_prefix.length))) {
                        role_in_use = true;
                    } else {
                        await this_member.roles.remove(this_role, 'This role is no longer valid.').catch(error => {
                            g_interface.on_error({
                                name: 'ready -> .remove(this_role)',
                                location: 'index.js',
                                error: error
                            });
                        });
                    }
                }
            }
            if (!role_in_use) {
                await this_role.delete('This role is no longer in use.').catch(error => {
                    g_interface.on_error({
                        name: 'ready -> .delete(this_role)',
                        location: 'index.js',
                        error: error
                    });
                });
            }
        }
    }

    // Remove empty play channels
    for (let this_channel of g_interface.get('guild').channels.cache.array()) {
        if (this_channel.type == 'voice' && this_channel.name.startsWith(vr_prefix)) {
            if (this_channel.members.size == 0) {
                await this_channel.delete('This channel is no longer in use.').catch(error => {
                    g_interface.on_error({
                        name: 'ready -> .delete(this_channel)',
                        location: 'index.js',
                        error: error
                    });
                });
            }
        }
    }

    // Set the bot's activity
    client.user.setActivity('!help', {
        type: 'LISTENING'
    });
});

// Audit logs
client.on('channelCreate', channel => {
    if (!channel || !channel.id) return;
    try {
        let this_channel = g_interface.get('guild').channels.cache.get(channel.id);

        if (!this_channel) return;

        let description = new Array();
        description.push(`**Name**: ${this_channel.name}`);
        if (this_channel.parent && this_channel.parent.name) description.push(`**Category**: ${this_channel.parent.name}`);

        description.push(` `);

        for (let overwrite of this_channel.permissionOverwrites) {
            description.push(`**Permission override for ${g_interface.get('guild').roles.cache.get(overwrite[0])}:**`)
            for (let permission of overwrite[1].allow.toArray()) {
                description.push(`${permission.substring(0, 1).toUpperCase() + permission.slice(1).toLowerCase()}: ✅`);
            }
            for (let permission of overwrite[1].deny.toArray()) {
                description.push(`${permission.substring(0, 1).toUpperCase() + permission.slice(1).toLowerCase()}: ❌`);
            }
            description.push(` `);
        }

        let embed = new MessageEmbed();
        embed.setTitle(`${this_channel.type.substring(0, 1).toUpperCase()}${this_channel.type.substring(1)} Channel Created`);
        embed.setDescription(description.join('\n'));
        embed.setFooter(`Channel ID: ${this_channel.id}`);
        embed.setTimestamp(new Date());
        embed.setColor('#64ff64');
        g_interface.log(embed);
    } catch (error) {
        g_interface.on_error({
            name: 'guildMemberUpdate',
            location: 'index.js',
            error: error
        });
    }
});

client.on('channelDelete', channel => {
    try {
        let description = new Array();
        description.push(`**Name**: ${channel.name}`);
        if (channel.parent.name) description.push(`**Category**: ${channel.parent.name}`);

        let embed = new MessageEmbed();
        embed.setTitle(`${channel.type.substring(0, 1).toUpperCase()}${channel.type.substring(1)} Channel Deleted`);
        embed.setDescription(description.join('\n'));
        embed.setFooter(`Channel ID: ${channel.id}`);
        embed.setTimestamp(new Date());
        embed.setColor('#ff6464');
        g_interface.log(embed);
    } catch (error) {
        g_interface.on_error({
            name: 'guildMemberUpdate',
            location: 'index.js',
            error: error
        });
    }
});

client.on('guildMemberUpdate', (oldMember, newMember) => {
    try {
        let embed = new MessageEmbed();
        embed.setAuthor(newMember.user.username, newMember.user.displayAvatarURL());
        embed.setTitle('Guild Member Update');

        let description = new Array();
        // Avatar
        if (newMember.user.displayAvatarURL() != oldMember.user.displayAvatarURL()) {
            if (description.length > 0) description.push(' ');
            description.push(`**Avatar**`);
            description.push(`New: ${newMember.user.displayAvatarURL()}`);
            description.push(`Old: ${oldMember.user.displayAvatarURL()}`);
            embed.setThumbnail(newMember.user.displayAvatarURL());
        }

        // Name
        if (newMember.user.username != oldMember.user.username) {
            if (description.length > 0) description.push(' ');
            description.push(`**Name**`);
            description.push(`New: ${newMember.user.username}`);
            description.push(`Old: ${oldMember.user.username}`);
        }

        // Role
        if (newMember.roles.cache.size != oldMember.roles.cache.size) {
            let added = new Array(), removed = new Array();
            for (let this_role of newMember.roles.cache.difference(oldMember.roles.cache).array()) {
                if (!this_role.name.startsWith(vr_prefix)){
                    if (newMember.roles.cache.has(this_role.id)) {
                        added.push(this_role);
                    } else {
                        removed.push(this_role);
                    }
                }
            }
            if (added.length > 0 || removed.length > 0) {
                if (description.length > 0) description.push(' ');
                description.push(`**Role**`);
            }
            if (added.length > 0) description.push(`Added: ${added.join(', ')}`);
            if (removed.length > 0) description.push(`Removed: ${removed.join(', ')}`);
        }

        embed.setDescription(description.join('\n'));
        embed.setFooter(`${newMember.user.tag} (${newMember.user.id})`);
        embed.setTimestamp(new Date());
        embed.setColor('#6464ff');
        if (description.length > 0) g_interface.log(embed);
    } catch (error) {
        g_interface.on_error({
            name: 'guildMemberUpdate',
            location: 'index.js',
            error: error
        });
    }
});

client.on('guildMemberAdd', async member => {
    let staff_channel = g_interface.get('guild').channels.cache.get('749763548090990613');
    let this_member = g_interface.get('guild').members.cache.get(member.id);

    if (this_member && !this_member.user.bot) {
        if (!this_member.roles.cache.find(role => role.id == '722699433225224233')) {
            let today = new Date();
            let diffMs = (today - this_member.user.createdAt);
            let diffDays = Math.floor(diffMs / 86400000)
            let diffHrs = Math.floor((diffMs % 86400000) / 3600000)
            let diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);
            let created_on = diffDays + " days " + diffHrs + " hours " + diffMins + " minutes";

            let embed = new MessageEmbed
            embed.setAuthor(this_member.user.tag);
            embed.setTitle('Quarantine Gaming Member Approval');
            embed.setThumbnail(this_member.user.displayAvatarURL());
            embed.addFields([
                { name: 'Username:', value: this_member.user.username },
                { name: 'Account Created:', value: created_on },
                { name: 'Moderation:', value: '✅ - Approve     ❌ - Kick     ⛔ - Ban', inline: true }
            ]);
            embed.setFooter('Warning: These actions are irreversible!');
            embed.setTimestamp(new Date());
            await staff_channel.send(embed).then(async this_message => {
                await this_message.react('✅');
                await this_message.react('❌');
                await this_message.react('⛔');
            });
            let dm = new Array();
            dm.push(`Hi ${member.user.username}, and welcome to **Quarantine Gaming**!`);
            dm.push('Please wait while our staff is processing your membership approval. See you soon!');
            g_interface.dm(member, dm.join('\n'));
        }
    }
});

client.on('presenceUpdate', async (oldMember, newMember) => {
    if (newMember.user.bot) return;
    try {
        let this_member = newMember.member ? newMember.member : oldMember.member;

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

        let oldA = [], newA = [];
        if (oldMember) oldA = oldMember.activities.map(activity => activity.name);
        if (newMember) newA = newMember.activities.map(activity => activity.name);
        let diff = array_difference(oldA, newA);

        for (let this_activity_name of diff) {
            let newActivity, oldActivity
            if (newMember) newActivity = newMember.activities.find(activity => activity.name == this_activity_name);
            if (oldMember) oldActivity = oldMember.activities.find(activity => activity.name == this_activity_name);
            let this_activity = newActivity ? newActivity : oldActivity;
            let this_game = this_activity.name.trim();
            let this_vr_name = vr_prefix + this_game;
            let this_voice_role = g_interface.get('guild').roles.cache.find(role => role.name == this_vr_name);

            if (this_activity.type == 'PLAYING') {
                if (newActivity) {
                    // Check if the title of the game is not null and is not one of the ignored titles
                    if (this_game && !ignored_titles.includes(this_game)) {
                        // Check if user doesn't have this mentionable role
                        if (!this_member.roles.cache.find(role => role.name == this_game)) {
                            // Get the equivalent role of this game
                            let this_mentionable_role = g_interface.get('guild').roles.cache.find(role => role.name == this_game);
                            // Check if this role exists
                            if (!this_mentionable_role) {
                                // Create role on this guild
                                await g_interface.get('guild').roles.create({
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
                                        name: 'presenceUpdate -> .create(data, reason)',
                                        location: 'index.js',
                                        error: error
                                    });
                                });
                            }
                            // Assign role to this member
                            await this_member.roles.add(this_mentionable_role).catch(error => {
                                g_interface.on_error({
                                    name: 'presenceUpdate -> .add(this_mentionable_role)',
                                    location: 'index.js',
                                    error: error
                                });
                            });
                        }


                        // Check if this role doesn't exists
                        if (!this_voice_role) {
                            // Get reference role
                            let play_role = g_interface.get('guild').roles.cache.find(role => role.name == '<PLAYROLES>');
                            // Create role on this guild
                            await g_interface.get('guild').roles.create({
                                data: {
                                    name: this_vr_name,
                                    color: '0x7b00ff',
                                    mentionable: true,
                                    position: play_role.position,
                                    hoist: true
                                },
                                reason: `A new game is played by (${this_member.user.tag}).`
                            }).then(function (voice_role) {
                                this_voice_role = voice_role;
                            }).catch(error => {
                                g_interface.on_error({
                                    name: 'presenceUpdate -> .create(this_vr_name)',
                                    location: 'index.js',
                                    error: error
                                });
                            });
                        }

                        // Check if user doesn't have this voice room role
                        if (!this_member.roles.cache.find(role => role == this_voice_role)) {
                            // Assign role to this member
                            await this_member.roles.add(this_voice_role).catch(error => {
                                g_interface.on_error({
                                    name: 'presenceUpdate -> .add(this_voice_role)',
                                    location: 'index.js',
                                    error: error
                                });
                            });
                        }
                    }
                } else {
                    // Remove role
                    await this_member.roles.remove(this_voice_role, 'This role is no longer valid.').catch(error => {
                        g_interface.on_error({
                            name: 'presenceUpdate -> .remove(this_voice_role)',
                            location: 'index.js',
                            error: error
                        });
                    });
                    // Check if the role is still in use
                    let role_in_use = false;
                    for (let this_guild_member of g_interface.get('guild').members.cache.array()) {
                        if (this_guild_member.roles.cache.find(role => role == this_voice_role)) {
                            if (this_guild_member.presence.activities.map(activity => activity.name.trim()).includes(this_voice_role.name.substring(vr_prefix.length))) {
                                role_in_use = true;
                            } else {
                                await this_guild_member.roles.remove(this_voice_role, 'This role is no longer valid.').catch(error => {
                                    g_interface.on_error({
                                        name: 'presenceUpdate -> .remove(this_voice_role)',
                                        location: 'index.js',
                                        error: error
                                    });
                                });
                            }
                        }
                    }
                    if (!role_in_use && this_voice_role) {
                        await this_voice_role.delete('This role is no longer in use.').catch(error => {
                            g_interface.on_error({
                                name: 'presenceUpdate -> .delete(this_voice_role)',
                                location: 'index.js',
                                error: error
                            });
                        });
                    }
                }
            }
        }
    } catch (error) {
        g_interface.on_error({
            name: 'presenceUpdate',
            location: 'index.js',
            error: error
        });
    }
});

client.on('voiceStateUpdate', (oldState, newState) => {
    let newChannel = newState.channel;
    let oldChannel = oldState.channel;

    if (newChannel) {
        if (newChannel.name.startsWith(vr_prefix) && newChannel.members.size == 0) {
            newChannel.delete('This channel is no longer in use.').catch(error => {
                g_interface.on_error({
                    name: 'voiceStateUpdate -> .delete(newChannel)',
                    location: 'index.js',
                    error: error
                });
            });
        }
    }
    if (oldChannel) {
        if (oldChannel.name.startsWith(vr_prefix) && oldChannel.members.size == 0) {
            oldChannel.delete('This channel is no longer in use.').catch(error => {
                g_interface.on_error({
                    name: 'voiceStateUpdate -> .delete(oldChannel)',
                    location: 'index.js',
                    error: error
                });
            });
        }
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    try {
        if (user.bot) return;
        if (reaction.partial) {
            await reaction.fetch().catch(error => {
                g_interface.on_error({
                    name: 'messageReactionAdd -> .fetch(reaction)',
                    location: 'index.js',
                    error: error
                });
                return;
            });
        }
        let this_message = reaction.message;
        let this_member;
        if (this_message.author.bot) {
            switch (this_message.embeds[0].title) {
                case 'Unlock NSFW Bots and Channel':
                    switch (reaction.emoji.name) {
                        case '🔴':
                            this_member = g_interface.get('guild').members.cache.get(user.id);
                            let this_role = g_interface.get('guild').roles.cache.find(role => role.id == '700481554132107414');
                            if (this_role && !this_member.roles.cache.has(this_role.id)) {
                                await this_member.roles.add(this_role.id).catch(error => {
                                    g_interface.on_error({
                                        name: 'messageReactionAdd -> .add(this_role.id) [case nsfw]',
                                        location: 'index.js',
                                        error: error
                                    });
                                });
                            }
                            break;
                    }
                    break;
                case 'Subscribe to get updated':
                    this_member = g_interface.get('guild').members.cache.get(user.id);
                    let this_role;
                    switch (reaction.emoji.name) {
                        case '1️⃣':
                            this_role = g_interface.get('guild').roles.cache.find(role => role.id == '722645979248984084');
                            break;
                        case '2️⃣':
                            this_role = g_interface.get('guild').roles.cache.find(role => role.id == '722691589813829672');
                            break;
                        case '3️⃣':
                            this_role = g_interface.get('guild').roles.cache.find(role => role.id == '722691679542312970');
                            break;
                        case '4️⃣':
                            this_role = g_interface.get('guild').roles.cache.find(role => role.id == '722691724572491776');
                            break;
                        case '5️⃣':
                            this_role = g_interface.get('guild').roles.cache.find(role => role.id == '750517524738605087');
                            break;
                    }
                    if (this_role && !this_member.roles.cache.has(this_role.id)) {
                        await this_member.roles.add(this_role.id).catch(error => {
                            g_interface.on_error({
                                name: 'messageReactionAdd -> .add(this_role.id) [case subscribe]',
                                location: 'index.js',
                                error: error
                            });
                        });
                    }
                    break;
                case 'Quarantine Gaming Member Approval':
                    this_member = this_guild.members.cache.find(member => member.user.tag == this_message.embeds[0].author.name);
                    switch (reaction.emoji.name) {
                        case '✅':
                            if (this_member && !this_member.roles.cache.has('722699433225224233')) {
                                await this_member.roles.add('722699433225224233').then(async () => {
                                    await this_message.reactions.removeAll().then(async message => {
                                        let final = message.embeds[0]
                                            .spliceFields(2, 1)
                                            .addField('Action Taken:', 'Approved ✅');
                                        await message.edit(final).catch(error => {
                                            g_interface.on_error({
                                                name: 'messageReactionAdd -> .edit(final) [case approve]',
                                                location: 'index.js',
                                                error: error
                                            });
                                        });
                                    }).catch(error => {
                                        g_interface.on_error({
                                            name: 'messageReactionAdd -> .removeAll(reactions) [case approve]',
                                            location: 'index.js',
                                            error: error
                                        });
                                    });
                                }).catch(error => {
                                    g_interface.on_error({
                                        name: 'messageReactionAdd -> .add(722699433225224233) [case approve]',
                                        location: 'index.js',
                                        error: error
                                    });
                                });
                            }
                            break;
                        case '❌':
                            if (this_member) await this_member.kick().then(async () => {
                                await this_message.reactions.removeAll().then(async message => {
                                    let final = message.embeds[0]
                                        .spliceFields(2, 1)
                                        .addField('Action Taken:', 'Kicked ❌');
                                    await message.edit(final).catch(error => {
                                        g_interface.on_error({
                                            name: 'messageReactionAdd -> .edit(final) [case kick]',
                                            location: 'index.js',
                                            error: error
                                        });
                                    });
                                }).catch(error => {
                                    g_interface.on_error({
                                        name: 'messageReactionAdd -> .removeAll(reactions) [case kick]',
                                        location: 'index.js',
                                        error: error
                                    });
                                });
                            }).catch(error => {
                                g_interface.on_error({
                                    name: 'messageReactionAdd -> .kick(this_member) [case kick]',
                                    location: 'index.js',
                                    error: error
                                });
                            })
                            break;
                        case '⛔':
                            if (this_member) await this_member.ban().then(async () => {
                                await this_message.reactions.removeAll().then(async message => {
                                    let final = message.embeds[0]
                                        .spliceFields(2, 1)
                                        .addField('Action Taken:', 'Banned ⛔');
                                    await message.edit(final).catch(error => {
                                        g_interface.on_error({
                                            name: 'messageReactionAdd -> .edit(final) [case ban]',
                                            location: 'index.js',
                                            error: error
                                        });
                                    });
                                }).catch(error => {
                                    g_interface.on_error({
                                        name: 'messageReactionAdd -> .removeAll(reaction) [case ban]',
                                        location: 'index.js',
                                        error: error
                                    });
                                });
                            }).catch(error => {
                                g_interface.on_error({
                                    name: 'messageReactionAdd -> .ban(this_member) [case ban]',
                                    location: 'index.js',
                                    error: error
                                });
                            })
                            break;
                    }
                    break;
            }
        }
    } catch (error) {
        g_interface.on_error({
            name: 'messageReactionAdd',
            location: 'index.js',
            error: error
        });
    }
});

client.on('messageReactionRemove', async (reaction, user) => {
    try {
        if (user.bot) return;
        if (reaction.partial) {
            await reaction.fetch().catch(error => {
                g_interface.on_error({
                    name: 'messageReactionRemove -> .fetch(reaction)',
                    location: 'index.js',
                    error: error
                });
                return;
            });
        }
        if (reaction.message.author.bot) {
            switch (reaction.message.embeds[0].title) {
                case 'Unlock NSFW Bots and Channel':
                    switch (reaction.emoji.name) {
                        case '🔴':
                            let this_member = g_interface.get('guild').members.cache.get(user.id);
                            let this_role = g_interface.get('guild').roles.cache.find(role => role.id == '700481554132107414');
                            if (this_role && this_member.roles.cache.has(this_role.id)) {
                                await this_member.roles.remove(this_role.id).catch(error => {
                                    g_interface.on_error({
                                        name: 'messageReactionRemove -> .remove(this_role.id) [case nsfw]',
                                        location: 'index.js',
                                        error: error
                                    });
                                });
                            }
                            break;
                    }
                    break;
                case 'Subscribe to get updated':
                    let this_member = g_interface.get('guild').members.cache.get(user.id);
                    let this_role;
                    switch (reaction.emoji.name) {
                        case '1️⃣':
                            this_role = g_interface.get('guild').roles.cache.find(role => role.id == '722645979248984084');
                            break;
                        case '2️⃣':
                            this_role = g_interface.get('guild').roles.cache.find(role => role.id == '722691589813829672');
                            break;
                        case '3️⃣':
                            this_role = g_interface.get('guild').roles.cache.find(role => role.id == '722691679542312970');
                            break;
                        case '4️⃣':
                            this_role = g_interface.get('guild').roles.cache.find(role => role.id == '722691724572491776');
                            break;
                        case '5️⃣':
                            this_role = g_interface.get('guild').roles.cache.find(role => role.id == '750517524738605087');
                            break;
                    }
                    if (this_role && this_member.roles.cache.has(this_role.id)) {
                        await this_member.roles.remove(this_role.id).catch(error => {
                            g_interface.on_error({
                                name: 'messageReactionRemove -> .remove(this_role.id) [case subscribe]',
                                location: 'index.js',
                                error: error
                            });
                        });
                    }
                    break;
            }
        }
    } catch (error) {
        g_interface.on_error({
            name: 'messageReactionRemove',
            location: 'index.js',
            error: error
        });
    }
});

client.on('error', error => {
    console.log(error);
    g_interface.on_error({
        name: 'client error',
        location: 'index.js',
        error: error
    });
});

client.login(process.env.BOT_TOKEN);