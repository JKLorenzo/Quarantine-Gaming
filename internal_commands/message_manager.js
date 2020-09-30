const { MessageEmbed } = require("discord.js");
const manage = async function (message) {
    // Announcements
    if (message.channel && message.channel.id == g_interface.vars().announcement.id && message.author != g_client.user) {
        message.delete({ timeout: 250 }).catch(console.error);
        g_interface.announce(message.content);
    }

    // Game Invites
    if (message.channel && message.channel.id == g_interface.vars().gaming.id && message.author != g_client.user) {
        message.delete({ timeout: 250 }).catch(console.error);
    }

    // Coordinator
    let this_message = message.content.split(' ').join('');
    if (this_message && this_message.startsWith('<@&') && this_message.endsWith('>') && message.author != g_client.user) {
        let role_id = this_message.slice(3, this_message.length - 1);
        let this_role = g_interface.vars().guild.roles.cache.find(role => role.id == role_id);
        if (this_role && this_role.hexColor == '#00ffff') {
            message.delete({ timeout: 250 }).catch(console.error);
            let this_member = g_interface.vars().guild.member(message.author);
            let embed = new MessageEmbed();
            embed.setAuthor('Quarantine Gaming: Game Coordinator');
            embed.setTitle(this_role.name);
            embed.setDescription(`${this_member.displayName} wants to play ${this_role}.`);
            embed.addField(`Player 1:`, this_member.toString());
            embed.setFooter(`Join this bracket by reacting below.`);
            embed.setColor('#7b00ff');

            let emoji = g_interface.vars().guild.emojis.cache.find(emoji => emoji.name == this_role.name.split(' ').join('').split(':').join('').split('-').join(''));
            let qg_emoji = g_interface.vars().guild.emojis.cache.find(emoji => emoji.name == 'quarantinegaming');
            if (emoji) {
                embed.setThumbnail(emoji.url);
            } else {
                embed.setThumbnail(qg_emoji.url);
            }
            await g_interface.vars().gaming.send({ content: `Inviting all ${this_role} players!`, embed: embed }).then(async message => {
                message.delete({ timeout: 1800000, reason: 'Timed Out' }).catch(console.error);
                if (emoji) {
                    await message.react(emoji).catch(error => {
                        g_interface.on_error({
                            name: 'message -> .react(custom)',
                            location: 'message_manager.js',
                            error: error
                        });
                    });
                } else {
                    await message.react(qg_emoji).catch(error => {
                        g_interface.on_error({
                            name: 'message -> .react(default)',
                            location: 'message_manager.js',
                            error: error
                        });
                    });
                }
            }).catch(error => {
                g_interface.on_error({
                    name: 'message -> .say()',
                    location: 'message_manager.js',
                    error: error
                });
            });
        }
    }
}

module.exports = {
    manage
}