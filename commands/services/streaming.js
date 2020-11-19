const { Command } = require('discord.js-commando');
const { MessageEmbed } = require("discord.js");

module.exports = class StreamingCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'streaming',
            group: 'services',
            memberName: 'streaming',
            description: "Notify all members joining your voice channel that you are currently streaming. This will be turned off automatically once you're offline or disconnected from a voice channel."
        });
    }

    async run(message) {
        const this_member = message.member;
        const this_channel = this_member.voice.channel;
        if (this_channel) {
            const streaming_role = g_roles.get().streaming;
            if (!this_member.roles.cache.find(role => role == streaming_role)) {
                // Add streaming role
                await this_member.roles.add(streaming_role).catch(error => {
                    g_interface.on_error({
                        name: 'run -> .add(streaming_role)',
                        location: 'streaming.js',
                        error: error
                    });
                });

                // Notify voice channel through DM
                let embed = new MessageEmbed();
                embed.setAuthor('Quarantine Gaming: Information');
                embed.setTitle(`${this_member.displayName} is currently Streaming`);
                embed.setDescription('Please observe proper behavior on your current voice channel.')
                embed.setImage('https://pa1.narvii.com/6771/d33918fa87ad0d84b7dc854dcbf6a8545c73f94d_hq.gif');
                embed.setColor('#5dff00');
                for (let member of this_channel.members.array()) {
                    if (member.id != this_member.id) {
                        await g_message_manager.dm_member(member, embed).catch(error => {
                            g_interface.on_error({
                                name: 'run -> .dm_member()',
                                location: 'streaming.js',
                                error: error
                            });
                        });
                    }
                }

                // Notify voice channel through TTS
                await g_speech.say('Be notified: A member in this voice channel is currently streaming.', this_channel).catch(error => {
                    g_interface.on_error({
                        name: 'run -> .say(tts)',
                        location: 'streaming.js',
                        error: error
                    });
                });
            }
        } else {
            message.say('You must be active on a voice channel to run this command.').catch(error => {
                g_interface.on_error({
                    name: 'run -> .say(message)',
                    location: 'streaming.js',
                    error: error
                });
            })
        }
    }
};