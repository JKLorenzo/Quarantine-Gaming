const Discord = require('discord.js');
const { Command } = require('discord.js-commando');
/** @type {import('../../modules/app.js')} */
let app;
/** @type {import('../../modules/reaction_manager.js')} */
let reaction_manager;

module.exports = class Emoji extends Command {
    constructor(client) {
        super(client, {
            name: 'e',
            group: 'experience',
            memberName: 'emoji',
            description: 'Adds a reaction emoji to any message using all the available Guild Emojis (including Animated Emojis).',
            guildOnly: true,
            args: [
                {
                    key: 'emojiName',
                    prompt: "The name of the guild emoji.",
                    type: 'string',
                    /** @param {String} emojiName */
                    validate: emojiName => {
                        // Link
                        app = this.client.modules.app;

                        let valid = false;
                        for (const name of emojiName.split(' ')) {
                            if (app.guild().emojis.cache.find(emoji => emoji.name == name)) {
                                valid = true;
                            }
                        }
                        return valid;
                    }
                }
            ]
        });
    }

    /**
     * 
     * @param {Discord.Message} message 
     * @param {{emojiName: String}} 
     */
    async run(message, { emojiName }) {
        // Link
        app = this.client.modules.app;
        reaction_manager = this.client.modules.reaction_manager;

        const reference = message.reference;
        if (reference) {
            const message_reference = app.message(reference.channelID, reference.messageID);
            if (message_reference) {
                for (const name of emojiName.split(' ')) {
                    const emoji = app.guild().emojis.cache.find(emoji => emoji.name == name);
                    if (emoji) {
                        reaction_manager.addReaction(message_reference, emoji);
                    }
                }
            } else {
                message.reply("The message you're replying to no longer exists.").then(message => message.delete({ timeout: 10000 }).catch(() => { }));
            }
        } else {
            message.reply('You must reply to a message when using this command.').then(message => message.delete({ timeout: 10000 }).catch(() => { }));
        }

        // Delete command
        message.delete({
            timeout: 2000,
            reason: 'Emoji command'
        });
    }
};