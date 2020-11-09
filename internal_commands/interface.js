const { MessageEmbed } = require('discord.js');

const announce = async function (message) {
    await g_channels.get().announcement.send(message).catch(error => {
        on_error({
            name: 'announce',
            location: 'interface.js',
            error: error
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

let unavailable_count = 0;
const on_error = async function (details) {
    if (details.error.code == 503) {
        if (unavailable_count == 0) {
            await announce(`**Discord Status Updates**\nDiscord is currently having some issues and may impact users on this server. Visit <https://discordstatus.com/> for more info.`);
        }
        unavailable_count++;
    } else {
        let embed = new MessageEmbed()
        embed.setAuthor(details.name)
        embed.setTitle(`${details.location} Error`)
        embed.setDescription(`An error occured while performing ${details.name} function on ${details.location}.`)
        embed.addField('Error Message', details.error)
        embed.setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Antu_dialog-error.svg/1024px-Antu_dialog-error.svg.png')
        embed.setColor('#FF0000');
        await log({ content: '<@393013053488103435>', embed: embed });
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