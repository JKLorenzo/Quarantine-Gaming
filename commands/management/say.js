const { Command } = require('discord.js-commando');

module.exports = class Say extends Command {
    constructor(client) {
        super(client, {
            name: 'say',
            group: 'management',
            memberName: 'say',
            description: "[Admin Only] Say a message to a voice channel using Quarantine Gaming's TTS.",
            userPermissions: ["ADMINISTRATOR"],
            args: [
                {
                    key: 'channelID',
                    prompt: 'Enter the channel ID of the channel where you want your message to be spoken.',
                    type: 'integer',
                    validate: channelID => g_channels.get().guild.channels.cache.find(channel => channel.id == channelID)
                },
                {
                    key: 'content',
                    prompt: `Enter the message to be spoken.`,
                    type: 'string'
                },
            ]
        });
    }

    run(message, { channelID, content }) {
        message.delete({ timeout: 250 }).catch(() => { });
        g_speech.say(`${content}`, g_channels.get().guild.channels.cache.find(channel => channel.id == channelID));
    }
};