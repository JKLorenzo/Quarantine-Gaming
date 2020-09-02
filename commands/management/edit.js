const { Command } = require('discord.js-commando');

module.exports = class Edit extends Command {
    constructor(client) {
        super(client, {
            name: 'edit',
            group: 'management',
            memberName: 'edit',
            description: 'Edits a message to on a channel.',
            userPermissions: ["ADMINISTRATOR"],
            guildOnly: true,
            args: [
                {
                    key: 'messageID',
                    prompt: 'Enter number of messages to delete.',
                    type: 'integer'
                },
                {
                    key: 'content',
                    prompt: 'Enter the message to send.',
                    type: 'string'
                }
            ]
        });
    }

    async run(message, { messageID, content }) {
        message.delete();
        await message.channel.messages.fetch({ limit: 50 }).then(async messages => {
            let this_messages = new Array();
            messages.map(msg => {
                if (msg.id == messageID) {
                    this_messages.push(msg);
                }
                return msg;
            });
            if (this_messages.length > 0) {
                let this_message = this_messages[0];
                await this_message.edit(content).catch(error => {
                    g_interface.on_error({
                        name: 'run -> .edit(content)',
                        location: 'edit.js',
                        error: error
                    });
                });
            }
        }).catch(error => {
            g_interface.on_error({
                name: 'run -> .fetch(messages)',
                location: 'edit.js',
                error: error
            });
        });
    }
};