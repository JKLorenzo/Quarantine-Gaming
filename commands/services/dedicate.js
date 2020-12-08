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
                    message.reply(`You must be on a dedicated channel to lock or unlock a voice channel.`).catch(() => { });
                }
            } else {
                // Only allow on voice channels and dedicated channels category
                if (message.member.voice.channel.parentID == '782163385910951936' || message.member.voice.channel.parentID == '749231470396309535') {
                    // check if it is mentionable
                    name = name.trim();
                    if (name.startsWith('<') && name.endsWith('>')) {
                        const chars = name.split('')
                        const id = chars.map(char => {
                            const parsed = parseInt(char, 10);
                            if (isNaN(parsed)) {
                                return '';
                            } else {
                                return parsed;
                            }
                        }).join('');
                        if (chars.includes('&')) {
                            // Role
                            const role = g_channels.get().guild.roles.cache.get(id);
                            if (role) name = g_functions.string_alphanumeric(role.name);
                        } else if (chars.includes('#')) {
                            // Channel
                            const channel = g_channels.get().guild.channels.cache.get(id);
                            if (channel) name = g_functions.string_alphanumeric(channel.name);
                        } else {
                            // Member
                            const member = g_channels.get().guild.members.cache.get(id);
                            if (member) name = member.displayName;
                        }
                        g_channels.dedicate(message.member, name);
                    } else {
                        // Filter
                        name = name.split(' ').map(word => {
                            return g_functions.string_alphanumeric(word);
                        }).join(' ')
                        g_channels.dedicate(message.member, name);
                    }
                    message.reply(`Got it! Please wait while I'm preparing **${name}** voice and text channels.`).catch(() => { });
                } else {
                    message.reply(`You can't create a dedicated channel from your current voice channel. Join one of the Voice Room channels to create a dedicated channel.`).catch(() => { });
                }
            }
        } else {
            message.reply(`You must be connected to any Voice Room channels to create a dedicated channel.`).catch(() => { });
        }
    }
};