const { MessageEmbed } = require('discord.js');
const app = require('./app.js');
const constants = require('./constants.js');
const functions = require('./functions.js');
const error_manager = require('./error_manager.js');
const message = require('./message.js');

const error_ticket = error_manager.for('general.js');

module.exports = {
    checkUnlisted: function () {
        try {
            for (let this_member of app.guild.members.cache.array()) {
                // Check if any member doesnt have member role
                if (!this_member.user.bot && !this_member.roles.cache.has(constants.roles.member)) {
                    const created_from = functions.compareDate(this_member.user.createdAt);
                    const embed = new MessageEmbed();
                    embed.setAuthor('Quarantine Gaming: Unlisted Member');
                    embed.setTitle('Member Details');
                    embed.setThumbnail(this_member.user.displayAvatarURL());
                    embed.addFields([
                        { name: 'User:', value: this_member },
                        { name: 'ID:', value: this_member.id },
                        { name: 'Account Created:', value: created_from.days + " days " + created_from.hours + " hours " + created_from.minutes + " minutes" }
                    ]);
                    embed.setColor('#ff5f5f');

                    await message.sendToChannel(constants.channels.server.management, {
                        content: `This user doesn't have a member role. Manual action is required.`,
                        embed: embed
                    });
                }
            }
        } catch (error) {
            error_manager.mark(new error_ticket('checkUnlisted', error));
        }
    }
}