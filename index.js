const { CommandoClient } = require('discord.js-commando');
const Discord = require('discord.js');
const path = require('path');
const app = require('./modules/app.js');
const channel_manager = require('./modules/channel_manager.js');
const classes = require('./modules/classes.js');
const constants = require('./modules/constants.js');
const database = require('./modules/database.js');
const error_manager = require('./modules/error_manager.js');
const functions = require('./modules/functions.js');
const general = require('./modules/general.js');
const message_manager = require('./modules/message_manager.js');
const reaction_manager = require('./modules/reaction_manager.js');
const role_manager = require('./modules/role_manager.js');
const speech = require('./modules/speech.js');

const ErrorTicketManager = new classes.ErrorTicketManager('index.js');

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

function Modules() {
    return {
        app: app,
        channel_manager: channel_manager,
        database: database,
        error_manager: error_manager,
        general: general,
        message_manager: message_manager,
        reaction_manager: reaction_manager,
        role_manager: role_manager,
        speech: speech
    }
}

global.GlobalModules = Modules;

client.once('ready', async () => {
    console.log('Startup');
    channel_manager.initialize(Modules);
    await database.initialize(Modules);
    general.initialize(Modules);
    message_manager.initialize(Modules);
    reaction_manager.initialize(Modules);
    role_manager.initialize(Modules);
    speech.initialize(Modules);
    error_manager.initialize(Modules);
    await app.initialize(client, Modules);
});

client.on('message', (incoming_message) => {
    if (app.isInitialized()) {
        message_manager.process(incoming_message);
    }
});

client.on('userUpdate', async (oldUser, newUser) => {
    try {
        if (app.isInitialized()) {
            const embed = new Discord.MessageEmbed();
            const member = app.member(newUser);
            embed.setAuthor(member.displayName, oldUser.displayAvatarURL());
            embed.setTitle('User Update');

            const description = new Array();
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
            embed.setTimestamp();
            embed.setColor('#6464ff');
            if (description.length > 0) await message_manager.sendToChannel(constants.channels.qg.logs, embed);
        }
    } catch (error) {
        error_manager.mark(ErrorTicketManager.create('userUpdate', error));
    }
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    try {
        const embed = new Discord.MessageEmbed();
        embed.setAuthor(newMember.displayName, newMember.user.displayAvatarURL());
        embed.setTitle('Guild Member Update');

        const description = new Array();
        // Display Name
        if (newMember.displayName != oldMember.displayName) {
            if (description.length > 0) description.push(' ');
            description.push(`**Display Name**`);
            description.push(`Old: ${oldMember.displayName}`);
            description.push(`New: ${newMember.displayName}`);
        }

        // Role
        if (newMember.roles.cache.size != oldMember.roles.cache.size) {
            const added = new Array(), removed = new Array();
            for (const this_role of newMember.roles.cache.difference(oldMember.roles.cache).array()) {
                if (!this_role.name.startsWith('Play') && !this_role.name.startsWith('Text') && !this_role.name.startsWith('Team') && this_role.id != constants.roles.dedicated && this_role.id != constants.roles.streaming) {
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
        embed.setTimestamp();
        embed.setColor('#6464ff');
        if (description.length > 0) await message_manager.sendToChannel(constants.channels.qg.logs, embed);
    } catch (error) {
        error_manager.mark(ErrorTicketManager.create('guildMemberUpdate', error));
    }
});

client.on('inviteCreate', invite => {
    if (app.isInitialized()) {
        try {
            app.addInvite(invite);

            const embed = new Discord.MessageEmbed();
            embed.setAuthor('Quarantine Gaming: Invites Submanager');
            embed.setTitle('New Invite Created');
            if (invite.inviter) {
                embed.addField('Inviter:', invite.inviter, true);
                embed.setThumbnail(invite.inviter.displayAvatarURL());
            }
            if (invite.targetUser) embed.addField('Target User:', invite.targetUser, true);
            embed.addFields([
                { name: 'Channel:', value: invite.channel, inline: true },
                { name: 'Code:', value: invite.code, inline: true }
            ]);
            if (invite.maxUses) {
                embed.addField('Max Uses:', invite.maxUses, true);
            } else {
                embed.addField('Max Uses:', 'Infinite', true);
            }
            if (invite.expiresTimestamp) {
                embed.setTimestamp(invite.expiresTimestamp);
                embed.setFooter('Expires ');
            } else {
                embed.setFooter('NO EXPIRATION DATE ⚠');
            }
            embed.setColor('#25c081');
            message_manager.sendToChannel(constants.channels.server.management, embed);
        } catch (error) {
            error_manager.mark(ErrorTicketManager.create('inviteCreate', error));
        }
    }
})

client.on('guildMemberAdd', async (this_member) => {
    try {
        if (this_member && !this_member.user.bot && !app.hasRole(this_member, [constants.roles.member])) {
            await general.memberScreening(this_member);
        }
    } catch (error) {
        error_manager.mark(ErrorTicketManager.create('guildMemberAdd', error));
    }
});

client.on('presenceUpdate', (oldPresence, newPresence) => {
    if (app.isInitialized()) {
        try {
            const member = newPresence.member ? newPresence.member : oldPresence.member;
            if (!member.user.bot) {
                if (newPresence.status == 'offline') {
                    general.memberOffline(member);
                }

                // Sort Changed Activities
                let oldActivities = new Array(), newActivities = new Array();
                if (oldPresence) oldActivities = oldPresence.activities.map(activity => activity.name.trim());
                if (newPresence) newActivities = newPresence.activities.map(activity => activity.name.trim());
                const acitivityDifference = functions.compareArray(oldActivities, newActivities).map(activity_name => {
                    if (newActivities.includes(activity_name)) {
                        return {
                            activity: newPresence.activities.find(activity => activity.name.trim() == activity_name),
                            new: true
                        }
                    } else {
                        return {
                            activity: oldPresence.activities.find(activity => activity.name.trim() == activity_name),
                            new: false
                        }
                    }
                });
                for (const data of acitivityDifference) {
                    general.memberActivityUpdate(member, data);
                }
            }
        } catch (error) {
            error_manager.mark(ErrorTicketManager.create('presenceUpdate', error));
        }
    }
});

client.on('voiceStateUpdate', (oldState, newState) => {
    if (app.isInitialized()) {
        try {
            const member = newState.member ? newState.member : oldState.member;
            if (!member.user.bot && oldState.channel != newState.channel) {
                general.memberVoiceUpdate(member, oldState, newState);
            }
        } catch (error) {
            error_manager.mark(ErrorTicketManager.create('voiceStateUpdate', error));
        }
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (app.isInitialized()) {
        try {
            if (reaction.partial) await reaction.fetch();
            if (reaction.message.partial) await reaction.message.fetch();
            const this_message = reaction.message;
            const this_member = app.member(user.id);

            if (this_member && !this_member.user.bot && this_message && this_message.embeds.length > 0 && this_message.author.id == constants.me) {
                reaction_manager.onReactionAdd(this_message, this_message.embeds[0], reaction.emoji, this_member);
            }
        } catch (error) {
            error_manager.mark(ErrorTicketManager.create('messageReactionAdd', error));
        }
    }
});

client.on('messageReactionRemove', async (reaction, user) => {
    if (app.isInitialized()) {
        try {
            if (reaction.partial) await reaction.fetch();
            if (reaction.message.partial) await reaction.message.fetch();
            const this_message = reaction.message;
            const this_member = app.member(user.id);

            if (this_member && !this_member.user.bot && this_message && this_message.embeds.length > 0 && this_message.author.id == constants.me) {
                reaction_manager.onReactionRemove(this_message, this_message.embeds[0], reaction.emoji, this_member);
            }
        } catch (error) {
            error_manager.mark(ErrorTicketManager.create('messageReactionRemove', error));
        }
    }
});

client.on('rateLimit', async (rateLimitInfo) => {
    const embed = new Discord.MessageEmbed();
    embed.setColor('#ffff00');
    embed.setAuthor('Quarantine Gaming: Telemetry');
    embed.setTitle('The client hits a rate limit while making a request.');
    embed.addField('Timeout', rateLimitInfo.timeout);
    embed.addField('Limit', rateLimitInfo.limit);
    embed.addField('Method', rateLimitInfo.method);
    embed.addField('Path', rateLimitInfo.path);
    embed.addField('Route', rateLimitInfo.route);
    await message_manager.sendToChannel(constants.channels.qg.logs, embed);
});

client.on('error', (error) => {
    console.log(error);
    error_manager.mark(ErrorTicketManager.create('error', error));
});

client.login(process.env.BOT_TOKEN);