const { MessageEmbed } = require('discord.js');

const announce = function (message) {
    return new Promise(async (resolve, reject) => {
        await g_channels.get().announcement.send(message).then(msg => {
            resolve(msg);
        }).catch(error => {
            on_error({
                name: 'announce',
                location: 'interface.js',
                error: error
            });
            reject(error);
        });
    });
}

const log = async function (message) {
    await g_channels.get().log.send(message).catch(error => {
        on_error({
            name: 'log',
            location: 'interface.js',
            error: error
        });
    });
}


let errors = new Array();
let is_processing_errors = false;
const on_error = function (details) {
    errors.push(details);
    if (!is_processing_errors) {
        process_errors();
    }
}

let threshold_reached = false;
let errors_per_minute = new Array();
async function process_errors() {
    is_processing_errors = true;

    while (errors.length > 0) {
        const details = errors.shift();

        errors_per_minute.push(details);
        setTimeout(() => {
            // Remove expired
            errors_per_minute.shift();
            // Reset when EPM is below threshold
            if (errors_per_minute.length == 0) threshold_reached = false;
        }, 60000);

        const epm = errors_per_minute.length;

        if (epm > 5) {
            if (!threshold_reached) {
                // Change bot presence
                g_functions.setActivity(`SERVER RESTART`);

                // Announce
                await announce(`**Discord Status Updates**\nDiscord is currently having some issues and may impact users on this server. Visit <https://discordstatus.com/> for more info.`).catch(async () => {
                    let embed = new MessageEmbed();
                    embed.setAuthor('Limited Functionality');
                    embed.setTitle('Discord Status Updates');
                    embed.setDescription(`Discord is currently having some issues and may impact users on this server. Visit <https://discordstatus.com/> for more info.`);
                    embed.setColor('ffe300');
                    await announce(embed).catch(() => { });
                });

                // Notify staffs
                await g_channels.get().staff.send(`I'm currently detecting issues with Discord; some functionalities are disabled. A bot restart is recommended once the issues are resolved.`).catch(async () => {
                    let embed = new MessageEmbed();
                    embed.setAuthor('Limited Functionality');
                    embed.setTitle('Issues with Discord');
                    embed.setDescription(`I'm currently detecting issues with Discord; some functionalities are disabled. A bot restart is recommended once the issues are resolved.`);
                    embed.setColor('ffe300');
                    await g_channels.get().staff.send(embed).catch(() => { });
                });

                threshold_reached = true;
            } else {
                // Suppressed Errors
            }
        } else {
            let embed = new MessageEmbed();
            embed.setAuthor('Quarantine Gaming: Telemetry');
            embed.setTitle('Exception Details');
            embed.addField('Function', details.name);
            embed.addField('Message', details.error);
            embed.addField('Location', details.location);
            embed.addField('Code', details.error.code);
            embed.addField('Errors per Minute', epm);
            embed.setThumbnail('https://mir-s3-cdn-cf.behance.net/project_modules/disp/c9955d46715833.589222657aded.png');
            embed.setColor('#FF0000');
            await log(embed);
        }
    }

    is_processing_errors = false;
}

const updates = async function (message) {
    return new Promise(async (resolve, reject) => {
        await g_channels.get().updates.send(message).then(message => {
            resolve(message);
        }).catch(error => {
            reject(error);
        });
    });
}

const dm = async function (message) {
    return new Promise(async (resolve, reject) => {
        await g_channels.get().dm.send(message).then(message => {
            resolve(message);
        }).catch(error => {
            reject(error);
        });
    });
}

// Interface Module Functions
module.exports = {
    on_error,
    log,
    dm,
    announce,
    updates
}