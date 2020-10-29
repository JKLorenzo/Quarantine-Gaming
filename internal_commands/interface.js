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

const on_error = async function (details) {
    let embed = new MessageEmbed()
        .setAuthor(details.name)
        .setTitle(`${details.location} Error`)
        .setDescription(`An error occured while performing ${details.name} function on ${details.location}.`)
        .addField('Error Message', details.error)
        .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Antu_dialog-error.svg/1024px-Antu_dialog-error.svg.png')
        .setColor('#FF0000');
    await log({ content: '<@393013053488103435>', embed: embed });
    console.log(`An error occured while performing ${details.name} function on ${details.location}.`);
    console.log(details.error);
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

const dm = async function (member, content) {
    if (member.user.bot) return;
    await member.createDM().then(async dm_channel => {
        await dm_channel.send(content).then(message => {
            message.delete({ timeout: 3600000 }).catch(error => { });
        }).catch(error => {
            on_error({
                name: `dm -> [${member}].send(${content})`,
                location: 'interface.js',
                error: error
            });
        });
    }).catch(error => {
        on_error({
            name: `dm -> .createDM(${member})`,
            location: 'interface.js',
            error: error
        });
    });
}

const clear_dms = function () {
    for (let member of g_channels.get().guild.members.cache.array()) {
        if (!member.user.bot) {
            member.createDM().then(async dm_channel => {
                dm_channel.messages.fetch().then(async messages => {
                    for (let message of messages) {
                        message[1].delete().catch(error => { });;
                    }
                }).catch(error => { });
            }).catch(error => {
                on_error({
                    name: 'clear_dms -> .createDM()',
                    location: 'interface.js',
                    error: error
                });
            });
        }
    }
}

// Interface Module Functions
module.exports = {
    on_error,
    log,
    dm,
    announce,
    updates,
    clear_dms
}