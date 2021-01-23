const { CommandoClient } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');
const path = require('path');
const app = require('./modules/app.js');
const channel_manager = require('./modules/channel_manager.js');
const constants = require('./modules/constants.js');
const database = require('./modules/database.js');
const error_manager = require('./modules/error_manager.js');
const functions = require('./modules/functions.js');
const general = require('./modules/general.js');
const message_manager = require('./modules/message_manager.js');
const reaction_manager = require('./modules/reaction_manager.js');
const role_manager = require('./modules/role_manager.js');
const speech = require('./modules/speech.js');

const error_ticket = error_manager.for('index.js');

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
    message_manager.intialize(Modules);
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
            const embed = new MessageEmbed();
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
        error_manager.mark(new error_ticket('userUpdate', error));
    }
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    try {
        const embed = new MessageEmbed();
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
        error_manager.mark(new error_ticket('guildMemberUpdate', error));
    }
});

client.on('guildMemberAdd', async (this_member) => {
    try {
        if (this_member && !this_member.user.bot) {
            if (!this_member.roles.cache.has(constants.roles.member)) {
                const MessageToSend = new Array();
                MessageToSend.push(`Hi ${member.user.username}, and welcome to **Quarantine Gaming**!`);
                MessageToSend.push(`Please wait while we are processing your membership approval.`);
                await message_manager.sendToUser(this_member, MessageToSend.join('\n'))

                const today = new Date();
                const diffMs = (today - this_member.user.createdAt);
                const diffDays = Math.floor(diffMs / 86400000)
                const diffHrs = Math.floor((diffMs % 86400000) / 3600000)
                const diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);
                const created_on = diffDays + " days " + diffHrs + " hours " + diffMins + " minutes";
                const inviters = await g_functions.getInviter();

                const embed = new MessageEmbed();
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
                const Message = await message_manager.sendToChannel(constants.channels.server.management, {
                    content: `${app.role(constants.roles.staff)} and ${app.role(constants.roles.moderator)} action is required.`,
                    embed: embed
                });
                const reactions = ['✅', '❌', '⛔'];
                for (const emoji of reactions) {
                    await reaction_manager.addReaction(Message, emoji);
                }
            }
        }
    } catch (error) {
        error_manager.mark(new error_ticket('guildMemberAdd', error));
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
            error_manager.mark(new error_ticket('presenceUpdate', error));
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
            error_manager.mark(new error_ticket('voiceStateUpdate', error));
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

            if (this_member && !this_member.user.bot && this_message && this_message.embeds.length > 0) {
                reaction_manager.onReactionAdd(this_message.embeds[0], reaction.emoji, this_member, this_message);
            }
        } catch (error) {
            error_manager.mark(new error_ticket('messageReactionAdd', error));
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

            if (this_member && !this_member.user.bot && this_message && this_message.embeds.length > 0) {
                reaction_manager.onReactionRemove(this_message.embeds[0], reaction.emoji, this_member, this_message);
            }
        } catch (error) {
            error_manager.mark(new error_ticket('messageReactionRemove', error));
        }
    }
});

client.on('rateLimit', async (rateLimitInfo) => {
    const embed = new MessageEmbed();
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
    error_manager.mark(new error_ticket('error', error));
});

client.login(process.env.BOT_TOKEN);