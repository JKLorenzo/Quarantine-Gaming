const { Command } = require('discord.js-commando');
const functions = require('../../modules/functions.js');
let app = require('../../modules/app.js');
let speech = require('../../modules/speech.js');

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
                    type: 'string',
                    validate: channelID => {
                        // Link
                        const Modules = functions.parseModules(GlobalModules);
                        app = Modules.app;
                        speech = Modules.speech;

                        if (app.channel(channelID) && !app.channel(channelID).isText())
                            return true;
                        return false;
                    }
                },
                {
                    key: 'content',
                    prompt: `Enter the message to be spoken (en-US).`,
                    type: 'string',
                    validate: content => {
                        if (String(content).length > 0)
                            return true;
                        return false;
                    }
                },
            ]
        });
    }

    async run(message, { channelID, content }) {
        message.delete({ timeout: 5000 }).catch(() => { });
        await speech.say(content, app.channel(channelID));
    }
};