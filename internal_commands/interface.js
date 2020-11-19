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

let error_count = 0;
const on_error = async function (details) {
    // Service Unavailable, User aborted request
    if (error_count == 5) {

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

        error_count++;

    } else {

        error_count++;

        let embed = new MessageEmbed()
        embed.setAuthor('Quarantine Gaming: Telemetry');
        embed.setTitle('Exception Details');
        embed.addField('Function', details.name);
        embed.addField('Message', details.error);
        embed.addField('Location', details.location);
        embed.addField('Code', details.error.code);
        embed.setThumbnail('https://mir-s3-cdn-cf.behance.net/project_modules/disp/c9955d46715833.589222657aded.png');
        embed.setColor('#FF0000');
        await log(embed);
    }
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