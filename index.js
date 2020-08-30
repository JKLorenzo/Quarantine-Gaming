const { CommandoClient } = require('discord.js-commando');
const path = require('path');
const db = require(path.join(__dirname, 'internal_commands', 'database.js'));
const interface = require(path.join(__dirname, 'internal_commands', 'interface.js'))
const feed = require(path.join(__dirname, 'internal_commands', 'feed.js'))

// Global Variables
global.rootDir = path.resolve(__dirname);
global.g_db = db;
global.g_interface = interface;

const client = new CommandoClient({
    commandPrefix: 'sudo ',
    owner: '393013053488103435'
});

client.registry
    .registerDefaultTypes()
    .registerGroups([
        ['management', 'Server Management'],
        ['services', 'Server Services']
    ])
    .registerDefaultGroups()
    .registerDefaultCommands({
        eval: false,
        ping: false,
        prefix: false,
        commandState: false,
    })
    .registerCommandsIn(path.join(__dirname, 'commands'));

client.once('ready', async () => {
    console.log('-------------{  Startup  }-------------');
    interface.init(client);
    await db.init(client);
    await feed.start();
});

client.on('error', console.error);

client.login(process.env.BOT_TOKEN);