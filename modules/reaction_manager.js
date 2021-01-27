const Discord = require('discord.js');
const constants = require('./constants.js');
const functions = require('./functions.js');
const classes = require('./classes.js');
/** @type {import('./app.js')} */
let app;
/** @type {import('./role_manager.js')} */
let role_manager;
/** @type {import('./error_manager.js')} */
let error_manager;
/** @type {import('./message_manager.js')} */
let message_manager;

const ErrorTicketManager = new classes.ErrorTicketManager('reaction_manager.js');
const ReactionAddManager = new classes.ProcessQueue(1500);
const IncomingReactionManager = new classes.ProcessQueue(500);

/**
 * Initializes the module.
 * @param {Function} ModulesFunction The GlobalModule Function.
 */
module.exports.initialize = (ModulesFunction) => {
    // Link
    const Modules = functions.parseModules(ModulesFunction);
    app = Modules.app;
    role_manager = Modules.role_manager;
    error_manager = Modules.error_manager;
    message_manager = Modules.message_manager;
}

/**
 * Adds a reaction to a message.
 * @param {Discord.Message} message The message object.
 * @param {String} emoji The emoji to use.
 * @returns {Promise<Discord.MessageReaction>} A message reaction promise object
 */
module.exports.addReaction = (message, emoji) => {
    return new Promise(async (resolve, reject) => {
        await ReactionAddManager.queue();
        let output, error;
        try {
            output = await message.react(emoji);
        } catch (err) {
            error = err;
        }
        ReactionAddManager.finish();
        error ? reject(error) : resolve(output);
    });
}

/**
 * Processes all reaction add events and applies appropriate actions.
 * @param {Discord.Message} message The message object.
 * @param {Discord.MessageEmbed} embed The message embed object.
 * @param {Discord.GuildEmoji | Discord.ReactionEmoji} emoji The guild/reaction emoji object.
 * @param {Discord.GuildMember} reactor The guild member object that reacted to this message.
 */
module.exports.onReactionAdd = async (message, embed, emoji, reactor) => {
    console.log(`IncomingReaction: Queueing ${IncomingReactionManager.processID}`);
    await IncomingReactionManager.queue();
    console.log(`IncomingReaction: Started ${IncomingReactionManager.currentID}`);
    try {
        switch (embed.author.name) {
            case 'Quarantine Gaming: NSFW Content':
                switch (emoji.name) {
                    case '🔴':
                        await role_manager.add(reactor, constants.roles.nsfw).catch(error => error_manager.mark(ErrorTicketManager.create('nsfw', error, 'onReactionAdd')));
                        break;
                }
                break;
            case 'Quarantine Gaming: Free Game Updates':
                switch (emoji.name) {
                    case '1️⃣':
                        await role_manager.add(reactor, constants.roles.steam).catch(error => error_manager.mark(ErrorTicketManager.create('steam', error, 'onReactionAdd')));
                        break;
                    case '2️⃣':
                        await role_manager.add(reactor, constants.roles.epic).catch(error => error_manager.mark(ErrorTicketManager.create('epic', error, 'onReactionAdd')));
                        break;
                    case '3️⃣':
                        await role_manager.add(reactor, constants.roles.gog).catch(error => error_manager.mark(ErrorTicketManager.create('gog', error, 'onReactionAdd')));
                        break;
                    case '4️⃣':
                        await role_manager.add(reactor, constants.roles.console).catch(error => error_manager.mark(ErrorTicketManager.create('console', error, 'onReactionAdd')));
                        break;
                    case '5️⃣':
                        await role_manager.add(reactor, constants.roles.ubisoft).catch(error => error_manager.mark(ErrorTicketManager.create('ubisoft', error, 'onReactionAdd')));
                        break;
                }
                break;
            case 'Quarantine Gaming: Member Approval':
                try {
                    // Check if reactor is a staff and approval is still pending
                    if (reactor.roles.cache.has(constants.roles.staff) && embed.fields[4].name != 'Action Taken:') {
                        const this_user = app.member(embed.fields[1].value);
                        let final_embed;
                        if (this_user) {
                            switch (emoji.name) {
                                case '✅':
                                    await role_manager.add(this_user, constants.roles.member).catch(error => error_manager.mark(ErrorTicketManager.create('role_manager.add() [approve]', error, 'onReactionAdd')));
                                    await message.reactions.removeAll().catch(error => error_manager.mark(ErrorTicketManager.create('reactions.removeAll() [approve]', error, 'onReactionAdd')));;
                                    final_embed = embed.spliceFields(4, 1, [
                                        { name: 'Action Taken:', value: `Approved by ${this_member}` }
                                    ]).setTimestamp();
                                    await message.edit(final_embed).catch(error => error_manager.mark(ErrorTicketManager.create('message.edit() [approve]', error, 'onReactionAdd')));
                                    const dm_message = [
                                        `Hooraaay! 🥳 Your membership request has been approved! You will now have access to all the features of this server!`,
                                        "Do `!help` on our " + app.channel(constants.channels.text.general) + " text channel to know more about these features or you can visit <https://quarantinegamingdiscord.wordpress.com/> for more info."
                                    ];
                                    await message_manager.sendToUser(this_user, dm_message.join('\n')).catch(error => error_manager.mark(ErrorTicketManager.create('message_manager.sendToUser() [approve]', error, 'onReactionAdd')));
                                    break;
                                case '❌':
                                    await this_user.kick().catch(error => error_manager.mark(ErrorTicketManager.create('this_user.kick() [kick]', error, 'onReactionAdd')));
                                    await message.reactions.removeAll().catch(error => error_manager.mark(ErrorTicketManager.create('reactions.removeAll() [kick]', error, 'onReactionAdd')));;
                                    final_embed = embed.spliceFields(4, 1, [
                                        { name: 'Action Taken:', value: `Kicked by ${this_member}` }
                                    ]).setTimestamp();
                                    await message.edit(final_embed).catch(error => error_manager.mark(ErrorTicketManager.create('message.edit() [kick]', error, 'onReactionAdd')));;
                                    break;
                                case '⛔':
                                    await this_user.ban().catch(error => error_manager.mark(ErrorTicketManager.create('this_user.ban() [ban]', error, 'onReactionAdd')));
                                    await message.reactions.removeAll().catch(error => error_manager.mark(ErrorTicketManager.create('reactions.removeAll() [ban]', error, 'onReactionAdd')));
                                    final_embed = embed.spliceFields(4, 1, [
                                        { name: 'Action Taken:', value: `Banned by ${this_member}` }
                                    ]).setTimestamp();
                                    await message.edit(final_embed).catch(error => error_manager.mark(ErrorTicketManager.create('message.edit() [ban]', error, 'onReactionAdd')));
                                    break;
                            }
                        } else {
                            await message.reactions.removeAll().catch(error => error_manager.mark(ErrorTicketManager.create('reactions.removeAll() [not found]', error, 'onReactionAdd')));
                            final_embed = embed.spliceFields(4, 1, [
                                { name: 'Action Taken:', value: `None. User not found ⚠. Attempted by ${this_member}` }
                            ]).setTimestamp();
                            await message.edit(final_embed).catch(error => error_manager.mark(ErrorTicketManager.create('message.edit() [not found]', error, 'onReactionAdd')));
                        }
                    }
                } catch (error) {
                    error_manager.mark(ErrorTicketManager.create('Member Approval', error, 'onReactionAdd'));
                }
                break;
            case 'Quarantine Gaming: Experience':
                switch (embed.title) {
                    case 'Audio Control Extension for Voice Channels':
                        try {
                            // Delete reactions
                            await message.reactions.removeAll();
                            const this_channel = app.member(reactor.id).voice.channel;
                            if (this_channel) {
                                // Get members
                                const channel_members = new Array();
                                for (const this_entry of this_channel.members) {
                                    channel_members.push(this_entry[1]);
                                }

                                // Get reaction effect
                                let effect = null;
                                switch (emoji.name) {
                                    case '🟠':
                                        effect = true;
                                        break;
                                    case '🟢':
                                        effect = false;
                                        break;
                                }

                                if (effect !== null) {
                                    // Apply reaction effect
                                    for (const this_channel_member of channel_members) {
                                        if (!this_channel_member.user.bot) {
                                            await this_channel_member.voice.setMute(effect)
                                            await functions.sleep(1000); // delay burst
                                        }
                                    }
                                }

                                // Add reactions
                                const reactions = ['🟠', '🟢'];
                                for (const this_reaction of reactions) {
                                    await this.addReaction(message, this_reaction);
                                }
                            }
                        } catch (error) {
                            error_manager.mark(ErrorTicketManager.create('Audio Control Extension for Voice Channels', error, 'onReactionAdd'));
                        }
                        break;
                }
                break;
            case 'Quarantine Gaming: Game Coordinator':
                try {
                    const inviter = app.member(embed.fields[0].value);
                    if (inviter && reactor && embed.thumbnail.url == emoji.url) {
                        if (reactor.id != inviter.id && embed.footer.text != 'Closed. This bracket is now full.') {
                            const players = new Array();
                            const max = embed.fields.length;
                            let cur = 0;
                            let has_caps = false;
                            let inserted = false;
                            if (embed.description.indexOf('is looking for') !== -1) has_caps = true;
                            for (const field of embed.fields) {
                                if (field.value != '\u200b') {
                                    players.push(field.value);
                                    cur++;
                                    if (field.value.indexOf(reactor.id) !== -1) {
                                        inserted = true;
                                    }
                                }
                            }
                            embed.spliceFields(0, max);
                            if (has_caps) {
                                for (let i = 1; i <= max; i++) {
                                    if (i <= cur) {
                                        embed.addField(`Player ${i}:`, players[i - 1]);
                                    } else {
                                        if (!inserted) {
                                            embed.addField(`Player ${i}:`, reactor);
                                            players.push(reactor);
                                            inserted = true;
                                        } else {
                                            embed.addField(`Player ${i}:`, '\u200b');
                                        }
                                    }
                                }
                            } else {
                                let i = 1;
                                for (i; i <= cur; i++) {
                                    embed.addField(`Player ${i}:`, players[i - 1]);
                                }
                                if (!inserted) {
                                    embed.addField(`Player ${i}:`, reactor);
                                    players.push(reactor);
                                    inserted = true;
                                }
                            }
                            if (has_caps && players.length >= max) {
                                embed.setFooter('Closed. This bracket is now full.');
                            }
                            await message.edit({ content: message.content, embed: embed });
                            for (const this_field of embed.fields) {
                                if (this_field.value && this_field.value.length > 0) {
                                    const player = app.member(this_field.value);
                                    if (player && player.id != reactor.id) {
                                        await message_manager.sendToUser(player, `${reactor} joined your bracket. ${players.length > 1 ? `${players.length} players total.` : ''}`);
                                    }
                                }
                            }
                            if (has_caps && players.length >= max) {
                                await message.reactions.removeAll();
                                embed.setDescription('Your team members are listed below.');
                                embed.setFooter('Game On!');
                                for (const this_field of embed.fields) {
                                    if (this_field.value && this_field.value.length > 0) {
                                        const player = app.member(this_field.value);
                                        if (player && player.id != reactor.id) {
                                            await message_manager.sendToUser(player, { content: `Your ${embed.title} bracket is now full.`, embed: embed });
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (error) {
                    error_manager.mark(ErrorTicketManager.create('Game Coordinator', error, 'onReactionAdd'));
                }
                break;
        }
    } catch (error) {
        error_manager.mark(ErrorTicketManager.create('onReactionAdd', error));
    }
    console.log(`IncomingReaction: Finished ${IncomingReactionManager.currentID}`);
    IncomingReactionManager.finish();
}

/**
 * Processes all reaction remove events and applies appropriate actions.
 * @param {Discord.Message} message The message object.
 * @param {Discord.MessageEmbed} embed The message embed object.
 * @param {Discord.GuildEmoji | Discord.ReactionEmoji} emoji The guild/reaction emoji object.
 * @param {Discord.GuildMember} reactor The guild member object that reacted to this message.
 */
module.exports.onReactionRemove = async (message, embed, emoji, reactor) => {
    console.log(`IncomingReaction: Queueing ${IncomingReactionManager.processID}`);
    await IncomingReactionManager.queue();
    console.log(`IncomingReaction: Started ${IncomingReactionManager.currentID}`);
    try {
        switch (embed.author.name) {
            case 'Quarantine Gaming: NSFW Content':
                switch (emoji.name) {
                    case '🔴':
                        await role_manager.remove(reactor, constants.roles.nsfw).catch(error => error_manager.mark(ErrorTicketManager.create('nsfw', error, 'onReactionRemove')));
                        break;
                }
                break;
            case 'Quarantine Gaming: Free Game Updates':
                switch (emoji.name) {
                    case '1️⃣':
                        await role_manager.remove(reactor, constants.roles.steam).catch(error => error_manager.mark(ErrorTicketManager.create('steam', error, 'onReactionRemove')));
                        break;
                    case '2️⃣':
                        await role_manager.remove(reactor, constants.roles.epic).catch(error => error_manager.mark(ErrorTicketManager.create('epic', error, 'onReactionRemove')));
                        break;
                    case '3️⃣':
                        await role_manager.remove(reactor, constants.roles.gog).catch(error => error_manager.mark(ErrorTicketManager.create('gog', error, 'onReactionRemove')));
                        break;
                    case '4️⃣':
                        await role_manager.remove(reactor, constants.roles.console).catch(error => error_manager.mark(ErrorTicketManager.create('console', error, 'onReactionRemove')));
                        break;
                    case '5️⃣':
                        await role_manager.remove(reactor, constants.roles.ubisoft).catch(error => error_manager.mark(ErrorTicketManager.create('ubisoft', error, 'onReactionRemove')));
                        break;
                }
                break;
            case 'Quarantine Gaming: Game Coordinator':
                try {
                    const inviter = app.member(embed.fields[0].value);
                    if (inviter && reactor && embed.thumbnail.url == emoji.url) {
                        if (reactor.id != inviter.id && embed.footer.text != 'Closed. This bracket is now full.') {
                            let players = new Array();
                            let max = embed.fields.length;
                            let has_caps = false;
                            if (embed.description.indexOf('is looking for') !== -1) has_caps = true;
                            for (let field of embed.fields) {
                                if (field.value && field.value != '\u200b' && (!(field.value.indexOf(reactor.id) !== -1) || embed.description.indexOf(reactor.displayName) !== -1)) {
                                    players.push(field.value);
                                }
                            }
                            embed.spliceFields(0, max);
                            if (has_caps) {
                                for (let i = 1; i <= max; i++) {
                                    if (i <= players.length) {
                                        embed.addField(`Player ${i}:`, players[i - 1]);
                                    } else {
                                        embed.addField(`Player ${i}:`, '\u200b');
                                    }
                                }
                            } else {
                                for (let i = 1; i <= players.length; i++) {
                                    embed.addField(`Player ${i}:`, players[i - 1]);
                                }
                            }
                            await message.edit({ content: message.content, embed: embed });
                            for (const this_field of embed.fields) {
                                if (this_field.value && this_field.value.length > 0) {
                                    const player = app.member(this_field.value);
                                    if (player && player.id != reactor.id) {
                                        await message_manager.sendToUser(player, `${reactor} left your bracket. ${players.length > 1 ? `${players.length} players total.` : ''}`);
                                    }
                                }
                            }
                        }
                    }
                } catch (error) {
                    error_manager.mark(ErrorTicketManager.create('Game Coordinator', error, 'onReactionRemove'));
                }
                break;
        }
    } catch (error) {
        error_manager.mark(ErrorTicketManager.create('onReactionRemove', error));
    }
    console.log(`IncomingReaction: Finished ${IncomingReactionManager.currentID}`);
    IncomingReactionManager.finish();
}