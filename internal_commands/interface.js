const { MessageEmbed } = require('discord.js');

const announce = function (message) {
    try {
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
    } catch (error) {
        g_interface.on_error({
            name: 'announce',
            location: 'interface.js',
            error: error
        });
    }

}

const log = async function (message) {
    try {
        await g_channels.get().log.send(message).catch(error => {
            on_error({
                name: 'log',
                location: 'interface.js',
                error: error
            });
        });
    } catch (error) {
        g_interface.on_error({
            name: 'log',
            location: 'interface.js',
            error: error
        });
    }
}


let errors = new Array();
let is_processing_errors = false;
const on_error = function (details) {
    try {
        errors.push(details);
        if (!is_processing_errors) {
            process_errors();
        }
    } catch (error) {
        g_interface.on_error({
            name: 'on_error',
            location: 'interface.js',
            error: error
        });
    }

}

let threshold_reached = false;
let errors_per_minute = new Array();
let threshold_hit_count = 0;
async function process_errors() {
    is_processing_errors = true;
    while (errors.length > 0) {
        try {
            const details = errors.shift();

            errors_per_minute.push(details);
            setTimeout(() => {
                // Remove expired
                errors_per_minute.shift();
                // Reset when EPM is below threshold
                if (errors_per_minute.length == 0) threshold_reached = false;
            }, 60000);

            const epm = errors_per_minute.length;
            if (epm > 5 && !threshold_reached) {
                // Change bot presence
                g_functions.setActivity(`SERVER RESTART (${++threshold_hit_count})`);

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
            }

            if (!threshold_reached) {
                let embed = new MessageEmbed();
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
                await log(embed);
            }
        } catch (error) {
            g_interface.on_error({
                name: 'process_errors',
                location: 'interface.js',
                error: error
            });
        }
    }

    is_processing_errors = false;
}

const updates = async function (message) {
    try {
        return new Promise(async (resolve, reject) => {
            await g_channels.get().updates.send(message).then(message => {
                resolve(message);
            }).catch(error => {
                reject(error);
            });
        });
    } catch (error) {
        g_interface.on_error({
            name: 'updates',
            location: 'interface.js',
            error: error
        });
    }
}

const dm = async function (message) {
    try {
        return new Promise(async (resolve, reject) => {
            await g_channels.get().dm.send(message).then(message => {
                resolve(message);
            }).catch(error => {
                reject(error);
            });
        });
    } catch (error) {
        g_interface.on_error({
            name: 'dm',
            location: 'interface.js',
            error: error
        });
    }
}

// Interface Module Functions
module.exports = {
    on_error,
    log,
    dm,
    announce,
    updates
}