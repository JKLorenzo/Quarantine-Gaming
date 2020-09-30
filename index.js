const { CommandoClient } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');
const path = require('path');
const db = require(path.join(__dirname, 'internal_commands', 'database.js'));
const interface = require(path.join(__dirname, 'internal_commands', 'interface.js'));
const feed = require(path.join(__dirname, 'internal_commands', 'feed.js'));
const fgu = require(path.join(__dirname, 'internal_commands', 'fgu.js'));
const coordinator = require(path.join(__dirname, 'internal_commands', 'coordinator.js'));
const dynamic_roles = require(path.join(__dirname, 'internal_commands', 'dynamic_roles.js'));
const dynamic_channels = require(path.join(__dirname, 'internal_commands', 'dynamic_channels.js'));
const message_manager = require(path.join(__dirname, 'internal_commands', 'message_manager.js'));

const client = new CommandoClient({
    commandPrefix: '!',
    owner: '393013053488103435',
    partials: [
        'MESSAGE', 'REACTION'
    ]
});

// Global Variables
global.g_vrprefix = 'Play ';
global.g_ignored_titles = [
    'StartupWindow', 'Error', 'modlauncher', 'BlueStacks', 'NoxPlayer', 'Wallpaper Engine', 'Mozilla Firefox'
];
global.rootDir = path.resolve(__dirname);
global.g_db = db;
global.g_fgu = fgu;
global.g_interface = interface;
global.g_client = client;

// Variables
let updating = false;


client.registry
    .registerDefaultTypes()
    .registerGroups([
        ['management', 'Server Management'],
        ['services', 'Server Services'],
        ['experience', 'Game Experience Extensions']
    ])
    .registerDefaultGroups()
    .registerDefaultCommands({
        eval: false,
        ping: false,
        prefix: false,
        commandState: false
    })
    .registerCommandsIn(path.join(__dirname, 'commands'));

client.once('ready', () => {
    console.log('-------------{  Startup  }-------------');
    g_interface.init();

    if (process.env.STARTUP_REASON) {
        let embed = new MessageEmbed();
        embed.setColor('#ffff00');
        embed.setAuthor('Quarantine Gaming', client.user.displayAvatarURL());
        embed.setTitle('Startup Initiated');
        embed.addField('Reason', process.env.STARTUP_REASON);
        g_interface.log(embed);
    }

    feed.init()
    dynamic_roles.init();
    dynamic_channels.init();

    // Set the bot's activity
    client.user.setActivity('!help', {
        type: 'LISTENING'
    });
});

client.on('message', async message => {
    message_manager.manage(message);
});

client.on('userUpdate', (oldUser, newUser) => {
    try {
        let embed = new MessageEmbed();
        let this_member = g_interface.vars().guild.members.cache.find(member => member.user.tag == newUser.tag);
        embed.setAuthor(this_member.displayName, oldUser.displayAvatarURL());
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
            name: 'userUpdate',
            location: 'index.js',
            error: error
        });
    }
});

client.on('guildMemberUpdate', (oldMember, newMember) => {
    try {
        let embed = new MessageEmbed();
        embed.setAuthor(newMember.displayName, newMember.user.displayAvatarURL());
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
                if (!this_role.name.startsWith(g_vrprefix) && !this_role.name.startsWith('Text')) {
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
    let this_member = g_interface.vars().guild.members.cache.get(member.id);

    if (this_member && !this_member.user.bot) {
        if (!this_member.roles.cache.find(role => role.id == '722699433225224233')) {
            let today = new Date();
            let diffMs = (today - this_member.user.createdAt);
            let diffDays = Math.floor(diffMs / 86400000)
            let diffHrs = Math.floor((diffMs % 86400000) / 3600000)
            let diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);
            let created_on = diffDays + " days " + diffHrs + " hours " + diffMins + " minutes";

            let embed = new MessageEmbed
            embed.setAuthor('Quarantine Gaming: Member Approval');
            embed.setTitle('Member Details');
            embed.setThumbnail(this_member.user.displayAvatarURL());
            embed.addFields([
                { name: 'User:', value: this_member },
                { name: 'ID:', value: this_member.id },
                { name: 'Account Created:', value: created_on },
                { name: 'Moderation:', value: '✅ - Approve     ❌ - Kick     ⛔ - Ban' }
            ]);
            embed.setColor('#25c059');
            await g_interface.vars().staff.send({ content: '<@&749235255944413234> action is required.', embed: embed }).then(async this_message => {
                await this_message.react('✅');
                await this_message.react('❌');
                await this_message.react('⛔');
            });
            let dm = new Array();
            dm.push(`Hi ${member.user.username}, and welcome to **Quarantine Gaming**!`);
            dm.push('Please wait while our staff is processing your membership approval.');
            g_interface.dm(member, dm.join('\n'));
        }
    }
});

client.on('presenceUpdate', (oldData, newData) => {
    dynamic_roles.update(oldData, newData);
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    dynamic_channels.update(oldState, newState);
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
        if (this_message.author.id == client.user.id) {
            switch (this_message.embeds[0].author.name) {
                case 'Quarantine Gaming: NSFW Content':
                    switch (reaction.emoji.name) {
                        case '🔴':
                            this_member = g_interface.vars().guild.members.cache.get(user.id);
                            let this_role = g_interface.vars().guild.roles.cache.find(role => role.id == '700481554132107414');
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
                case 'Quarantine Gaming: Free Game Updates':
                    this_member = g_interface.vars().guild.members.cache.get(user.id);
                    let this_role;
                    switch (reaction.emoji.name) {
                        case '1️⃣':
                            this_role = g_interface.vars().guild.roles.cache.find(role => role.id == '722645979248984084');
                            break;
                        case '2️⃣':
                            this_role = g_interface.vars().guild.roles.cache.find(role => role.id == '722691589813829672');
                            break;
                        case '3️⃣':
                            this_role = g_interface.vars().guild.roles.cache.find(role => role.id == '722691679542312970');
                            break;
                        case '4️⃣':
                            this_role = g_interface.vars().guild.roles.cache.find(role => role.id == '722691724572491776');
                            break;
                        case '5️⃣':
                            this_role = g_interface.vars().guild.roles.cache.find(role => role.id == '750517524738605087');
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
                case 'Quarantine Gaming: Member Approval':
                    this_member = g_interface.vars().guild.members.cache.find(member => member.user.id == this_message.embeds[0].fields[1].value);
                    if (this_member) {
                        switch (reaction.emoji.name) {
                            case '✅':
                                if (!this_member.roles.cache.has('722699433225224233')) {
                                    await this_member.roles.add('722699433225224233').then(async () => {
                                        await this_message.reactions.removeAll().then(async message => {
                                            let final = message.embeds[0]
                                                .spliceFields(3, 1)
                                                .addFields(
                                                    { name: 'Action Taken:', value: 'Approved ✅' },
                                                    { name: 'Moderator:', value: user },
                                                ).setTimestamp();
                                            await message.edit(final).catch(error => {
                                                g_interface.on_error({
                                                    name: 'messageReactionAdd -> .edit(final) [case approve]',
                                                    location: 'index.js',
                                                    error: error
                                                });
                                            });
                                            let dm_msg = [
                                                `Hooraaay! 🥳 Your membership request has been approved! You will now have access to all features of this server!`,
                                                `Do *!help* on our #general🔗 text channel to know more about these features.`,
                                                `Thank you for joining **Quarantine Gaming**! Game On!`
                                            ]
                                            g_interface.dm(this_member, dm_msg.join('\n'));
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
                                await this_member.kick().then(async () => {
                                    await this_message.reactions.removeAll().then(async message => {
                                        let final = message.embeds[0]
                                            .spliceFields(3, 1)
                                            .addFields(
                                                { name: 'Action Taken:', value: 'Kicked ❌' },
                                                { name: 'Moderator:', value: user },
                                            ).setTimestamp();
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
                                await this_member.ban().then(async () => {
                                    await this_message.reactions.removeAll().then(async message => {
                                        let final = message.embeds[0]
                                            .spliceFields(3, 1)
                                            .addFields(
                                                { name: 'Action Taken:', value: 'Banned ⛔' },
                                                { name: 'Moderator:', value: user },
                                            ).setTimestamp();
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
                    } else {
                        await this_message.reactions.removeAll().then(async message => {
                            let final = message.embeds[0]
                                .spliceFields(3, 1)
                                .addFields(
                                    { name: 'Action Taken:', value: 'None. User not found ⚠' },
                                    { name: 'Moderator:', value: user },
                                ).setTimestamp();
                            await message.edit(final).catch(error => {
                                g_interface.on_error({
                                    name: 'messageReactionAdd -> .edit(final) [case none]',
                                    location: 'index.js',
                                    error: error
                                });
                            });
                        }).catch(error => {
                            g_interface.on_error({
                                name: 'messageReactionAdd -> .removeAll(reaction) [case none]',
                                location: 'index.js',
                                error: error
                            });
                        });
                    }
                    break;
                case 'Quarantine Gaming: Experience':
                    if (!updating) {
                        updating = true;
                        switch (this_message.embeds[0].title) {
                            case 'Among Us':
                                // Delete reactions
                                await this_message.reactions.removeAll().then(async message => {
                                    let this_channel = g_interface.vars().guild.members.cache.get(user.id).voice.channel;
                                    if (this_channel) {
                                        // Get members
                                        let channel_members = new Array();
                                        for (let this_entry of this_channel.members) {
                                            channel_members.push(this_entry[1]);
                                        }

                                        // Get reaction effect
                                        let effect = false;
                                        switch (reaction.emoji.name) {
                                            case '🟠':
                                                effect = true;
                                                break;
                                            case '🟢':
                                                effect = false;
                                                break;
                                        }

                                        // Notify voice channel
                                        await g_interface.say(effect ? 'Muting in 5 seconds' : 'Unmuting', this_channel).catch(error => {
                                            g_interface.on_error({
                                                name: 'messageReactionAdd -> .say() [among us]',
                                                location: 'index.js',
                                                error: error
                                            });
                                        });

                                        // Sleep
                                        if (effect) await g_interface.sleep(5000);

                                        // Apply reaction effect
                                        for (let this_channel_member of channel_members) {
                                            if (!this_channel_member.user.bot) {
                                                await this_channel_member.voice.setMute(effect).catch(error => {
                                                    g_interface.on_error({
                                                        name: `messageReactionAdd -> .setMute(${this_channel_member}) [among us]`,
                                                        location: 'index.js',
                                                        error: error
                                                    });
                                                });
                                            }
                                        }

                                        // Add reactions
                                        let reactions = new Array();
                                        reactions.push('🟠');
                                        reactions.push('🟢');
                                        for (let this_reaction of reactions) {
                                            await message.react(this_reaction).catch(error => {
                                                g_interface.on_error({
                                                    name: 'messageReactionAdd -> .react(this_reaction) [among us]',
                                                    location: 'index.js',
                                                    error: error
                                                });
                                            });
                                        }
                                    }
                                }).catch(error => {
                                    g_interface.on_error({
                                        name: 'messageReactionAdd -> .removeAll(reaction) [among us]',
                                        location: 'index.js',
                                        error: error
                                    });
                                });
                                break;
                        }
                        updating = false;
                    }
                    break;
                case 'Quarantine Gaming: Game Coordinator':
                    let this_reaction = this_message.reactions.cache.find(reaction => reaction.me);
                    if (this_reaction && reaction.emoji.name == this_reaction.emoji.name && !(this_message.embeds[0].description.indexOf(user.id) !== -1)) {
                        coordinator.queue({
                            status: 1,
                            message: this_message,
                            member: g_interface.vars().guild.members.cache.get(user.id)
                        });
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
        let this_message = reaction.message;
        let this_member;
        if (this_message.author.id == client.user.id) {
            switch (this_message.embeds[0].author.name) {
                case 'Quarantine Gaming: NSFW Content':
                    switch (reaction.emoji.name) {
                        case '🔴':
                            this_member = g_interface.vars().guild.members.cache.get(user.id);
                            let this_role = g_interface.vars().guild.roles.cache.find(role => role.id == '700481554132107414');
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
                case 'Quarantine Gaming: Free Game Updates':
                    this_member = g_interface.vars().guild.members.cache.get(user.id);
                    let this_role;
                    switch (reaction.emoji.name) {
                        case '1️⃣':
                            this_role = g_interface.vars().guild.roles.cache.find(role => role.id == '722645979248984084');
                            break;
                        case '2️⃣':
                            this_role = g_interface.vars().guild.roles.cache.find(role => role.id == '722691589813829672');
                            break;
                        case '3️⃣':
                            this_role = g_interface.vars().guild.roles.cache.find(role => role.id == '722691679542312970');
                            break;
                        case '4️⃣':
                            this_role = g_interface.vars().guild.roles.cache.find(role => role.id == '722691724572491776');
                            break;
                        case '5️⃣':
                            this_role = g_interface.vars().guild.roles.cache.find(role => role.id == '750517524738605087');
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
                case 'Quarantine Gaming: Game Coordinator':
                    let this_reaction = this_message.reactions.cache.find(reaction => reaction.me);
                    if (this_reaction && reaction.emoji.name == this_reaction.emoji.name && !(this_message.embeds[0].description.indexOf(user.id) !== -1)) {
                        coordinator.queue({
                            status: 0,
                            message: this_message,
                            member: g_interface.vars().guild.members.cache.get(user.id)
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