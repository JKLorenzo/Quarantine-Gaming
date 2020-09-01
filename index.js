const { CommandoClient } = require('discord.js-commando');
const path = require('path');
const { MessageEmbed } = require('discord.js');
const db = require(path.join(__dirname, 'internal_commands', 'database.js'));
const interface = require(path.join(__dirname, 'internal_commands', 'interface.js'))
const feed = require(path.join(__dirname, 'internal_commands', 'feed.js'))

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
    await db.init(client);
    await feed.start();

    // Remove unused play roles
    let this_guild = client.guilds.cache.get('351178660725915649');
    for (let this_role of this_guild.roles.cache.array()) {
        if (this_role.name.startsWith(vr_prefix)) {
            // Check if the role is still in use
            let role_in_use = false;
            for (let this_member of this_guild.members.cache.array()) {
                if (this_member.roles.cache.find(role => role == this_role)) {
                    if (this_member.presence.activities.map(activity => activity.name.trim()).includes(this_role.name.substring(vr_prefix.length))) {
                        role_in_use = true;
                    } else {
                        await this_member.roles.remove(this_role, 'This role is no longer valid.').catch(console.error);
                    }
                }
            }
            if (!role_in_use) {
                await this_role.delete('This role is no longer in use.').catch(console.error);
            }
        }
    }

    // Remove empty play channels
    for (let this_channel of this_guild.channels.cache.array()) {
        if (this_channel.type == 'voice' && this_channel.name.startsWith(vr_prefix)) {
            if (this_channel.members.size == 0) {
                await this_channel.delete('This channel is no longer in use.').catch(console.error);
            }
        }
    }
});

// Audit logs
client.on('channelCreate', channel => {
    try {
        let this_channel = client.guilds.cache.get('351178660725915649').channels.cache.get(channel.id);

        let description = new Array();
        description.push(`**Name**: ${this_channel.name}`);
        if (this_channel.parent.name) description.push(`**Category**: ${this_channel.parent.name}`);

        description.push(` `);

        for (let overwrite of this_channel.permissionOverwrites) {
            description.push(`**Permission override for ${this_channel.guild.roles.cache.get(overwrite[0])}:**`)
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
        let embed = new MessageEmbed()
            .setAuthor(`channelCreate`)
            .setTitle(`Index.js Error`)
            .setDescription(`An error occured while performing channelCreate function on index.js.`)
            .addField('Error Message', error)
            .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Antu_dialog-error.svg/1024px-Antu_dialog-error.svg.png')
            .setColor('#FF0000');

        g_interface.log(embed);
        console.log(`An error occured while performing channelCreate function on index.js.`);
        console.log(`\n${error}\n`);
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
        let embed = new MessageEmbed()
            .setAuthor(`channelDelete`)
            .setTitle(`Index.js Error`)
            .setDescription(`An error occured while performing channelDelete function on index.js.`)
            .addField('Error Message', error)
            .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Antu_dialog-error.svg/1024px-Antu_dialog-error.svg.png')
            .setColor('#FF0000');

        g_interface.log(embed);
        console.log(`An error occured while performing channelDelete function on index.js.`);
        console.log(`\n${error}\n`);
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
            if (description.length > 0) description.push(' ');
            description.push(`**Role**`);
            let added = new Array(), removed = new Array();
            for (let this_role of newMember.roles.cache.difference(oldMember.roles.cache).array()) {
                if (newMember.roles.cache.has(this_role.id)) {
                    added.push(this_role);
                } else {
                    removed.push(this_role);
                }
            }
            if (added.length > 0) description.push(`Added: ${added.join(', ')}`);
            if (removed.length > 0) description.push(`Removed: ${removed.join(', ')}`);
        }

        embed.setDescription(description.join('\n'));
        embed.setFooter(`${newMember.user.tag} (${newMember.user.id})`);
        embed.setTimestamp(new Date());
        embed.setColor('#6464ff');
        g_interface.log(embed);
    } catch (error) {
        let embed = new MessageEmbed()
            .setAuthor(`guildMemberUpdate`)
            .setTitle(`Index.js Error`)
            .setDescription(`An error occured while performing guildMemberUpdate function on index.js.`)
            .addField('Error Message', error)
            .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Antu_dialog-error.svg/1024px-Antu_dialog-error.svg.png')
            .setColor('#FF0000');

        g_interface.log(embed);
        console.log(`An error occured while performing guildMemberUpdate function on index.js.`);
        console.log(`\n${error}\n`);
    }
});

client.on('presenceUpdate', async (oldMember, newMember) => {
    try {
        // Skip Offline Online Event
        if (!oldMember || !newMember) return;
        let this_member = newMember.member;

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

        let oldA = oldMember.activities.map(activity => activity.name);
        let newA = newMember.activities.map(activity => activity.name);
        let diff = array_difference(oldA, newA);

        for (let this_activity_name of diff) {
            let newActivity = newMember.activities.find(activity => activity.name == this_activity_name);
            let oldActivity = oldMember.activities.find(activity => activity.name == this_activity_name);
            let this_activity = newActivity ? newActivity : oldActivity;
            let this_game = this_activity.name.trim();
            let this_vr_name = vr_prefix + this_game;
            let this_voice_role = this_member.guild.roles.cache.find(role => role.name == this_vr_name);

            if (this_activity.type == 'PLAYING') {
                if (newActivity) {
                    // Check if the title of the game is not null and is not one of the ignored titles
                    if (this_game && !ignored_titles.includes(this_game)) {
                        // Check if user doesn't have this mentionable role
                        if (!this_member.roles.cache.find(role => role.name == this_game)) {
                            // Get the equivalent role of this game
                            let this_mentionable_role = this_member.guild.roles.cache.find(role => role.name == this_game);
                            // Check if this role exists
                            if (this_mentionable_role) {
                                // Assign role to this member
                                await this_member.roles.add(this_mentionable_role);
                            } else {
                                // Create role on this guild
                                await this_member.guild.roles.create({
                                    data: {
                                        name: this_game,
                                        color: '0x00ffff',
                                        mentionable: true
                                    },
                                    reason: `A new game is played by (${this_member.user.tag}).`
                                }).then(async function (this_mentionable_role) {
                                    // Assign role to this member
                                    await this_member.roles.add(this_mentionable_role);
                                });
                            }
                        }


                        // Check if this role doesn't exists
                        if (!this_voice_role) {
                            // Get reference role
                            let play_role = this_member.guild.roles.cache.find(role => role.name == '<PLAYROLES>');
                            // Create role on this guild
                            await this_member.guild.roles.create({
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
                            });
                        }

                        // Check if user doesn't have this voice room role
                        if (!this_member.roles.cache.find(role => role == this_voice_role)) {
                            // Assign role to this member
                            await this_member.roles.add(this_voice_role);
                        }
                    }
                } else {
                    // Remove role
                    await this_member.roles.remove(this_voice_role, 'This role is no longer valid.').catch(console.error);
                    // Check if the role is still in use
                    let role_in_use = false;
                    for (let this_guild_member of this_member.guild.members.cache.array()) {
                        if (this_guild_member.roles.cache.find(role => role == this_voice_role)) {
                            if (this_guild_member.presence.activities.map(activity => activity.name.trim()).includes(this_voice_role.name.substring(vr_prefix.length))) {
                                role_in_use = true;
                            } else {
                                await this_guild_member.roles.remove(this_role, 'This role is no longer valid.').catch(console.error);
                            }
                        }
                    }
                    if (!role_in_use) {
                        await this_voice_role.delete('This role is no longer in use.').catch(console.error);
                    }
                }
            }
        }
    } catch (error) {
        let embed = new MessageEmbed()
            .setAuthor(`presenceUpdate`)
            .setTitle(`Index.js Error`)
            .setDescription(`An error occured while performing presenceUpdate function on index.js.`)
            .addField('Error Message', error)
            .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Antu_dialog-error.svg/1024px-Antu_dialog-error.svg.png')
            .setColor('#FF0000');

        g_interface.log(embed);
        console.log(`An error occured while performing presenceUpdate function on index.js.`);
        console.log(`\n${error}\n`);
    }
});

client.on('voiceStateUpdate', (oldState, newState) => {
    try {
        let newChannel = newState.channel;
        let oldChannel = oldState.channel;

        if (newChannel) {
            if (newChannel.name.startsWith(vr_prefix) && newChannel.members.size == 0) {
                newChannel.delete('This channel is no longer in use.').catch(console.error);
            }
        }
        if (oldChannel) {
            if (oldChannel.name.startsWith(vr_prefix) && oldChannel.members.size == 0) {
                oldChannel.delete('This channel is no longer in use.').catch(console.error);
            }
        }
    } catch (error) {
        let embed = new MessageEmbed()
            .setAuthor(`voiceStateUpdate`)
            .setTitle(`Index.js Error`)
            .setDescription(`An error occured while performing voiceStateUpdate function on index.js.`)
            .addField('Error Message', error)
            .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Antu_dialog-error.svg/1024px-Antu_dialog-error.svg.png')
            .setColor('#FF0000');

        g_interface.log(embed);
        console.log(`An error occured while performing voiceStateUpdate function on index.js.`);
        console.log(`\n${error}\n`);
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    try {
        if (user.bot) return;
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.log('Error while fetching reaction role: ', error);
                return;
            }
        }
        if (reaction.message.author.bot) {
            switch (reaction.message.embeds[0].title) {
                case 'Unlock NSFW Bots and Channel':
                    switch (reaction.emoji.name) {
                        case '🔴':
                            let this_guild = client.guilds.cache.get(reaction.message.guild.id);
                            let this_member = this_guild.members.cache.get(user.id);
                            let this_role = this_guild.roles.cache.find(role => role.id == '700481554132107414');
                            if (this_role && !this_member.roles.cache.has(this_role.id)) {
                                await this_member.roles.add(this_role.id).catch(console.error);
                            }
                            break;
                    }
                    break;
                case 'Get the latest information for your selected subscriptions':
                    let this_guild = client.guilds.cache.get(reaction.message.guild.id);
                    let this_member = this_guild.members.cache.get(user.id);
                    let this_role;
                    switch (reaction.emoji.name) {
                        case '1️⃣':
                            this_role = this_guild.roles.cache.find(role => role.id == '722645979248984084');
                            break;
                        case '2️⃣':
                            this_role = this_guild.roles.cache.find(role => role.id == '722691589813829672');
                            break;
                        case '3️⃣':
                            this_role = this_guild.roles.cache.find(role => role.id == '722691679542312970');
                            break;
                        case '4️⃣':
                            this_role = this_guild.roles.cache.find(role => role.id == '722691724572491776');
                            break;
                    }
                    if (this_role && !this_member.roles.cache.has(this_role.id)) {
                        await this_member.roles.add(this_role.id).catch(console.error);
                    }
                    break;
            }
        }
    } catch (error) {
        let embed = new MessageEmbed()
            .setAuthor(`messageReactionAdd`)
            .setTitle(`Index.js Error`)
            .setDescription(`An error occured while performing messageReactionAdd function on index.js.`)
            .addField('Error Message', error)
            .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Antu_dialog-error.svg/1024px-Antu_dialog-error.svg.png')
            .setColor('#FF0000');

        g_interface.log(embed);
        console.log(`An error occured while performing messageReactionAdd function on index.js.`);
        console.log(`\n${error}\n`);
    }
});

client.on('messageReactionRemove', async (reaction, user) => {
    try {
        if (user.bot) return;
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.log('Error while fetching reaction role: ', error);
                return;
            }
        }
        if (reaction.message.author.bot) {
            switch (reaction.message.embeds[0].title) {
                case 'Unlock NSFW Bots and Channel':
                    switch (reaction.emoji.name) {
                        case '🔴':
                            let this_guild = client.guilds.cache.get(reaction.message.guild.id);
                            let this_member = this_guild.members.cache.get(user.id);
                            let this_role = this_guild.roles.cache.find(role => role.id == '700481554132107414');
                            if (this_role && this_member.roles.cache.has(this_role.id)) {
                                await this_member.roles.remove(this_role.id).catch(console.error);
                            }
                            break;
                    }
                    break;
                case 'Get the latest information for your selected subscriptions':
                    let this_guild = client.guilds.cache.get(reaction.message.guild.id);
                    let this_member = this_guild.members.cache.get(user.id);
                    let this_role;
                    switch (reaction.emoji.name) {
                        case '1️⃣':
                            this_role = this_guild.roles.cache.find(role => role.id == '722645979248984084');
                            break;
                        case '2️⃣':
                            this_role = this_guild.roles.cache.find(role => role.id == '722691589813829672');
                            break;
                        case '3️⃣':
                            this_role = this_guild.roles.cache.find(role => role.id == '722691679542312970');
                            break;
                        case '4️⃣':
                            this_role = this_guild.roles.cache.find(role => role.id == '722691724572491776');
                            break;
                    }
                    if (this_role && this_member.roles.cache.has(this_role.id)) {
                        await this_member.roles.remove(this_role.id).catch(console.error);
                    }
                    break;
            }
        }
    } catch (error) {
        let embed = new MessageEmbed()
            .setAuthor(`messageReactionRemove`)
            .setTitle(`Index.js Error`)
            .setDescription(`An error occured while performing messageReactionRemove function on index.js.`)
            .addField('Error Message', error)
            .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Antu_dialog-error.svg/1024px-Antu_dialog-error.svg.png')
            .setColor('#FF0000');

        g_interface.log(embed);
        console.log(`An error occured while performing messageReactionRemove function on index.js.`);
        console.log(`\n${error}\n`);
    }
})

client.on('error', console.error);

client.login(process.env.BOT_TOKEN);