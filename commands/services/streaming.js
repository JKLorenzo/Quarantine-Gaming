const { Command } = require('discord.js-commando');

module.exports = class StreamingCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'streaming',
            group: 'services',
            memberName: 'streaming',
            description: "Notify all members joining your voice channel that you are currently streaming. This will be turned off automatically once you're offline or disconnected from a voice channel.",
            guildOnly: true
        });
    }

    async run(message) {
        message.delete({ timeout: 5000 }).catch(console.error);
        let this_member = message.member;
        let this_channel = this_member.voice.channel;
        if (this_channel) {
            let streaming_role = g_interface.vars().guild.roles.cache.find(role => role.id == '757128062276993115');
            if (!this_member.roles.cache.find(role => role == streaming_role)) {
                // Add streaming role
                await this_member.roles.add(streaming_role).catch(error => {
                    g_interface.on_error({
                        name: 'run -> .add(streaming_role)',
                        location: 'streaming.js',
                        error: error
                    });
                });

                // Notify voice channel
                await g_interface.say('Be notified: A member in this voice channel is currently streaming.', this_channel).catch(error => {
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