const { Command } = require('discord.js-commando');
const functions = require('../../modules/functions');
let app = require('../../modules/app');
let message_manager = require('../../modules/message_manager');

module.exports = class TransferCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'transfer',
            group: 'services',
            memberName: 'transfer',
            description: 'Transfer a user/users to your current voice channel.',
            guildOnly: true,
            args: [
                {
                    key: 'users',
                    prompt: 'Mention the user/users you want to transfer.',
                    type: 'string',
                }
            ]
        });
    }

    async run(message, { users }) {
        // Link 
        const Modules = functions.parseModules(GlobalModules);
        app = Modules.app;
        message_manager = Modules.message_manager;

        const voice_channel = app.member(message.author).voice.channel;
        if (voice_channel) {
            for (const user of users.split(' ')) {
                const this_member = app.member(user);
                if (this_member) {
                    if (this_member.voice.channelID) {
                        await this_member.voice.setChannel(voice_channel.id);
                        await message_manager.sendToUser(member, `You have been transfered by ${message.author} to ${voice_channel.name}.`);
                    } else {
                        message.reply(`${this_member} must be connected to a voice channel.`);
                    }
                } else {
                    message.reply(`I can't find user ${user}, please try again.`);
                }
            }
        } else {
            message.reply('You must be connected to a voice channel before you can trasfer other members.');
        }
    }
};