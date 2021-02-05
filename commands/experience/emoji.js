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

        // Delete command
        message.delete({
            timeout: 2000,
            reason: 'Emoji command'
        });

        const reference = message.reference;
        if (reference) {
            const message_reference = app.message(reference.channelID, reference.messageID);
            for (const name of emojiName.split(' ')) {
                const emoji = app.guild().emojis.cache.find(emoji => emoji.name == name);
                if (message_reference && emoji) {
                    reaction_manager.addReaction(message_reference, emoji);
                }
            }
        }
    }
};