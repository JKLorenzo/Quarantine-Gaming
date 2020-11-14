const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');

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
        message.delete({ timeout: 60000 }).catch(error => { });
        let embed = new MessageEmbed()
            .setColor('#ffff00')
            .setAuthor('Quarantine Gaming: Experience')
            .setThumbnail('http://www.extensions.in.th/amitiae/2013/prefs/images/sound_icon.png')
            .setTitle('Audio Control Extension for Voice Channels')
            .setDescription('Mute or unmute all members on your current voice channel.')
            .addFields(
                { name: 'Actions:', value: '🟠 - Mute', inline: true },
                { name: '\u200b', value: '🟢 - Unmute', inline: true }
            )
            .setFooter('Apply selected actions by reacting below.');

        let reactions = new Array();
        reactions.push('🟠');
        reactions.push('🟢');
        message.say(embed).then(async this_message => {
            for (let this_reaction of reactions) {
                await this_message.react(this_reaction).catch(error => {
                    g_interface.on_error({
                        name: 'run -> .react(this_reaction)',
                        location: 'audio.js',
                        error: error
                    });
                });
            }
        }).catch(error => {
            g_interface.on_error({
                name: 'run -> .say(message)',
                location: 'audio.js',
                error: error
            });
        });
    }
};