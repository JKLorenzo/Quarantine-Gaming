const Discord = require('discord.js');
const { Command } = require('discord.js-commando');
const functions = require('../../modules/functions.js');
/** @type {import('../../modules/message_manager.js')} */
let message_manager;
/** @type {import('../../modules/reaction_manager.js')} */
let reaction_manager;

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

    /** @param {Discord.Message} */
    async run(message) {
        // Link
        const Modules = functions.parseModules(GlobalModules);
        message_manager = Modules.message_manager;
        reaction_manager = Modules.reaction_manager;

        const embed = new Discord.MessageEmbed();
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