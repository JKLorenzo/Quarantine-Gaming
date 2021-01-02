const { Command } = require('discord.js-commando');
const { MessageEmbed } = require("discord.js");
const functions = require('../../modules/functions.js');
const constants = require('../../modules/constants.js');
let app = require('../../modules/app.js');
let general = require('../../modules/general.js');
let message_manager = require('../../modules/message_manager.js');

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

    async run(message, { name }) {
        // Link
        const Modules = functions.parseModules(GlobalModules);
        app = Modules.app;
        general = Modules.general;
        message_manager = Modules.message_manager;

        const voice_channel = app.member(message.author).voice.channel;
        if (voice_channel) {
            if (name.toLowerCase() == 'lock' || name.toLowerCase() == 'unlock') {
                if (voice_channel.parentID == constants.channels.category.dedicated) {
                    const text_channel = app.guild().channels.cache.find(channel => channel.type == 'text' && channel.topic && channel.topic.split(' ')[0] == voice_channel.id);
                    const embed = new MessageEmbed();
                    embed.setAuthor('Quarantine Gaming: Dedicated Channels');
                    embed.setThumbnail(message.author.displayAvatarURL());
                    embed.setFooter(`${message.author.tag} (${message.author.id})`);
                    embed.setTimestamp();
                    embed.setColor('#ffe500');
                    switch (name) {
                        case 'lock':
                            await voice_channel.updateOverwrite(constants.roles.member, {
                                'CONNECT': false
                            });
                            embed.setTitle(voice_channel.name);
                            embed.setDescription(`${message.author} locked this channel.`);
                            await message_manager.sendToChannel(text_channel, embed);
                            break;
                        case 'unlock':
                            await voice_channel.updateOverwrite(constants.roles.member, {
                                'CONNECT': true
                            });
                            embed.setTitle(voice_channel.name);
                            embed.setDescription(`${message.author} unlocked this channel.`);
                            await message_manager.sendToChannel(text_channel, embed);
                            break
                    }
                } else {
                    message.reply(`You must be on a dedicated channel to lock or unlock a voice channel.`).catch(() => { });
                }
            } else {
                // Only allow on voice channels and dedicated channels category
                if (voice_channel.parentID == constants.channels.category.voice || voice_channel.parentID == constants.channels.category.dedicated) {
                    // check if it is mentionable
                    name = name.trim();
                    if (name.startsWith('<') && name.endsWith('>')) {
                        // Role
                        const role = app.role(name);
                        const channel = app.channel(name);
                        const member = app.member(name);
                        if (role) name = functions.toAlphanumericString(role.name);
                        if (channel) name = functions.toAlphanumericString(channel.name);
                        if (member) name = member.displayName;

                        message.reply(`Got it! Please wait while I'm preparing **${name}** voice and text channels.`).catch(() => { });
                        await general.dedicateChannel(voice_channel, name);
                    } else {
                        // Filter
                        name = name.split(' ').map(word => {
                            return functions.toAlphanumericString(word);
                        }).join(' ')
                        message.reply(`Got it! Please wait while I'm preparing **${name}** voice and text channels.`).catch(() => { });
                        await general.dedicateChannel(voice_channel, name);
                    }
                } else {
                    message.reply(`You can't create a dedicated channel from your current voice channel. Join one of the Voice Room channels to create a dedicated channel.`).catch(() => { });
                }
            }
        } else {
            message.reply(`You must be connected to any Voice Room channels to create a dedicated channel.`).catch(() => { });
        }
    }
};