const { Command } = require('discord.js-commando');
const { MessageEmbed } = require("discord.js");
const functions = require('../../modules/functions.js');
const constants = require('../../modules/constants.js');
let app = require('../../modules/app.js');
let role_manager = require('../../modules/role_manager.js');
let message_manager = require('../../modules/message_manager.js');
let speech = require('../../modules/speech.js');

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
        // Link
        const Modules = functions.parseModules(GlobalModules);
        app = Modules.app;
        role_manager = Modules.role_manager;
        message_manager = Modules.message_manager;
        speech = Modules.speech;

        const member = app.member(message.author);
        const streaming_role = app.role(constants.roles.streaming);
        if (!member.roles.cache.has(streaming_role)) {
            message.reply("Got it! Your streaming status will be removed once you're disconnected to a voice channel or when you go offline.");

            // Add streaming role
            await role_manager.add(member, streaming_role);

            const voice_channel = member.voice.channel;
            if (voice_channel) {
                // Notify voice channel members through DM
                const embed = new MessageEmbed();
                embed.setAuthor('Quarantine Gaming: Information');
                embed.setTitle(`${member.displayName} is currently Streaming`);
                embed.setDescription('Please observe proper behavior on your current voice channel.')
                embed.setImage('https://pa1.narvii.com/6771/d33918fa87ad0d84b7dc854dcbf6a8545c73f94d_hq.gif');
                embed.setColor('#5dff00');
                for (const the_member of voice_channel.members.array()) {
                    if (member.id != the_member.id) {
                        await message_manager.sendToUser(the_member, embed);
                    }
                }

                // Notify voice channel members through TTS
                await speech.say('Be notified: A member in this voice channel is currently streaming.', voice_channel);
            }
        }
    }
};