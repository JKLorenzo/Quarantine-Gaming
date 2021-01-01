const { MessageEmbed } = require('discord.js');
const app = require('./app.js');
const constants = require('./constants.js');
const message_manager = require('./message_manager.js');

let errors = new Array();
let threshold_reached = false;
let errors_per_minute = new Array();
let threshold_hit_count = 0;
let is_processing_errors = false;

async function process_errors() {
    while (errors.length > 0) {
        try {
            const details = errors.shift();
            errors_per_minute.push(details);
            setTimeout(() => {
                errors_per_minute.shift();
                if (errors_per_minute.length == 0) threshold_reached = false;
            }, 60000);

            const epm = errors_per_minute.length;

            if (!threshold_reached) {
                const embed = new MessageEmbed();
                embed.setAuthor('Quarantine Gaming: Telemetry');
                embed.setTitle('Exception Details');
                if (details.name) {
                    embed.addField('Function', details.name);
                }
                if (details.error) {
                    embed.addField('Message', details.error);
                }
                if (details.location) {
                    embed.addField('Location', details.location);
                }
                if (details.error.code) {
                    embed.addField('Code', details.error.code);
                }
                embed.addField('Errors per Minute', epm);
                embed.addField('Threshold Hit', threshold_reached ? 'True' : 'False');
                embed.addField('Threshold Hit Count', threshold_hit_count);
                embed.setThumbnail('https://mir-s3-cdn-cf.behance.net/project_modules/disp/c9955d46715833.589222657aded.png');
                embed.setColor('#FF0000');
                await message_manager.sendToChannel(constants.channels.qg.logs, embed);
            }

            if ((epm > 5 || details.error.code == '500') && !threshold_reached) {
                // Change bot presence
                app.setActivity(`SERVER RESTART (${++threshold_hit_count})`);

                // Announce
                await message_manager.sendToChannel(constants.channels.server.announcements, `**Discord Status Updates**\nDiscord is currently having some issues and may impact users on this server. Visit <https://discordstatus.com/> for more info.`).catch(async () => {
                    const embed = new MessageEmbed();
                    embed.setAuthor('Limited Functionality');
                    embed.setTitle('Discord Status Updates');
                    embed.setDescription(`Discord is currently having some issues and may impact users on this server. Visit <https://discordstatus.com/> for more info.`);
                    embed.setColor('ffe300');
                    await message_manager.sendToChannel(constants.channels.server.announcements, embed);
                });

                // Notify staffs
                await message_manager.sendToChannel(constants.channels.server.management, `I'm currently detecting issues with Discord; some functionalities are disabled. A bot restart is recommended once the issues are resolved.`).catch(async () => {
                    const embed = new MessageEmbed();
                    embed.setAuthor('Limited Functionality');
                    embed.setTitle('Issues with Discord');
                    embed.setDescription(`I'm currently detecting issues with Discord; some functionalities are disabled. A bot restart is recommended once the issues are resolved.`);
                    embed.setColor('ffe300');
                    await message_manager.sendToChannel(constants.channels.server.management, embed);
                });
                threshold_reached = true;
            }
        } catch (error) {
            console.log(error);
        }
    }
    is_processing_errors = false;
}

module.exports = {
    mark: function (ticket) {
        errors.push(ticket);
        if (!is_processing_errors) {
            is_processing_errors = true;
            process_errors();
        }
    },
    for: function (module) {
        function error_ticket(name, error, root = '') {
            return {
                name: root ? root + ' -> ' + name : name,
                location: module,
                error: error
            }
        }
        return error_ticket;
    }
}