const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');
const functions = require('../../modules/functions');
let message_manager = require('../../modules/message_manager');
let reaction_manager = require('../../modules/reaction_manager');

module.exports = class Audio extends Command {
    constructor(client) {
        super(client, {
            name: 'audio',
            group: 'experience',
            memberName: 'audio',
            description: 'Summon the audio control extension for voice channels.',
            guildOnly: true
        });
    }

    async run(message) {
        // Link
        const Modules = functions.parseModules(GlobalModules);
        message_manager = Modules.message_manager;
        reaction_manager = Modules.reaction_manager;

        const embed = new MessageEmbed();
        embed.setColor('#ffff00');
        embed.setAuthor('Quarantine Gaming: Experience');
        embed.setThumbnail('http://www.extensions.in.th/amitiae/2013/prefs/images/sound_icon.png');
        embed.setTitle('Audio Control Extension for Voice Channels');
        embed.setDescription('Mute or unmute all members on your current voice channel.');
        embed.addFields(
            { name: 'Actions:', value: '🟠 - Mute', inline: true },
            { name: '\u200b', value: '🟢 - Unmute', inline: true }
        );
        embed.setFooter('Apply selected actions by reacting below.');
        
        const SentMessage = await message_manager.sendToChannel(message.channel, embed);
        const reactions = ['🟠', '🟢'];
        for (const reaction of reactions) {
            reaction_manager.addReaction(SentMessage, reaction);
        }
    }
};