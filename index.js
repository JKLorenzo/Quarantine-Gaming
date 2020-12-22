const { CommandoClient } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');
const app = require('./modules/app.js');

const client = new CommandoClient({
    commandPrefix: '!',
    owner: '393013053488103435',
    partials: [
        'MESSAGE', 'CHANNEL', 'REACTION'
    ]
});

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
        prefix: false,
        commandState: false
    })
    .registerCommandsIn(path.join(__dirname, 'commands'));

let initialized = false;

client.once('ready', async () => {
    console.log('-------------{  Startup  }-------------');
    initialized = await app.initialize(client);
});

client.on('message', message => message_manager.manage(message));

client.on('userUpdate', (oldUser, newUser) => {
    try {
        let embed = new MessageEmbed();
        let this_member = g_channels.get().guild.members.cache.find(member => member.user.tag == newUser.tag);
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
                if (!this_role.name.startsWith('Play') && !this_role.name.startsWith('Text') && !this_role.name.startsWith('Team') && this_role != g_roles.get().dedicated) {
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
    try {
        let this_member = g_channels.get().guild.members.cache.get(member.id);

        if (this_member && !this_member.user.bot) {
            if (!this_member.roles.cache.find(role => role.id == '722699433225224233')) {
                let dm = new Array();
                dm.push(`Hi ${member.user.username}, and welcome to **Quarantine Gaming**!`);
                dm.push('Please wait while our staff is processing your membership approval.');
                await g_message_manager.dm_member(member, dm.join('\n'));

                let today = new Date();
                let diffMs = (today - this_member.user.createdAt);
                let diffDays = Math.floor(diffMs / 86400000)
                let diffHrs = Math.floor((diffMs % 86400000) / 3600000)
                let diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);
                let created_on = diffDays + " days " + diffHrs + " hours " + diffMins + " minutes";
                let inviters = await g_functions.getInviter();

                let embed = new MessageEmbed
                embed.setAuthor('Quarantine Gaming: Member Approval');
                embed.setTitle('Member Details');
                embed.setThumbnail(this_member.user.displayAvatarURL());
                embed.addFields([
                    { name: 'User:', value: this_member },
                    { name: 'ID:', value: this_member.id },
                    { name: 'Account Created:', value: created_on },
                    { name: 'Inviter:', value: inviters.length > 0 ? inviters.map(this_invite => this_invite.inviter).join(' or ') : 'Not Traced.' },
                    { name: 'Moderation:', value: '✅ - Approve     ❌ - Kick     ⛔ - Ban' }
                ]);
                embed.setColor('#25c059');
                await g_channels.get().staff.send({ content: '<@&749235255944413234> action is required.', embed: embed }).then(async this_message => {
                    await this_message.react('✅');
                    await g_functions.sleep(1500);
                    await this_message.react('❌');
                    await g_functions.sleep(1500);
                    await this_message.react('⛔');
                });
            }
        }
    } catch (error) {
        g_interface.on_error({
            name: 'guildMemberAdd',
            location: 'index.js',
            error: error
        });
    }
});

client.on('presenceUpdate', (oldData, newData) => dynamic_roles.update(oldData, newData));

client.on('voiceStateUpdate', (oldState, newState) => dynamic_channels.update(oldState, newState));

client.on('messageReactionAdd', (reaction, user) => message_manager.reactionAdd(reaction, user));

client.on('messageReactionRemove', (reaction, user) => message_manager.reactionRemove(reaction, user));

client.on('rateLimit', (rateLimitInfo) => {
    let embed = new MessageEmbed();
    embed.setColor('#ffff00');
    embed.setAuthor('Quarantine Gaming: Telemetry');
    embed.setTitle('The client hits a rate limit while making a request.');
    embed.addField('Timeout', rateLimitInfo.timeout);
    embed.addField('Limit', rateLimitInfo.limit);
    embed.addField('Method', rateLimitInfo.method);
    embed.addField('Path', rateLimitInfo.path);
    embed.addField('Route', rateLimitInfo.route);
    g_interface.log(embed);
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