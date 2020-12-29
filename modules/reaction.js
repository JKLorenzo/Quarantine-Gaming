const constants = require('./constants.js');
const functions = require('./functions.js');
const role = require('./role.js');
const error_manager = require('./error_manager.js');
const app = require('./app.js');
const message = require('./message.js');
const { channel } = require('./app.js');

const error_ticket = error_manager.for('reaction.js');

const ReactionAddManager = functions.createManager(1500);
const IncomingReactionManager = functions.createManager(500);

module.exports = {
    addReaction: function (message, emoji) {
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
    },
    onReactionAdd: async function (embed, emoji, reactor, this_message) {
        await IncomingReactionManager.queue();
        try {
            switch (embed.author.name) {
                case 'Quarantine Gaming: NSFW Content':
                    switch (emoji) {
                        case '🔴':
                            await role.add(reactor, constants.roles.nsfw).catch(error => error_manager.mark(new error_ticket('nsfw', error, 'onReactionAdd')));
                            break;
                    }
                    break;
                case 'Quarantine Gaming: Free Game Updates':
                    switch (emoji) {
                        case '1️⃣':
                            await role.add(reactor, constants.roles.steam).catch(error => error_manager.mark(new error_ticket('steam', error, 'onReactionAdd')));
                            break;
                        case '2️⃣':
                            await role.add(reactor, constants.roles.epic).catch(error => error_manager.mark(new error_ticket('epic', error, 'onReactionAdd')));
                            break;
                        case '3️⃣':
                            await role.add(reactor, constants.roles.gog).catch(error => error_manager.mark(new error_ticket('gog', error, 'onReactionAdd')));
                            break;
                        case '4️⃣':
                            await role.add(reactor, constants.roles.console).catch(error => error_manager.mark(new error_ticket('console', error, 'onReactionAdd')));
                            break;
                        case '5️⃣':
                            await role.add(reactor, constants.roles.ubisoft).catch(error => error_manager.mark(new error_ticket('ubisoft', error, 'onReactionAdd')));
                            break;
                    }
                    break;
                case 'Quarantine Gaming: Member Approval':
                    try {
                        // Check if reactor is a staff and approval is still pending
                        if (reactor.roles.cache.has(constants.roles.staff) && embed.fields[4].name != 'Action Taken:') {
                            const this_user = app.member(embed.fields[1].value);
                            if (this_user) {
                                switch (emoji) {
                                    case '✅':
                                        await role.add(this_user, constants.roles.member).catch(error => error_manager.mark(new error_ticket('approve', error, 'onReactionAdd')));
                                        await this_message.reactions.removeAll().catch(error => error_manager.mark(new error_ticket('reactions [approve]', error, 'onReactionAdd')));;
                                        const final_embed = embed.spliceFields(4, 1, [
                                            { name: 'Action Taken:', value: `Approved by ${this_member}` }
                                        ]).setTimestamp();
                                        await this_message.edit(final_embed).catch(error => error_manager.mark(new error_ticket('edit [approve]', error, 'onReactionAdd')));
                                        const dm_message = [
                                            `Hooraaay! 🥳 Your membership request has been approved! You will now have access to all the features of this server!`,
                                            "Do `!help` on our " + app.channel(constants.channels.text.general) + " text channel to know more about these features or you can visit <https://quarantinegamingdiscord.wordpress.com/> for more info."
                                        ];
                                        await message.sendToUser(this_user, dm_message.join('\n')).catch(error => error_manager.mark(new error_ticket('dm [approve]', error, 'onReactionAdd')));
                                        break;
                                    case '❌':
                                        await this_user.kick().catch(error => error_manager.mark(new error_ticket('kick', error, 'onReactionAdd')));
                                        await this_message.reactions.removeAll().catch(error => error_manager.mark(new error_ticket('reactions [kick]', error, 'onReactionAdd')));;
                                        const final_embed = embed.spliceFields(4, 1, [
                                            { name: 'Action Taken:', value: `Kicked by ${this_member}` }
                                        ]).setTimestamp();
                                        await this_message.edit(final_embed).catch(error => error_manager.mark(new error_ticket('edit [kick]', error, 'onReactionAdd')));;
                                        break;
                                    case '⛔':
                                        await this_user.ban().catch(error => error_manager.mark(new error_ticket('ban', error, 'onReactionAdd')));
                                        await this_message.reactions.removeAll().catch(error => error_manager.mark(new error_ticket('reactions [ban]', error, 'onReactionAdd')));
                                        const final_embed = embed.spliceFields(4, 1, [
                                            { name: 'Action Taken:', value: `Banned by ${this_member}` }
                                        ]).setTimestamp();
                                        await this_message.edit(final_embed).catch(error => error_manager.mark(new error_ticket('edit [ban]', error, 'onReactionAdd')));
                                        break;
                                }
                            } else {
                                await this_message.reactions.removeAll().catch(error => error_manager.mark(new error_ticket('reactions [not found]', error, 'onReactionAdd')));
                                const final_embed = embed.spliceFields(4, 1, [
                                    { name: 'Action Taken:', value: `None. User not found ⚠. Attempted by ${this_member}` }
                                ]).setTimestamp();
                                await message.edit(final_embed).catch(error => error_manager.mark(new error_ticket('edit [not found]', error, 'onReactionAdd')));
                            }
                        }
                    } catch (error) {
                        error_manager.mark(new error_ticket('Member Approval', error, 'onReactionAdd'));
                    }
                    break;
                case 'Quarantine Gaming: Experience':
                    switch (embed.title) {
                        case 'Audio Control Extension for Voice Channels':
                            try {
                                // Delete reactions
                                await this_message.reactions.removeAll();
                                const this_channel = app.member(user.id).voice.channel;
                                if (this_channel) {
                                    // Get members
                                    let channel_members = new Array();
                                    for (let this_entry of this_channel.members) {
                                        channel_members.push(this_entry[1]);
                                    }

                                    // Get reaction effect
                                    let effect = null;
                                    switch (reaction.emoji.name) {
                                        case '🟠':
                                            effect = true;
                                            break;
                                        case '🟢':
                                            effect = false;
                                            break;
                                    }

                                    if (effect !== null) {
                                        // Apply reaction effect
                                        for (let this_channel_member of channel_members) {
                                            if (!this_channel_member.user.bot) {
                                                await this_channel_member.voice.setMute(effect)
                                                await functions.sleep(1000); // delay burst
                                            }
                                        }
                                    }

                                    // Add reactions
                                    const reactions = ['🟠', '🟢'];
                                    for (let this_reaction of reactions) {
                                        await this.addReaction(this_message, this_reaction);
                                    }
                                }
                            } catch (error) {
                                error_manager.mark(new error_ticket('Audio Control Extension for Voice Channels', error, 'onReactionAdd'));
                            }
                            break;
                    }
                    break;
                case 'Quarantine Gaming: Game Coordinator':
                    try {
                        if (embed.thumbnail.url == reaction.emoji.url && !(embed.fields[0].value.indexOf(user.id) !== -1)) {
                            const inviter = app.member(embed.fields[0].value);
                            if (reactor.id != inviter.id && embed.footer.text != 'Closed. This bracket is now full.') {
                                let players = new Array();
                                let max = embed.fields.length;
                                let cur = 0;
                                let has_caps = false;
                                let inserted = false;
                                if (embed.description.indexOf('is looking for') !== -1) has_caps = true;
                                for (let field of embed.fields) {
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
                                await this_message.edit({ content: message.content, embed: embed });
                                for (let this_field of embed.fields) {
                                    if (this_field.value && this_field.value.length > 0) {
                                        const player = app.member(this_field.value);
                                        if (player && player.id != reactor.id) {
                                            await channel.sendToUser(player, `${member} joined your bracket. ${players.length > 1 ? `${players.length} players total.` : ''}`);
                                        }
                                    }
                                }
                                if (has_caps && players.length >= max) {
                                    await message.reactions.removeAll();
                                    embed.setDescription('Your team members are listed below.');
                                    embed.setFooter('Game On!');
                                    for (let this_field of embed.fields) {
                                        if (this_field.value && this_field.value.length > 0) {
                                            const player = app.member(this_field.value);
                                            if (player_member && player_member.id != member.id) {
                                                await channel.sendToUser(player, { content: `Your ${embed.title} bracket is now full.`, embed: embed });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        error_manager.mark(new error_ticket('Game Coordinator', error, 'onReactionAdd'));
                    }
                    break;
            }
        } catch (error) {
            error_manager.mark(new error_ticket('onReactionAdd', error));
        }
        IncomingReactionManager.finish();
    },
    onReactionRemove: async function (embed, emoji, reactor, this_message) {
        await IncomingReactionManager.queue();
        try {
            switch (embed.author.name) {
                case 'Quarantine Gaming: NSFW Content':
                    switch (emoji) {
                        case '🔴':
                            await role.remove(reactor, constants.roles.nsfw).catch(error => error_manager.mark(new error_ticket('nsfw', error, 'onReactionRemove')));
                            break;
                    }
                    break;
                case 'Quarantine Gaming: Free Game Updates':
                    switch (emoji) {
                        case '1️⃣':
                            await role.remove(reactor, constants.roles.steam).catch(error => error_manager.mark(new error_ticket('steam', error, 'onReactionRemove')));
                            break;
                        case '2️⃣':
                            await role.remove(reactor, constants.roles.epic).catch(error => error_manager.mark(new error_ticket('epic', error, 'onReactionRemove')));
                            break;
                        case '3️⃣':
                            await role.remove(reactor, constants.roles.gog).catch(error => error_manager.mark(new error_ticket('gog', error, 'onReactionRemove')));
                            break;
                        case '4️⃣':
                            await role.remove(reactor, constants.roles.console).catch(error => error_manager.mark(new error_ticket('console', error, 'onReactionRemove')));
                            break;
                        case '5️⃣':
                            await role.remove(reactor, constants.roles.ubisoft).catch(error => error_manager.mark(new error_ticket('ubisoft', error, 'onReactionRemove')));
                            break;
                    }
                    break;
                case 'Quarantine Gaming: Game Coordinator':
                    try {
                        if (embed.thumbnail.url == reaction.emoji.url && !(embed.fields[0].value.indexOf(user.id) !== -1)) {
                            const inviter = app.member(embed.fields[0].value);
                            if (reactor.id != inviter.id && embed.footer.text != 'Closed. This bracket is now full.') {
                                let players = new Array();
                                let max = embed.fields.length;
                                let has_caps = false;
                                if (embed.description.indexOf('is looking for') !== -1) has_caps = true;
                                for (let field of embed.fields) {
                                    if (field.value && field.value != '\u200b' && (!(field.value.indexOf(member.id) !== -1) || embed.description.indexOf(member.displayName) !== -1)) {
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
                                await this_message.edit({ content: message.content, embed: embed });
                                for (let this_field of embed.fields) {
                                    if (this_field.value && this_field.value.length > 0) {
                                        const player = app.member(this_field.value);
                                        if (player && player.id != reactor.id) {
                                            await channel.sendToUser(player, `${member} left your bracket. ${players.length > 1 ? `${players.length} players total.` : ''}`);
                                        }
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        error_manager.mark(new error_ticket('Game Coordinator', error, 'onReactionRemove'));
                    }
                    break;
            }
        } catch (error) {
            error_manager.mark(new error_ticket('onReactionRemove', error));
        }
        IncomingReactionManager.finish();
    }
}