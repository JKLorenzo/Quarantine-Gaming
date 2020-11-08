const { MessageEmbed } = require('discord.js');

const manage = async function (message) {
    // Help
    if (message.channel && message.content.toLowerCase() == '!help') {
        message.channel.send(`Visit <https://quarantinegamingdiscord.wordpress.com/> to learn more.`).catch(error => { });
    }

    // Announcements
    if (message.channel && message.channel.id == g_channels.get().announcement.id && message.author != g_client.user) {
        message.delete({ timeout: 250 }).catch(error => { });
        g_interface.announce(message.content);
    }

    // Game Invites Channel Blocking
    if (message.channel && message.channel.id == g_channels.get().gaming.id && (message.embeds.length == 0 || (message.embeds.length > 0 && message.embeds[0].author.name != 'Quarantine Gaming: Game Coordinator'))) {
        dm_member(g_channels.get().guild.member(message.author), `Hello there! You can't send any messages in ${message.channel} channel. To invite players, do *!play* command in the ${g_channels.get().general} text channel.`);
        message.delete({ timeout: 250 }).catch(error => { });
    }

    // Following
    if (message.channel && message.channel.id == g_channels.get().following.id) {
        let sender = message.author.username.split('#');
        let server = sender[0].trim();
        let channel = sender[1];

        let embed = new MessageEmbed()
            .setAuthor('Quarantine Gaming: Official Game Updates')
            .setTitle(server)
            .setThumbnail(message.author.displayAvatarURL())
            .setDescription(message.content.split(' ').map(word => {
                if (word.startsWith('<#')) {
                    return '*External Channel*';
                } else if (word.startsWith('<@&')) {
                    return '*External Role*';
                } else if (word.startsWith('<@')) {
                    return '*External User*';
                }
                return word;
            }).join(' '))
            .setFooter(`On ${channel}`)
            .setColor(`#00ffff`);

        if (!message.content.startsWith('RT @')) g_interface.updates({ embed: embed }).catch(error => {
            g_interface.on_error({
                name: 'manage -> .updates()',
                location: 'message_manager.js',
                error: error
            });
        });
    }

    // DM
    if (message.guild == null) {
        let this_member = g_channels.get().guild.member(message.author);
        if (this_member && !this_member.user.bot) {
            let embed = new MessageEmbed()
                .setAuthor('Quarantine Gaming: Direct Message Handler')
                .setTitle(`${this_member.displayName} (${this_member.user.tag})`)
                .setThumbnail(message.author.displayAvatarURL())
                .addField('Sender:', this_member)
                .addField('Message:', message.content)
                .setFooter(`To reply, do: !message dm ${this_member.user.id} <message>`)
                .setColor(`#00ff6f`);

            g_interface.dm({ embed: embed }).catch(error => {
                g_interface.on_error({
                    name: 'manage -> .dm(embed)',
                    location: 'message_manager.js',
                    error: error
                });
            });
        }
    }
}

const dm_member = async function (member, content) {
    if (member.user.bot) return;
    await member.createDM().then(async dm_channel => {
        await dm_channel.send(content).then(message => {
            message.delete({ timeout: 3600000 }).catch(error => { });
        }).catch(error => {
            on_error({
                name: `dm -> [${member}].send(${content})`,
                location: 'interface.js',
                error: error
            });
        });
    }).catch(error => {
        on_error({
            name: `dm -> .createDM(${member})`,
            location: 'interface.js',
            error: error
        });
    });
}

const clear_dms = async function () {
    for (let member of g_channels.get().guild.members.cache.array()) {
        if (!member.user.bot) {
            await member.createDM().then(async dm_channel => {
                await dm_channel.messages.fetch().then(async messages => {
                    for (let message of messages) {
                        if (message[1].author.bot) await message[1].delete().catch(error => { });;
                    }
                }).catch(error => { });
            }).catch(error => {
                on_error({
                    name: 'clear_dms -> .createDM()',
                    location: 'interface.js',
                    error: error
                });
            });
        }
    }
}

const clear_channels = async function () {
    const channels_To_clear = [g_channels.get().gaming, g_channels.get().testing];
    for (let channel of channels_To_clear) {
        await channel.messages.fetch().then(async messages => {
            for (let message of messages) {
                await message[1].delete({ timeout: 900000 }).catch(error => { }); // Delete after 15 mins
            }
        });
    }
}

let updating = false;
const reactionAdd = async function (reaction, user) {
    try {
        if (user.bot) return;
        if (reaction.partial) {
            await reaction.fetch().catch(error => {
                g_interface.on_error({
                    name: 'messageReactionAdd -> .fetch(reaction)',
                    location: 'message_manager.js',
                    error: error
                });
                return;
            });
        }
        let this_message = reaction.message;
        let this_member;
        if (this_message.author.id == g_client.user.id && this_message.embeds.length > 0) {
            switch (this_message.embeds[0].author.name) {
                case 'Quarantine Gaming: NSFW Content':
                    switch (reaction.emoji.name) {
                        case '🔴':
                            this_member = g_channels.get().guild.members.cache.get(user.id);
                            if (!this_member.roles.cache.has(g_roles.get().nsfw.id)) {
                                await this_member.roles.add(g_roles.get().nsfw).catch(error => {
                                    g_interface.on_error({
                                        name: 'messageReactionAdd -> .add(nsfw)',
                                        location: 'message_manager.js',
                                        error: error
                                    });
                                });
                            }
                            break;
                    }
                    break;
                case 'Quarantine Gaming: Free Game Updates':
                    this_member = g_channels.get().guild.members.cache.get(user.id);
                    let this_role;
                    switch (reaction.emoji.name) {
                        case '1️⃣':
                            this_role = g_channels.get().guild.roles.cache.find(role => role.id == '722645979248984084');
                            break;
                        case '2️⃣':
                            this_role = g_channels.get().guild.roles.cache.find(role => role.id == '722691589813829672');
                            break;
                        case '3️⃣':
                            this_role = g_channels.get().guild.roles.cache.find(role => role.id == '722691679542312970');
                            break;
                        case '4️⃣':
                            this_role = g_channels.get().guild.roles.cache.find(role => role.id == '722691724572491776');
                            break;
                        case '5️⃣':
                            this_role = g_channels.get().guild.roles.cache.find(role => role.id == '750517524738605087');
                            break;
                    }
                    if (this_role && !this_member.roles.cache.has(this_role.id)) {
                        await this_member.roles.add(this_role).catch(error => {
                            g_interface.on_error({
                                name: 'messageReactionAdd -> .add(this_role.id) [case subscribe]',
                                location: 'message_manager.js',
                                error: error
                            });
                        });
                    }
                    break;
                case 'Quarantine Gaming: Member Approval':
                    this_member = g_channels.get().guild.members.cache.find(member => member.user.id == this_message.embeds[0].fields[1].value);
                    if (this_member) {
                        switch (reaction.emoji.name) {
                            case '✅':
                                if (!this_member.roles.cache.has('722699433225224233')) {
                                    await this_member.roles.add('722699433225224233').then(async () => {
                                        await this_message.reactions.removeAll().then(async message => {
                                            let final = message.embeds[0]
                                                .spliceFields(4, 1, [{ name: 'Action Taken:', value: `Approved by ${user}` }])
                                                .setTimestamp();
                                            await message.edit(final).catch(error => {
                                                g_interface.on_error({
                                                    name: 'messageReactionAdd -> .edit(final) [case approve]',
                                                    location: 'message_manager.js',
                                                    error: error
                                                });
                                            });
                                            let dm_msg = [
                                                `Hooraaay! 🥳 Your membership request has been approved! You will now have access to all the features of this server!`,
                                                `Do !help on our *#general🔗* text channel to know more about these features or you can visit <https://quarantinegamingdiscord.wordpress.com/> for more info.`
                                            ]
                                            dm_member(this_member, dm_msg.join('\n'));
                                        }).catch(error => {
                                            g_interface.on_error({
                                                name: 'messageReactionAdd -> .removeAll(reactions) [case approve]',
                                                location: 'message_manager.js',
                                                error: error
                                            });
                                        });
                                    }).catch(error => {
                                        g_interface.on_error({
                                            name: 'messageReactionAdd -> .add(722699433225224233) [case approve]',
                                            location: 'message_manager.js',
                                            error: error
                                        });
                                    });
                                }
                                break;
                            case '❌':
                                await this_member.kick().then(async () => {
                                    await this_message.reactions.removeAll().then(async message => {
                                        let final = message.embeds[0]
                                            .spliceFields(4, 1, [{ name: 'Action Taken:', value: `Kicked by ${user}` }])
                                            .setTimestamp();
                                        await message.edit(final).catch(error => {
                                            g_interface.on_error({
                                                name: 'messageReactionAdd -> .edit(final) [case kick]',
                                                location: 'message_manager.js',
                                                error: error
                                            });
                                        });
                                    }).catch(error => {
                                        g_interface.on_error({
                                            name: 'messageReactionAdd -> .removeAll(reactions) [case kick]',
                                            location: 'message_manager.js',
                                            error: error
                                        });
                                    });
                                }).catch(error => {
                                    g_interface.on_error({
                                        name: 'messageReactionAdd -> .kick(this_member) [case kick]',
                                        location: 'message_manager.js',
                                        error: error
                                    });
                                })
                                break;
                            case '⛔':
                                await this_member.ban().then(async () => {
                                    await this_message.reactions.removeAll().then(async message => {
                                        let final = message.embeds[0]
                                            .spliceFields(4, 1, [{ name: 'Action Taken:', value: `Banned by ${user}` }])
                                            .setTimestamp();
                                        await message.edit(final).catch(error => {
                                            g_interface.on_error({
                                                name: 'messageReactionAdd -> .edit(final) [case ban]',
                                                location: 'message_manager.js',
                                                error: error
                                            });
                                        });
                                    }).catch(error => {
                                        g_interface.on_error({
                                            name: 'messageReactionAdd -> .removeAll(reaction) [case ban]',
                                            location: 'message_manager.js',
                                            error: error
                                        });
                                    });
                                }).catch(error => {
                                    g_interface.on_error({
                                        name: 'messageReactionAdd -> .ban(this_member) [case ban]',
                                        location: 'message_manager.js',
                                        error: error
                                    });
                                })
                                break;
                        }
                    } else {
                        await this_message.reactions.removeAll().then(async message => {
                            let final = message.embeds[0]
                                .spliceFields(4, 1, [{ name: 'Action Taken:', value: `None. User not found ⚠. Attempted by ${user}` }])
                                .setTimestamp();
                            await message.edit(final).catch(error => {
                                g_interface.on_error({
                                    name: 'messageReactionAdd -> .edit(final) [case none]',
                                    location: 'message_manager.js',
                                    error: error
                                });
                            });
                        }).catch(error => {
                            g_interface.on_error({
                                name: 'messageReactionAdd -> .removeAll(reaction) [case none]',
                                location: 'message_manager.js',
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
                                    let this_channel = g_channels.get().guild.members.cache.get(user.id).voice.channel;
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
                                        await g_speech.say(effect ? 'Muting in 5 seconds' : 'Unmuting', this_channel).catch(error => {
                                            g_interface.on_error({
                                                name: 'messageReactionAdd -> .say() [among us]',
                                                location: 'message_manager.js',
                                                error: error
                                            });
                                        });

                                        // Sleep
                                        if (effect) await g_functions.sleep(5000);

                                        // Apply reaction effect
                                        for (let this_channel_member of channel_members) {
                                            if (!this_channel_member.user.bot) {
                                                await this_channel_member.voice.setMute(effect).catch(error => {
                                                    g_interface.on_error({
                                                        name: `messageReactionAdd -> .setMute(${this_channel_member}) [among us]`,
                                                        location: 'message_manager.js',
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
                                                    location: 'message_manager.js',
                                                    error: error
                                                });
                                            });
                                        }
                                    }
                                }).catch(error => {
                                    g_interface.on_error({
                                        name: 'messageReactionAdd -> .removeAll(reaction) [among us]',
                                        location: 'message_manager.js',
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
                        g_coordinator.queue({
                            status: 1,
                            message: this_message,
                            member: g_channels.get().guild.members.cache.get(user.id)
                        });
                    }
                    break;
            }
        }
    } catch (error) {
        g_interface.on_error({
            name: 'messageReactionAdd',
            location: 'message_manager.js',
            error: error
        });
    }
}

const reactionRemove = async function (reaction, user) {
    try {
        if (user.bot) return;
        if (reaction.partial) {
            await reaction.fetch().catch(error => {
                g_interface.on_error({
                    name: 'messageReactionRemove -> .fetch(reaction)',
                    location: 'message_manager.js',
                    error: error
                });
                return;
            });
        }
        let this_message = reaction.message;
        let this_member;
        if (this_message.author.id == g_client.user.id) {
            switch (this_message.embeds[0].author.name) {
                case 'Quarantine Gaming: NSFW Content':
                    switch (reaction.emoji.name) {
                        case '🔴':
                            this_member = g_channels.get().guild.members.cache.get(user.id);
                            let this_role = g_channels.get().guild.roles.cache.find(role => role.id == '700481554132107414');
                            if (this_role && this_member.roles.cache.has(this_role.id)) {
                                await this_member.roles.remove(this_role).catch(error => {
                                    g_interface.on_error({
                                        name: 'messageReactionRemove -> .remove(this_role.id) [case nsfw]',
                                        location: 'message_manager.js',
                                        error: error
                                    });
                                });
                            }
                            break;
                    }
                    break;
                case 'Quarantine Gaming: Free Game Updates':
                    this_member = g_channels.get().guild.members.cache.get(user.id);
                    let this_role;
                    switch (reaction.emoji.name) {
                        case '1️⃣':
                            this_role = g_channels.get().guild.roles.cache.find(role => role.id == '722645979248984084');
                            break;
                        case '2️⃣':
                            this_role = g_channels.get().guild.roles.cache.find(role => role.id == '722691589813829672');
                            break;
                        case '3️⃣':
                            this_role = g_channels.get().guild.roles.cache.find(role => role.id == '722691679542312970');
                            break;
                        case '4️⃣':
                            this_role = g_channels.get().guild.roles.cache.find(role => role.id == '722691724572491776');
                            break;
                        case '5️⃣':
                            this_role = g_channels.get().guild.roles.cache.find(role => role.id == '750517524738605087');
                            break;
                    }
                    if (this_role && this_member.roles.cache.has(this_role.id)) {
                        await this_member.roles.remove(this_role).catch(error => {
                            g_interface.on_error({
                                name: 'messageReactionRemove -> .remove(this_role.id) [case subscribe]',
                                location: 'message_manager.js',
                                error: error
                            });
                        });
                    }
                    break;
                case 'Quarantine Gaming: Game Coordinator':
                    let this_reaction = this_message.reactions.cache.find(reaction => reaction.me);
                    if (this_reaction && reaction.emoji.name == this_reaction.emoji.name && !(this_message.embeds[0].description.indexOf(user.id) !== -1)) {
                        g_coordinator.queue({
                            status: 0,
                            message: this_message,
                            member: g_channels.get().guild.members.cache.get(user.id)
                        });
                    }
                    break;
            }
        }
    } catch (error) {
        g_interface.on_error({
            name: 'messageReactionRemove',
            location: 'message_manager.js',
            error: error
        });
    }
}

module.exports = {
    manage,
    dm_member,
    reactionAdd,
    reactionRemove,
    clear_channels,
    clear_dms
}