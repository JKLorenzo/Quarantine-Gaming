const { Command } = require('discord.js-commando');
const { MessageEmbed } = require("discord.js");
const parentID = '749231470396309535';
module.exports = class DedicateCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'dedicate',
            group: 'services',
            memberName: 'dedicate',
            description: 'Create a dedicated voice and text channel.',
            guildOnly: true,
            args: [
                {
                    key: 'name',
                    prompt: 'Enter the name of the channel.',
                    type: 'string',
                }
            ]
        });
    }

    async run(message, { name }) {
        // Get current voice channel
        let this_channel = message.member.voice.channel;
        // Create voice channel
        await g_interface.get('guild').channels.create(name, {
            type: 'voice',
            topic: `Voice room dedicated for ${name}.`,
            parent: parentID,
            position: 1,
            permissionOverwrites: [
                {
                    id: g_interface.get('guild').roles.everyone.id,
                    deny: ["CONNECT"]
                },
                {
                    id: '700397445506531358',
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
                await g_interface.get('guild').channels.create(name, {
                    type: 'text',
                    parent: parentID,
                    position: 1,
                    permissionOverwrites: [
                        {
                            id: g_interface.get('guild').roles.everyone.id,
                            deny: ["VIEW_CHANNEL"]
                        },
                        {
                            id: '700397445506531358',
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

                    // Transfer members
                    for (let this_member of this_channel.members.array()) {
                        await this_member.voice.setChannel(voice_channel).catch(error => {
                            g_interface.on_error({
                                name: 'updateGuild -> .setChannel(voice_channel)',
                                location: 'dynamic_channels.js',
                                error: error
                            });
                        });
                    }

                    // Set info
                    let embed = new MessageEmbed();
                    embed.setAuthor('Quarantine Gaming Dedicated Channels');
                    embed.setTitle(`Voice and Text Channels for ${name}`);
                    let channel_desc = new Array();
                    channel_desc.push('• This channel is **invite-only**. Only members who are transfered to this channel can join.');
                    channel_desc.push(`• Only members who are in this voice channel can view this text channel.`);
                    channel_desc.push(`• ${text_channel} voice and text channels will automatically be deleted once everyone is disconnected from these channels.`);
                    channel_desc.push(`• You can transfer anyone from another voice channel to this voice channel, regardless of roles, by doing "!transfer <@member>".\n\u200b\u200bEx: "!transfer <@749563476707377222>"`);
                    channel_desc.push(`• You can also transfer multiple users at once.\n\u200b\u200bEx: "!transfer <@749563476707377222> <@749563476707377222> <@749563476707377222>"`);
                    channel_desc.push('Note: <@&749235255944413234> and <@&700397445506531358> can interact with these channels.');
                    embed.setDescription(channel_desc.join('\n\n'));
                    embed.setColor('#7b00ff');
                    await text_channel.send(embed).then(message => {
                        message.pin();
                    }).catch(error => {
                        g_interface.on_error({
                            name: 'updateChannel -> .send(embed)',
                            location: 'dynamic_channels.js',
                            error: error
                        });
                    });

                    // Add Quarantine Gaming Experience if available
                    switch (name) {
                        case 'Among Us':
                            let embed = new MessageEmbed()
                                .setColor('#ffff00')
                                .setAuthor('Quarantine Gaming Experience')
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
                                            name: 'run -> .react(this_reaction)',
                                            location: 'dynamic_channels.js',
                                            error: error
                                        });
                                    });
                                }
                            }).catch(error => {
                                g_interface.on_error({
                                    name: 'run -> .say(message)',
                                    location: 'dynamic_channels.js',
                                    error: error
                                });
                            });
                            break;
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
        return;
    }
};