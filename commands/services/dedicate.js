const { Command } = require('discord.js-commando');
const { MessageEmbed } = require("discord.js");

module.exports = class DedicateCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'dedicate',
            group: 'services',
            memberName: 'dedicate',
            description: 'Manually create a dedicated voice and text channel.',
            args: [
                {
                    key: 'name',
                    prompt: 'Enter the name of the channel. The name must be within 1 to 30 characters long.',
                    type: 'string',
                    validate: name => name.length > 0 && name.length <= 30
                }
            ]
        });
    }

    run(message, { name }) {
        if (message.member.voice.channel) {
            if (name.toLowerCase() == 'lock' || name.toLowerCase() == 'unlock') {
                if (message.member.voice.channel.parent == g_channels.get().dedicated) {
                    let text_channel = g_channels.get().guild.channels.cache.find(channel => channel.type == 'text' && channel.topic && channel.topic.split(' ')[0] == message.member.voice.channel.id);
                    let embed = new MessageEmbed();
                    embed.setAuthor('Quarantine Gaming: Dedicated Channels');
                    embed.setThumbnail(message.author.displayAvatarURL());
                    embed.setFooter(`${message.author.tag} (${message.author.id})`);
                    embed.setTimestamp();
                    embed.setColor('#ffe500');
                    switch (name) {
                        case 'lock':
                            message.member.voice.channel.updateOverwrite(g_roles.get().member, {
                                'CONNECT': false
                            }).then(channel => {
                                embed.setTitle(channel.name);
                                embed.setDescription(`${message.author} locked this channel.`);
                                text_channel.send(embed).catch(error => {
                                    g_interface.on_error({
                                        name: 'run -> .send(embed) [case lock]',
                                        location: 'dedicate.js',
                                        error: error
                                    });
                                });
                            }).catch(error => {
                                g_interface.on_error({
                                    name: 'run -> .updateOverwrite() [case lock]',
                                    location: 'dedicate.js',
                                    error: error
                                });
                            });
                            break;
                        case 'unlock':
                            message.member.voice.channel.updateOverwrite(g_roles.get().member, {
                                'CONNECT': true
                            }).then(channel => {
                                embed.setTitle(channel.name);
                                embed.setDescription(`${message.author} unlocked this channel.`);
                                text_channel.send(embed).catch(error => {
                                    g_interface.on_error({
                                        name: 'run -> .send(embed) [case unlock]',
                                        location: 'dedicate.js',
                                        error: error
                                    });
                                });
                            }).catch(error => {
                                g_interface.on_error({
                                    name: 'run -> .updateOverwrite() [case unlock]',
                                    location: 'dedicate.js',
                                    error: error
                                });
                            });
                            break
                    }
                } else {
                    message.say(`You must be on a dedicated channel to lock or unlock a voice channel.`).then(this_msg => {
                        this_msg.delete({ timeout: 60000 }).catch(error => { });
                    }).catch(error => { });
                }
            } else {
                g_channels.dedicate(message.member, name);
                message.say(`Got it! Please wait.`).then(this_msg => {
                    this_msg.delete({ timeout: 60000 }).catch(error => { });
                }).catch(error => { });
            }
        } else {
            message.channel.send(`You must be connected to any voice channels to create a dedicated channel.`).then(this_msg => {
                this_msg.delete({ timeout: 60000 }).catch(error => { });
            }).catch(error => { });
        }
    }
};