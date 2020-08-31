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

const client = new CommandoClient({
    commandPrefix: 'sudo ',
    owner: '393013053488103435'
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
});

// Audit logs
client.on('channelCreate', channel => {
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
});

client.on('channelDelete', channel => {
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
});

client.on('guildMemberUpdate', (oldMember, newMember) => {
    let embed = new MessageEmbed();
    embed.setAuthor(newMember.user.tag, newMember.user.displayAvatarURL());
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
        for (let this_role of newMember.roles.cache.difference(oldMember.roles.cache).array()){
            if (newMember.roles.cache.has(this_role.id)){
                added.push(this_role);
            } else {
                removed.push(this_role);
            }
        }
        if (added.length > 0) description.push(`Added: ${added.join(', ')}`);
        if (removed.length > 0) description.push(`Removed: ${removed.join(', ')}`);
    }

    embed.setDescription(description.join('\n'));
    embed.setFooter(`${oldMember.user.username} (${oldMember.user.id})`);
    embed.setTimestamp(new Date());
    embed.setColor('#6464ff');
    g_interface.log(embed);
});

client.on('presenceUpdate', (oldMember, newMember) => {
    let this_member = client.guilds.cache.get('351178660725915649').members.cache.get(newMember.user.id);
});

client.on('error', console.error);

client.login(process.env.BOT_TOKEN);