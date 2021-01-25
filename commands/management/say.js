const Discord = require('discord.js');
const { Command } = require('discord.js-commando');
const functions = require('../../modules/functions.js');
/** @type {import('../../modules/app.js')} */
let app;
/** @type {import('../../modules/speech.js')} */
let speech;

module.exports = class Say extends Command {
    constructor(client) {
        super(client, {
            name: 'say',
            group: 'management',
            memberName: 'say',
            description: "[Staff] Say a message to a voice channel using Quarantine Gaming's TTS.",
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

    /**
     * 
     * @param {Discord.Message} message 
     * @param {{channelID: String, content: String}} 
     */
    async run(message, { channelID, content }) {
        // Check user permissions
        if (!app.hasRole(message.author, [constants.roles.staff])) {
            return message.reply("You don't have permissions to use this command.");
        }

        message.delete({ timeout: 5000 }).catch(() => { });
        await speech.say(content, app.channel(channelID));
    }
};