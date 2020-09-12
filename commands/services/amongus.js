const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');

module.exports = class AmongUs extends Command {
    constructor(client) {
        super(client, {
            name: 'amongus',
            group: 'services',
            memberName: 'amongus',
            description: 'Mute or unmute all members on your voice channel.',
            guildOnly: true
        });
    }

    async run(message) {
        message.delete().catch(error => { });
        let embed = new MessageEmbed()
            .setColor('#ffff00')
            .setAuthor('Quarantine Gaming Experience')
            .setTitle('Among Us')
            .setThumbnail(client.user.displayAvatarURL())
            .setDescription('Mute or unmute all members from your voice channel.')
            .addField('Actions:', '🟠 - Mute        🟢 - Unmute')
            .setImage('https://i.pinimg.com/736x/75/69/4f/75694f713b0ab52bf2065ebee0d80f57.jpg');

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