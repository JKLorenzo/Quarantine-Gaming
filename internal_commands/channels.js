const { MessageEmbed } = require("discord.js");
let is_dedicating = false, dedicate_queue = new Array();
const parentID = '749231470396309535';

let guild, c_log, c_subscription, c_staff, c_gaming, c_announcement, c_testing;

const init = function () {
    guild = g_client.guilds.cache.get('351178660725915649');
    c_log = guild.channels.cache.get('722760285622108210');
    c_subscription = guild.channels.cache.get('699763763859161108');
    c_staff = guild.channels.cache.get('749763548090990613');
    c_gaming = guild.channels.cache.get('759755324264808489');
    c_announcement = guild.channels.cache.get('759920653146652682');
    c_testing = guild.channels.cache.get('749579412139278399');
}

const get = function () {
    return {
        guild: guild,
        log: c_log,
        subscription: c_subscription,
        staff: c_staff,
        gaming: c_gaming,
        announcement: c_announcement,
        testing: c_testing
    }
}

async function beginDedicate() {
    is_dedicating = true;
    while (dedicate_queue.length > 0) {
        let this_data = dedicate_queue.shift();
        let this_name = this_data.name;
        let this_channel = this_data.member.voice.channel;

        if (this_channel) {
            // Notify voice channel
            await g_speech.say(`Transferring to ${this_name} dedicated channel. Please wait.`, this_channel).catch(error => {
                g_interface.on_error({
                    name: 'beginDedicate -> .say()',
                    location: 'channels.js',
                    error: error
                });
            });

            // Create voice channel
            await guild.channels.create(this_name, {
                type: 'voice',
                parent: parentID,
                position: 1,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        deny: ["CONNECT"]
                    },
                    {
                        id: '722699433225224233', // Member
                        allow: ["CONNECT"]
                    },
                    {
                        id: '700397445506531358', // Music
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
                        name: `Text ${voice_channel.id}`,
                        color: '0x7b00ff'
                    }
                }).then(async function (text_role) {
                    // Create text channel
                    await guild.channels.create(this_name, {
                        type: 'text',
                        parent: parentID,
                        position: 1,
                        permissionOverwrites: [
                            {
                                id: guild.roles.everyone.id,
                                deny: ["VIEW_CHANNEL"]
                            },
                            {
                                id: '700397445506531358', // Music
                                allow: ["VIEW_CHANNEL"]
                            },
                            {
                                id: text_role.id,
                                allow: ["VIEW_CHANNEL"]
                            }
                        ]
                    }).then(async text_channel => {
                        // Set link
                        await text_channel.setTopic(`${voice_channel.id} ${text_role.id}`).catch(error => {
                            g_interface.on_error({
                                name: 'updateGuild -> .setTopic(text_channel)',
                                location: 'channels.js',
                                error: error
                            });
                        });

                        // Set info
                        let embed = new MessageEmbed();
                        embed.setAuthor('Quarantine Gaming: Dedicated Channels');
                        embed.setTitle(`Voice and Text Channels for ${this_name}`);
                        let channel_desc = new Array();
                        channel_desc.push(`• Only members who are in this voice channel can view this text channel.`);
                        channel_desc.push(`• ${text_channel} voice and text channels will automatically be deleted once everyone is disconnected from these channels.`);
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

                        // Sort members
                        let streamers = [], members = [];
                        for (let this_member of this_channel.members.array()) {
                            if (this_member.roles.cache.find(role => role.id == '757128062276993115')) {
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
                            if (this_member.user.id != '749563476707377222') {
                                await this_member.voice.setChannel(voice_channel).catch(error => {
                                    g_interface.on_error({
                                        name: 'beginDedicate -> .setChannel(voice_channel)',
                                        location: 'channels.js',
                                        error: error
                                    });
                                });
                            }
                        }

                        // Add Quarantine Gaming Experience if available
                        switch (this_name.toLowerCase()) {
                            case 'among us':
                                let embed = new MessageEmbed()
                                    .setColor('#ffff00')
                                    .setAuthor('Quarantine Gaming: Experience')
                                    .setThumbnail('https://yt3.ggpht.com/a/AATXAJw5JZ2TM56V4OVFQnVUrOZ5_E2ULtrusmsTdrQatA=s900-c-k-c0xffffffff-no-rj-mo')
                                    .setTitle('Among Us')
                                    .setDescription('Voice channel audio control extension.')
                                    .addFields(
                                        { name: 'Actions:', value: '🟠 - Mute', inline: true },
                                        { name: '\u200b', value: '🟢 - Unmute', inline: true }
                                    )
                                    .setImage('https://i.pinimg.com/736x/75/69/4f/75694f713b0ab52bf2065ebee0d80f57.jpg')
                                    .setFooter('Mute or unmute all members on your current voice channel.');

                                let reactions = new Array();
                                reactions.push('🟠');
                                reactions.push('🟢');
                                await text_channel.send(embed).then(async this_message => {
                                    await this_message.pin();
                                    for (let this_reaction of reactions) {
                                        await this_message.react(this_reaction).catch(error => {
                                            g_interface.on_error({
                                                name: 'beginDedicate -> .react(this_reaction)',
                                                location: 'channels.js',
                                                error: error
                                            });
                                        });
                                    }
                                }).catch(error => {
                                    g_interface.on_error({
                                        name: 'beginDedicate -> .send(embed)',
                                        location: 'channels.js',
                                        error: error
                                    });
                                });
                                break;
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
    is_dedicating = false;
}

const dedicate = function (member, name) {
    dedicate_queue.push({
        member: member,
        name: name
    });
    if (!is_dedicating) beginDedicate();
}

module.exports = {
    init,
    get,
    dedicate
}