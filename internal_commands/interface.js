const { MessageEmbed } = require('discord.js');
const googleTTS = require('google-tts-api');
const OpusScript = require('opusscript'); // for TTS

let this_guild, this_log, this_subscription, this_interface;

const init = function (this_client) {
    this_guild = this_client.guilds.cache.get('351178660725915649');
    this_log = this_guild.channels.cache.get('722760285622108210');
    this_subscription = this_guild.channels.cache.get('699763763859161108');
    this_interface = this_guild.channels.cache.get('749763548090990613');
}

const get = function (name) {
    switch (name) {
        case 'guild':
            return this_guild;
        case 'log':
            return this_log;
        case 'subscription':
            return this_subscription;
        case 'interface':
            return this_interface;
    }
}

const log = async function (message) {
    await this_log.send(message).catch(error => {
        on_error({
            name: 'log',
            location: 'interface.js',
            error: error
        });
    });
}

const on_error = async function (details) {
    let embed = new MessageEmbed()
        .setAuthor(details.name)
        .setTitle(`${details.location} Error`)
        .setDescription(`An error occured while performing ${details.name} function on ${details.location}.`)
        .addField('Error Message', details.error)
        .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Antu_dialog-error.svg/1024px-Antu_dialog-error.svg.png')
        .setColor('#FF0000');
    await log({ content: '<@393013053488103435>', embed: embed });
    console.log(`An error occured while performing ${details.name} function on ${details.location}.`);
    console.log(details.error);
}

const subscription = async function (message) {
    await this_subscription.send(message).catch(error => {
        on_error({
            name: 'subscription',
            location: 'interface.js',
            error: error
        });
    });
}

const dm = async function (member, message) {
    await member.createDM().then(async dm_channel => {
        await dm_channel.send(message).catch(error => {
            on_error({
                name: 'dm -> .send()',
                location: 'interface.js',
                error: error
            });
        });
    }).catch(error => {
        on_error({
            name: 'dm -> .createDM()',
            location: 'interface.js',
            error: error
        });
    });

}

const sleep = function (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let is_saying = false;
const format_words = [
    { original: 'VALORANT', formatted: 'Valorant' },
    { original: 'TEKKEN', formatted: 'Tekken' },
    { original: 'ROBLOX', formatted: 'Roblox' },
    { original: 'MONSTER HUNTER: WORLD', formatted: 'Monster Hunter: World' },
    { original: 'DOOMEternal', formatted: 'Doom Eternal' },
    { original: 'FINAL FANTASY XIV', formatted: 'Final Fantasy 14' },
    { original: 'Total War: WARHAMMER II', formatted: 'Total War: War Hammer 2' },
    { original: 'A Total War Saga: TROY', formatted: 'A Total War Saga: Troy' }
];
const say = async function (message, channel) {
    while (is_saying) {
        await sleep(500);
    }
    is_saying = true;

    return new Promise(async (resolve, reject) => {
        try {
            // Format words
            for (let word of format_words) {
                message = message.split(word.original).join(word.formatted);
            }
            // Begin TTS
            await channel.join().then(async connection => {
                await googleTTS(message).then(async (url) => {
                    const dispatcher = await connection.play(url);
                    dispatcher.on('speaking', async speaking => {
                        if (!speaking) {
                            await sleep(1000);
                            await channel.leave();
                            is_saying = false;
                            resolve();
                        }
                    });
                });
            });
        } catch (error) {
            is_saying = false;
            reject(error);
        };
    });
}

let is_dedicating = false, dedicate_queue = new Array();
const parentID = '749231470396309535';
async function beginDedicate() {
    is_dedicating = true;
    while (dedicate_queue.length > 0) {
        let this_data = dedicate_queue.shift();
        let this_name = this_data.name;
        let this_channel = this_data.member.voice.channel;

        if (this_channel) {
            // Notify voice channel
            await say(`Transferring to ${this_name} dedicated channel. Please wait.`, this_channel).catch(error => {
                on_error({
                    name: 'beginDedicate -> .say()',
                    location: 'interface.js',
                    error: error
                });
            });

            // Create voice channel
            await this_guild.channels.create(this_name, {
                type: 'voice',
                parent: parentID,
                position: 1,
                permissionOverwrites: [
                    {
                        id: this_guild.roles.everyone.id,
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
                // Create text role
                await this_guild.roles.create({
                    data: {
                        name: `Text ${voice_channel.id}`,
                        color: '0x7b00ff'
                    }
                }).then(async function (text_role) {
                    // Create text channel
                    await this_guild.channels.create(this_name, {
                        type: 'text',
                        parent: parentID,
                        position: 1,
                        permissionOverwrites: [
                            {
                                id: this_guild.roles.everyone.id,
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
                                location: 'dynamic_channels.js',
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
                            on_error({
                                name: 'beginDedicate -> .send(embed)',
                                location: 'interface.js',
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
                                on_error({
                                    name: 'beginDedicate -> .setChannel(voice_channel)',
                                    location: 'interface.js',
                                    error: error
                                });
                            });
                        }
                        // Transfer members
                        for (let this_member of members) {
                            if (this_member.user.id != '749563476707377222') {
                                await this_member.voice.setChannel(voice_channel).catch(error => {
                                    on_error({
                                        name: 'beginDedicate -> .setChannel(voice_channel)',
                                        location: 'interface.js',
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
                                            on_error({
                                                name: 'beginDedicate -> .react(this_reaction)',
                                                location: 'interface.js',
                                                error: error
                                            });
                                        });
                                    }
                                }).catch(error => {
                                    on_error({
                                        name: 'beginDedicate -> .send(embed)',
                                        location: 'interface.js',
                                        error: error
                                    });
                                });
                                break;
                        }
                    }).catch(error => {
                        on_error({
                            name: 'beginDedicate -> .create(text_channel)',
                            location: 'interface.js',
                            error: error
                        });
                    });
                }).catch(error => {
                    on_error({
                        name: 'beginDedicate -> .create(text_role)',
                        location: 'interface.js',
                        error: error
                    });
                });
            }).catch(error => {
                on_error({
                    name: 'beginDedicate -> .create(voice_channel)',
                    location: 'interface.js',
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

// Interface Module Functions
module.exports = {
    init,
    get,
    log,
    on_error,
    subscription,
    dm,
    say,
    dedicate,
    sleep
}