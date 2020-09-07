const { MessageEmbed } = require("discord.js");

let isUpdating = false, toUpdate = new Array();
const parentID = '749231470396309535';

async function updateGuild() {
    // Transfer members from generic voice rooms to dynamic voice rooms
    for (let this_channel of g_interface.get('guild').channels.cache.array()) {
        if (this_channel.type == 'voice' && this_channel.name.startsWith('Voice Room')) {
            if (this_channel.members.size > 1) {
                // Get baseline activity
                let baseline_role;
                for (let this_member of this_channel.members.array()) {
                    let member_roles = new Array();
                    if (!baseline_role) {
                        for (let this_role of this_member.roles.cache.array()) {
                            if (this_role.name.startsWith('Play')) {
                                member_roles.push(this_role);
                            }
                        }
                        if (member_roles.length == 1) {
                            baseline_role = member_roles.pop();
                        }
                    }
                }
                if (baseline_role) {
                    // Check if all members have the same activity
                    let same_acitivities = true;
                    for (let this_member of this_channel.members.array()) {
                        if (same_acitivities && !this_member.roles.cache.find(role => role == baseline_role)) {
                            same_acitivities = false;
                        }
                    }
                    // Check if all members are playing more than 5 minutes
                    let are_playing = true;
                    for (let this_member of this_channel.members.array()) {
                        for (let this_activity of this_member.presence.activities) {
                            if (this_activity.name == baseline_role.name.substring(g_vrprefix.length)) {
                                let today = new Date();
                                let diffMins = Math.round((today - this_activity.createdAt) / 60000); // minutes
                                if (diffMins < 1) {
                                    are_playing = false;
                                }
                            }
                        }
                    }

                    if (same_acitivities && are_playing) {
                        // Create voice channel
                        await g_interface.get('guild').channels.create(baseline_role.name.substring(g_vrprefix.length), {
                            type: 'voice',
                            topic: `Voice room dedicated for ${baseline_role.name.substring(g_vrprefix.length)} players.`,
                            reason: `${baseline_role.name.substring(g_vrprefix.length)} is being played by members in a voice room.`,
                            parent: parentID,
                            position: 1,
                            permissionOverwrites: [
                                {
                                    id: g_interface.get('guild').roles.everyone.id,
                                    deny: ["CONNECT"]
                                },
                                {
                                    id: g_interface.get('guild').roles.cache.find(role => role.name.toLowerCase() == 'music bots').id,
                                    allow: ["CONNECT"]
                                },
                                {
                                    id: baseline_role.id,
                                    allow: ["CONNECT"]
                                }
                            ]
                        }).then(async voice_channel => {
                            // Create text role
                            await g_interface.get('guild').roles.create({
                                data: {
                                    name: `Text ${voice_channel.id}`,
                                    color: '0x7b00ff'
                                }
                            }).then(async function (text_role) {
                                // Create text channel
                                await g_interface.get('guild').channels.create(baseline_role.name.substring(g_vrprefix.length), {
                                    type: 'text',
                                    parent: parentID,
                                    position: 1,
                                    permissionOverwrites: [
                                        {
                                            id: g_interface.get('guild').roles.everyone.id,
                                            deny: ["VIEW_CHANNEL"]
                                        },
                                        {
                                            id: g_interface.get('guild').roles.cache.find(role => role.name.toLowerCase() == 'music bots').id,
                                            allow: ["VIEW_CHANNEL"]
                                        },
                                        {
                                            id: text_role.id,
                                            allow: ["VIEW_CHANNEL"]
                                        }
                                    ]
                                }).then(async text_channel => {
                                    await text_channel.setTopic(`${voice_channel.id} ${text_role.id}`).catch(error => {
                                        g_interface.on_error({
                                            name: 'updateGuild -> .setTopic(text_channel)',
                                            location: 'dynamic_channels.js',
                                            error: error
                                        });
                                    });
                                    let embed = new MessageEmbed();
                                    embed.setAuthor('Quarantine Gaming Dedicated Channels');
                                    embed.setTitle(`Voice and Text Channels for ${baseline_role.name.substring(g_vrprefix.length)}`);
                                    let channel_desc = new Array();
                                    channel_desc.push('Only members who are in this voice channel can view this text channel.');
                                    channel_desc.push('Members who are playing the same game this channel is hosting are allowed to join.');
                                    channel_desc.push('These channels will automatically be deleted once everyone is disconnected from this voice channel.');
                                    channel_desc.push('\n');
                                    channel_desc.push('Note: <@&749235255944413234> and <@&700397445506531358> can interact with these channels.');
                                    embed.setDescription(channel_desc.join('\n'));
                                    await text_channel.send(embed).catch(error => {
                                        g_interface.on_error({
                                            name: 'updateChannel -> .send(embed)',
                                            location: 'dynamic_channels.js',
                                            error: error
                                        });
                                    });
                                    // Transfer
                                    for (let this_member of this_channel.members.array()) {
                                        await this_member.voice.setChannel(voice_channel).catch(error => {
                                            g_interface.on_error({
                                                name: 'updateGuild -> .setChannel(voice_channel)',
                                                location: 'dynamic_channels.js',
                                                error: error
                                            });
                                        });
                                    }
                                }).catch(error => {
                                    g_interface.on_error({
                                        name: 'updateGuild -> .create(text_channel)',
                                        location: 'dynamic_channels.js',
                                        error: error
                                    });
                                });
                            }).catch(error => {
                                g_interface.on_error({
                                    name: 'updateGuild -> .create(text_role)',
                                    location: 'dynamic_channels.js',
                                    error: error
                                });
                            });
                        }).catch(error => {
                            g_interface.on_error({
                                name: 'updateGuild -> .create(voice_channel)',
                                location: 'dynamic_channels.js',
                                error: error
                            });
                        });
                    }
                }
            }
        }
    }

    setTimeout(async function () {
        // Repeat
        updateGuild();
    }, 30000)
}

async function updateChannel() {
    while (toUpdate.length > 0) {
        let this_data = toUpdate.pop();
        let newState = this_data.new;
        let oldState = this_data.old;

        if (oldState.channel != newState.channel) {
            if (oldState.channel && oldState.channel.parentID == parentID) {
                let text_channel = g_interface.get('guild').channels.cache.find(channel => channel.type == 'text' && channel.topic && channel.topic.split(' ')[0] == oldState.channelID);
                let text_role = g_interface.get('guild').roles.cache.get(text_channel.topic.split(' ')[1]);
                if (oldState.channel.members.size > 0) {
                    await newState.member.roles.remove(text_role).catch(error => {
                        g_interface.on_error({
                            name: 'updateChannel -> .remove(text_role)',
                            location: 'dynamic_channels.js',
                            error: error
                        });
                    });
                    let embed = new MessageEmbed();
                    embed.setAuthor('Quarantine Gaming Dedicated Channels');
                    embed.setTitle(oldState.channel.name);
                    embed.setDescription(`${oldState.member} left this channel.`);
                    embed.setThumbnail(newState.member.user.displayAvatarURL());
                    embed.setFooter(`${newState.member.user.tag} (${newState.member.user.id})`);
                    embed.setTimestamp();
                    await text_channel.send(embed).catch(error => {
                        g_interface.on_error({
                            name: 'updateChannel -> .send(embed)',
                            location: 'dynamic_channels.js',
                            error: error
                        });
                    });
                } else {
                    await oldState.channel.delete('This channel is no longer in use.').catch(error => {
                        g_interface.on_error({
                            name: 'updateChannel -> .delete(voice_channel)',
                            location: 'dynamic_channels.js',
                            error: error
                        });
                    });
                    await text_channel.delete('This channel is no longer in use.').catch(error => {
                        g_interface.on_error({
                            name: 'updateChannel -> .delete(text_channel)',
                            location: 'dynamic_channels.js',
                            error: error
                        });
                    });
                    await text_role.delete('This role is no longer in use.').catch(error => {
                        g_interface.on_error({
                            name: 'updateChannel -> .delete(text_role)',
                            location: 'dynamic_channels.js',
                            error: error
                        });
                    });
                }
            }

            if (newState.channel && newState.channel.parentID == parentID) {
                let text_channel = g_interface.get('guild').channels.cache.find(channel => channel.type == 'text' && channel.topic && channel.topic.split(' ')[0] == newState.channelID);
                let text_role = g_interface.get('guild').roles.cache.get(text_channel.topic.split(' ')[1]);
                if (!newState.member.roles.cache.find(role => role == text_role)) {
                    await newState.member.roles.add(text_role).catch(error => {
                        g_interface.on_error({
                            name: 'updateChannel -> .add(text_role)',
                            location: 'dynamic_channels.js',
                            error: error
                        });
                    });
                    let embed = new MessageEmbed();
                    embed.setAuthor('Quarantine Gaming Dedicated Channels');
                    embed.setTitle(newState.channel.name);
                    embed.setDescription(`${newState.member} joined this channel.`);
                    embed.setThumbnail(newState.member.user.displayAvatarURL());
                    embed.setFooter(`${newState.member.user.tag} (${newState.member.user.id})`);
                    embed.setTimestamp();
                    await text_channel.send({ content: newState.member, embed: embed }).catch(error => {
                        g_interface.on_error({
                            name: 'updateChannel -> .send(embed)',
                            location: 'dynamic_channels.js',
                            error: error
                        });
                    });
                }
            }
        }
    }
    isUpdating = false;
}

// External Functions Region
const init = async function (this_client) {
    // Set the commando client instance
    client = this_client;

    for (let this_channel of g_interface.get('guild').channels.cache.array()) {
        if (this_channel.parent && this_channel.parent.id == parentID) {
            if (this_channel.type == 'text') {
                let data = this_channel.topic.split(' ');
                let this_voice = g_interface.get('guild').channels.cache.get(data[0]);
                let this_text = g_interface.get('guild').roles.cache.get(data[1]);

                // Give all channel members text roles
                for (let this_member of this_voice.members.array()) {
                    if (!this_member.roles.cache.find(role => role == this_text)) {
                        await this_member.roles.add(this_text).catch(error => {
                            g_interface.on_error({
                                name: 'init -> .add(text_role)',
                                location: 'dynamic_channels.js',
                                error: error
                            });
                        });
                    }
                }

                // Remove role from all members not in the voice room
                for (let this_member of g_interface.get('guild').members.cache.array()) {
                    if (this_member.roles.cache.find(role => role == this_text)) {
                        if (!this_member.voice) {
                            await this_member.roles.remove(this_text).catch(error => {
                                g_interface.on_error({
                                    name: 'init -> .remove(text_role) [A]',
                                    location: 'dynamic_channels.js',
                                    error: error
                                });
                            });
                        } else if (this_member.voice.channelID != this_voice.id) {
                            await this_member.roles.remove(this_text).catch(error => {
                                g_interface.on_error({
                                    name: 'init -> .remove(text_role) [B]',
                                    location: 'dynamic_channels.js',
                                    error: error
                                });
                            });
                        }
                    }
                }
            }
        }
    }

    updateGuild();
}

const update = function (oldState, newState) {
    let this_data = {
        old: oldState,
        new: newState
    }

    toUpdate.push(this_data);
    if (!isUpdating) {
        isUpdating = true;
        updateChannel();
    }
}

// Interface Module Functions
module.exports = {
    init,
    update
}