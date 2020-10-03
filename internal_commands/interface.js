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

const subscription = async function (message) {
    await g_channels.get().subscription.send(message).catch(error => {
        on_error({
            name: 'subscription',
            location: 'interface.js',
            error: error
        });
    });
}

const dm = async function (member, message) {
    await member.createDM().then(async dm_channel => {
        await dm_channel.send(message).catch(error => {
            on_error({
                name: 'dm -> .send()',
                location: 'interface.js',
                error: error
            });
        });
    }).catch(error => {
        on_error({
            name: 'dm -> .createDM()',
            location: 'interface.js',
            error: error
        });
    });
}

// Interface Module Functions
module.exports = {
    on_error,
    log,
    dm,
    announce,
    subscription
}