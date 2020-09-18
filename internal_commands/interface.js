const { MessageEmbed } = require('discord.js');
const googleTTS = require('google-tts-api');

let this_guild, this_log, this_subscription, this_interface;

const init = function (this_client) {
    this_guild = this_client.guilds.cache.get('351178660725915649');
    this_log = this_guild.channels.cache.get('722760285622108210');
    this_subscription = this_guild.channels.cache.get('699763763859161108');
    this_interface = this_guild.channels.cache.get('749763548090990613');
}

const get = function (name) {
    switch (name) {
        case 'guild':
            return this_guild;
        case 'log':
            return this_log;
        case 'subscription':
            return this_subscription;
        case 'interface':
            return this_interface;
    }
}

const log = async function (message) {
    await get('log').send(message).catch(error => {
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
    await get('subscription').send(message).catch(error => {
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let is_saying = false;
const say = async function (message, channel) {
    while (is_saying) {
        await sleep(500);
    }
    is_saying = true;

    return new Promise(async (resolve, reject) => {
        try {
            await googleTTS(message).then(async (url) => {
                await channel.join().then(async connection => {
                    const dispatcher = await connection.play(url);
                    dispatcher.on('speaking', async speaking => {
                        if (!speaking) {
                            await sleep(1000);
                            await channel.leave();
                            is_saying = false;
                            resolve();
                        }
                    });
                });
            });
        } catch (error) {
            is_saying = false;
            reject(error);
        };
    });
}

// Interface Module Functions
module.exports = {
    init,
    get,
    log,
    on_error,
    subscription,
    dm,
    say
}