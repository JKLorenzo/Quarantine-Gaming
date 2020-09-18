const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');

module.exports = class AmongUs extends Command {
    constructor(client) {
        super(client, {
            name: 'amongus',
            group: 'services',
            memberName: 'amongus',
            description: 'Manually summon the Audio Control Extension Feature for Among Us on you current text channel.',
            guildOnly: true
        });
    }

    async run(message) {
        let embed = new MessageEmbed()
            .setColor('#ffff00')
            .setAuthor('Quarantine Gaming Experience')
            .setThumbnail('https://yt3.ggpht.com/a/AATXAJw5JZ2TM56V4OVFQnVUrOZ5_E2ULtrusmsTdrQatA=s900-c-k-c0xffffffff-no-rj-mo')
            .setTitle('Among Us')
            .setDescription('Voice channel audio control extension.')
            .addFields(
                { name: 'Actions:', value: '🟠 - Mute', inline: true },
                { name: '\u200b', value: '🟢 - Unmute', inline: true }
            )
            .setImage('https://i.pinimg.com/736x/75/69/4f/75694f713b0ab52bf2065ebee0d80f57.jpg')
            .setFooter('Mute or unmute all members on your current voice channel.');

        let reactions = new Array();
        reactions.push('🟠');
        reactions.push('🟢');
        message.say(embed).then(async this_message => {
            for (let this_reaction of reactions) {
                await this_message.react(this_reaction).catch(error => {
                    g_interface.on_error({
                        name: 'run -> .react(this_reaction)',
                        location: 'amongus.js',
                        error: error
                    });
                });
            }
        }).catch(error => {
            g_interface.on_error({
                name: 'run -> .say(message)',
                location: 'amongus.js',
                error: error
            });
        });
    }
};