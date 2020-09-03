const { CommandoClient } = require('discord.js-commando');
const path = require('path');
const { MessageEmbed } = require('discord.js');
const db = require(path.join(__dirname, 'internal_commands', 'database.js'));
const interface = require(path.join(__dirname, 'internal_commands', 'interface.js'));
const feed = require(path.join(__dirname, 'internal_commands', 'feed.js'));
const fgu = require(path.join(__dirname, 'internal_commands', 'fgu.js'));
const dynamic_roles = require(path.join(__dirname, 'internal_commands', 'dynamic_roles.js'));
const dynamic_channels = require(path.join(__dirname, 'internal_commands', 'dynamic_channels.js'));

// Global Variables
global.g_vrprefix = 'Play ';
global.g_ignored_titles = [
    'StartupWindow', 'Error', 'modlauncher', 'BlueStacks', 'NoxPlayer', 'Wallpaper Engine'
];
global.rootDir = path.resolve(__dirname);
global.g_db = db;
global.g_fgu = fgu;
global.g_interface = interface;

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
        commandState: false
    })
    .registerCommandsIn(path.join(__dirname, 'commands'));

client.once('ready', async () => {
    console.log('-------------{  Startup  }-------------');
    interface.init(client);
    db.init(client);
    fgu.init(client);
    feed.init(client);
    dynamic_roles.init(client);
    dynamic_channels.init(client);

    // Set the bot's activity
    client.user.setActivity('!help', {
        type: 'LISTENING'
    });
    interface.log('-------------{  Startup  }-------------');
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
        // Display Name
        if (newMember.displayName != oldMember.displayName) {
            if (description.length > 0) description.push(' ');
            description.push(`**Display Name**`);
            description.push(`Old: ${oldMember.displayName}`);
            description.push(`New: ${newMember.displayName}`);
        }

        // Role
        if (newMember.roles.cache.size != oldMember.roles.cache.size) {
            let added = new Array(), removed = new Array();
            for (let this_role of newMember.roles.cache.difference(oldMember.roles.cache).array()) {
                if (!this_role.name.startsWith(g_vrprefix)) {
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

client.on('presenceUpdate', (oldData, newData) => {
    dynamic_roles.update(oldData, newData);
});

client.on('voiceStateUpdate', (oldState, newState) => {
    let newChannel = newState.channel;
    let oldChannel = oldState.channel;

    if (newChannel) {
        if (newChannel.name.startsWith(g_vrprefix) && newChannel.members.size == 0) {
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
        if (oldChannel.name.startsWith(g_vrprefix) && oldChannel.members.size == 0) {
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

client.on('userUpdate', (oldUser, newUser) => {
    try {
        let embed = new MessageEmbed();
        embed.setAuthor(newUser.username, oldUser.displayAvatarURL());
        embed.setTitle('User Update');

        let description = new Array();
        // Avatar
        if (oldUser.displayAvatarURL() != newUser.displayAvatarURL()) {
            description.push(`**Avatar**`);
            description.push(`New: [Avatar Link](${newUser.displayAvatarURL()})`);
            embed.setThumbnail(newUser.displayAvatarURL());
        }

        // Username
        if (oldUser.username != newUser.username) {
            if (description.length > 0) description.push(' ');
            description.push(`**Username**`);
            description.push(`Old: ${oldUser.username}`);
            description.push(`New: ${newUser.username}`);
        }

        embed.setDescription(description.join('\n'));
        embed.setFooter(`${newUser.tag} (${newUser.id})`);
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
})

client.login(process.env.BOT_TOKEN);