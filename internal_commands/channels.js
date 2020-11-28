const { MessageEmbed } = require("discord.js");
let is_dedicating = false, dedicate_queue = new Array();

let guild, c_log, c_roles, c_updates, c_following, c_staff, c_gaming, c_announcement, c_testing, c_general, c_dedicated, c_dm;

const init = async function () {
    guild = g_client.guilds.cache.get('351178660725915649');
    c_general = guild.channels.cache.get('749661539908190258');
    c_log = guild.channels.cache.get('722760285622108210');
    c_roles = guild.channels.cache.get('700134489170378872');
    c_updates = guild.channels.cache.get('699763763859161108');
    c_following = guild.channels.cache.get('770902348197396481');
    c_staff = guild.channels.cache.get('749763548090990613');
    c_gaming = guild.channels.cache.get('759755324264808489');
    c_announcement = guild.channels.cache.get('759920653146652682');
    c_testing = guild.channels.cache.get('749579412139278399');
    c_dedicated = guild.channels.cache.get('749231470396309535');
    c_dm = guild.channels.cache.get('773425152750125106');

    // Delete empty dedicate channels
    for (let this_channel of guild.channels.cache.array()) {
        if (this_channel.type == 'voice' && this_channel.parent && this_channel.parent == c_dedicated) {
            let empty = true;
            for (let member of this_channel.members.array()) {
                if (!member.user.bot) empty = false;
            }
            if (empty) {
                let text_channel = guild.channels.cache.find(channel => channel.type == 'text' && channel.topic && channel.topic.split(' ')[0] == this_channel.id);
                let text_role = guild.roles.cache.get(text_channel.topic.split(' ')[1]);
                let hoisted_role = guild.roles.cache.get(text_channel.topic.split(' ')[2]);

                await this_channel.delete().catch(error => {
                    g_interface.on_error({
                        name: 'init -> .delete(this_channel)',
                        location: 'channels.js',
                        error: error
                    });
                });
                await text_channel.delete().catch(error => {
                    g_interface.on_error({
                        name: 'init -> .delete(text_channel)',
                        location: 'channels.js',
                        error: error
                    });
                });
                await text_role.delete().catch(error => {
                    g_interface.on_error({
                        name: 'init -> .delete(text_role)',
                        location: 'channels.js',
                        error: error
                    });
                });
                await hoisted_role.delete().catch(error => {
                    g_interface.on_error({
                        name: 'init -> .delete(hoisted_role)',
                        location: 'channels.js',
                        error: error
                    });
                });
            }
        }
    }
}

const get = function () {
    return {
        guild: guild,
        general: c_general,
        log: c_log,
        roles: c_roles,
        updates: c_updates,
        following: c_following,
        staff: c_staff,
        gaming: c_gaming,
        announcement: c_announcement,
        testing: c_testing,
        dedicated: c_dedicated,
        dm: c_dm
    }
}

async function beginDedicate() {
    is_dedicating = true;
    while (dedicate_queue.length > 0) {
        let this_data = dedicate_queue.shift();
        let this_name = this_data.name;
        let this_channel = this_data.member.voice.channel;
        let instant = this_data.instant;

        if (this_channel) {
            if (this_channel.parent == g_channels.get().dedicated) {
                // Rename channels
                let text_channel = g_channels.get().guild.channels.cache.find(channel => channel.type == 'text' && channel.topic && channel.topic.split(' ')[0] == this_channel.id);
                await text_channel.setName(this_name).catch(() => { });
                await this_channel.setName(this_name).catch(() => { });
                // Rename role
                let hoisted_role = g_channels.get().guild.roles.cache.find(role => text_channel.topic && text_channel.topic.split(' ')[2] == role.id);
                await hoisted_role.setName(`Team ${this_name}`).catch(() => { });

                // Set info
                let embed = new MessageEmbed();
                embed.setAuthor('Quarantine Gaming: Dedicated Channels');
                embed.setTitle(`Voice and Text Channels ${instant ? 'by' : 'for'} ${this_name}`);
                let channel_desc = new Array();
                channel_desc.push(`• Only members who are in this voice channel can view this text channel.`);
                channel_desc.push(`• You can't view other dedicated channels once you're connected to one.`);
                channel_desc.push(`• ${text_channel} voice and text channels will automatically be deleted once everyone is disconnected from these channels.`);
                channel_desc.push(`• You can lock this channel by doing "!dedicate lock", and you can do "!dedicate unlock" to unlock it.`);
                channel_desc.push(`• You can transfer anyone from another voice channel to this voice channel by doing "!transfer <@member>".\n\u200b\u200bEx: "!transfer <@749563476707377222>"`);
                channel_desc.push(`• You can also transfer multiple users at once.\n\u200b\u200bEx: "!transfer <@749563476707377222> <@749563476707377222> <@749563476707377222>"`);
                channel_desc.push('Note: <@&749235255944413234> and <@&700397445506531358> can interact with these channels.');
                embed.setDescription(channel_desc.join('\n\n'));
                embed.setColor('#7b00ff');
                await text_channel.send(embed).then(async message => {
                    await message.pin();
                }).catch(error => {
                    g_interface.on_error({
                        name: 'beginDedicate -> .send(embed)',
                        location: 'channels.js',
                        error: error
                    });
                });
            } else {
                if (!instant) {
                    // Notify voice channel
                    await g_speech.say(`Transferring to ${this_name} dedicated channel. Please wait.`, this_channel).catch(error => {
                        g_interface.on_error({
                            name: 'beginDedicate -> .say()',
                            location: 'channels.js',
                            error: error
                        });
                    });
                }

                // Create voice channel
                await guild.channels.create(this_name, {
                    type: 'voice',
                    parent: g_channels.get().dedicated.id,
                    position: 1,
                    permissionOverwrites: [
                        {
                            id: g_roles.get().everyone.id,
                            deny: ["CREATE_INSTANT_INVITE", "MANAGE_CHANNELS", "MANAGE_ROLES", "MANAGE_WEBHOOKS", "CONNECT", 'MUTE_MEMBERS', 'DEAFEN_MEMBERS', 'MOVE_MEMBERS', 'PRIORITY_SPEAKER']
                        },
                        {
                            id: g_roles.get().dedicated.id,
                            deny: ["VIEW_CHANNEL"]
                        },
                        {
                            id: g_roles.get().member.id,
                            allow: ["CONNECT", 'SPEAK', "STREAM"],
                        },
                        {
                            id: g_roles.get().music.id,
                            allow: ["CONNECT"]
                        }
                    ]
                }).then(async voice_channel => {
                    // Set bitrate
                    voice_channel.setBitrate(128000).catch(error => {
                        g_interface.on_error({
                            name: 'beginDedicate -> .setBitrate()',
                            location: 'channels.js',
                            error: error
                        });
                    });
                    // Create text role
                    await guild.roles.create({
                        data: {
                            name: `Text ${voice_channel.id}`
                        }
                    }).then(async function (text_role) {
                        // Create text channel
                        await guild.channels.create(this_name, {
                            type: 'text',
                            parent: g_channels.get().dedicated.id,
                            position: 1,
                            permissionOverwrites: [
                                {
                                    id: g_roles.get().everyone.id,
                                    deny: ["CREATE_INSTANT_INVITE", "MANAGE_CHANNELS", "MANAGE_ROLES", "MANAGE_WEBHOOKS", "VIEW_CHANNEL", "MENTION_EVERYONE", "MANAGE_MESSAGES", 'MUTE_MEMBERS', 'DEAFEN_MEMBERS', 'MOVE_MEMBERS', 'PRIORITY_SPEAKER']
                                },
                                {
                                    id: g_roles.get().music.id,
                                    allow: ["VIEW_CHANNEL"]
                                },
                                {
                                    id: text_role.id,
                                    allow: ["VIEW_CHANNEL", "SEND_TTS_MESSAGES", "EMBED_LINKS", "ATTACH_FILES"]
                                }
                            ]
                        }).then(async text_channel => {
                            // Create hoisted dedicated role
                            await guild.roles.create({
                                data: {
                                    name: `Team ${this_name}`,
                                    color: '0x00a5ff',
                                    position: g_roles.get().dedicated.position,
                                    hoist: true
                                }
                            }).then(async hoisted_role => {
                                // Set link
                                await text_channel.setTopic(`${voice_channel.id} ${text_role.id} ${hoisted_role.id}`).catch(error => {
                                    g_interface.on_error({
                                        name: 'updateGuild -> .setTopic(text_channel)',
                                        location: 'channels.js',
                                        error: error
                                    });
                                });
                            }).catch(error => {
                                g_interface.on_error({
                                    name: 'updateGuild -> .updateOverwrite(voice_channel)',
                                    location: 'channels.js',
                                    error: error
                                });
                            });

                            // Update voice channel
                            await voice_channel.updateOverwrite(text_role, {
                                VIEW_CHANNEL: true
                            }).catch(error => {
                                g_interface.on_error({
                                    name: 'updateGuild -> .updateOverwrite(voice_channel)',
                                    location: 'channels.js',
                                    error: error
                                });
                            });

                            // Set info
                            let embed = new MessageEmbed();
                            embed.setAuthor('Quarantine Gaming: Dedicated Channels');
                            embed.setTitle(`Voice and Text Channels ${instant ? 'by' : 'for'} ${this_name}`);
                            let channel_desc = new Array();
                            channel_desc.push(`• Only members who are in this voice channel can view this text channel.`);
                            channel_desc.push(`• You can't view other dedicated channels once you're connected to one.`);
                            channel_desc.push(`• ${text_channel} voice and text channels will automatically be deleted once everyone is disconnected from these channels.`);
                            channel_desc.push(`• You can lock this channel by doing "!dedicate lock", and you can do "!dedicate unlock" to unlock it.`);
                            channel_desc.push(`• You can transfer anyone from another voice channel to this voice channel by doing "!transfer <@member>".\n\u200b\u200bEx: "!transfer <@749563476707377222>"`);
                            channel_desc.push(`• You can also transfer multiple users at once.\n\u200b\u200bEx: "!transfer <@749563476707377222> <@749563476707377222> <@749563476707377222>"`);
                            channel_desc.push('Note: <@&749235255944413234> and <@&700397445506531358> can interact with these channels.');
                            embed.setDescription(channel_desc.join('\n\n'));
                            embed.setColor('#7b00ff');
                            await text_channel.send(embed).then(message => {
                                message.pin();
                            }).catch(error => {
                                g_interface.on_error({
                                    name: 'beginDedicate -> .send(embed)',
                                    location: 'channels.js',
                                    error: error
                                });
                            });

                            if (!instant) {
                                // Sort members
                                let streamers = [], members = [];
                                for (let this_member of this_channel.members.array()) {
                                    if (this_member.roles.cache.find(role => role == g_roles.get().streaming)) {
                                        streamers.push(this_member);
                                    } else {
                                        members.push(this_member);
                                    }
                                }
                                // Transfer streamers
                                for (let this_member of streamers) {
                                    await this_member.voice.setChannel(voice_channel).catch(error => {
                                        g_interface.on_error({
                                            name: 'beginDedicate -> .setChannel(voice_channel)',
                                            location: 'channels.js',
                                            error: error
                                        });
                                    });
                                }
                                // Transfer members
                                for (let this_member of members) {
                                    if (this_member.user.id != g_client.user.id) {
                                        await this_member.voice.setChannel(voice_channel).catch(error => {
                                            g_interface.on_error({
                                                name: 'beginDedicate -> .setChannel(voice_channel)',
                                                location: 'channels.js',
                                                error: error
                                            });
                                        });
                                    }
                                }
                            } else {
                                // Transfer user
                                await this_data.member.voice.setChannel(voice_channel).catch(error => {
                                    g_interface.on_error({
                                        name: 'beginDedicate -> .setChannel(voice_channel)',
                                        location: 'channels.js',
                                        error: error
                                    });
                                });
                            }
                        }).catch(error => {
                            g_interface.on_error({
                                name: 'beginDedicate -> .create(text_channel)',
                                location: 'channels.js',
                                error: error
                            });
                        });
                    }).catch(error => {
                        g_interface.on_error({
                            name: 'beginDedicate -> .create(text_role)',
                            location: 'channels.js',
                            error: error
                        });
                    });
                }).catch(error => {
                    g_interface.on_error({
                        name: 'beginDedicate -> .create(voice_channel)',
                        location: 'channels.js',
                        error: error
                    });
                });
            }
        }
    }
    is_dedicating = false;
}

const dedicate = function (member, name, instant) {
    dedicate_queue.push({
        member: member,
        name: name,
        instant: instant
    });
    if (!is_dedicating) beginDedicate();
}

module.exports = {
    init,
    get,
    dedicate
}