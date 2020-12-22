const { MessageEmbed } = require('discord.js');
const constants = require('./constants.js');
const functions = require('./functions.js');
const message = require('./message.js');
const error_manager = require('./error_manager.js');

let global_client;

const error_ticket = error_manager.for('startup.js');

module.exports = {
    client: global_client,
    guild: this.client.guilds.cache.get(constants.guild),
    channel: function (resolvable) {
        return this.guild.channels.resolve(resolvable);
    },
    role: function (resolvable) {
        return this.guild.roles.resolve(resolvable);
    },
    member: function (user) {
        return this.guild.member(user);
    },
    initialize: async function (client) {
        global_client = client;

        try {
            await this.setActivity('!help');

            if (process.env.STARTUP_REASON) {
                const embed = new MessageEmbed();
                embed.setColor('#ffff00');
                embed.setAuthor('Quarantine Gaming', client.user.displayAvatarURL());
                embed.setTitle('Startup Initiated');
                embed.addField('Reason', process.env.STARTUP_REASON);

                await message.sendToChannel(constants.channels.qg.logs, embed);
            }
        } catch (error) {
            error_manager.mark(new error_ticket('instantiate', error));
        }

        return true;
    },
    setActivity: function (value, type = 'LISTENING') {
        return this.client.user.setActivity(value.trim(), {
            type: type.trim().toUpperCase()
        });
    }
}