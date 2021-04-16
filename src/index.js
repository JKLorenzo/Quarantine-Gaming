const Discord = require('discord.js');
const { CommandoClient } = require('discord.js-commando');
const App = require('./app.js');
const { ExtendedMember } = require('./structures/Base.js');
const path = require('path');
const constants = require('./utils/Constants.js');

Discord.Structures.extend('GuildMember', () => ExtendedMember);

const client = new CommandoClient({
	commandPrefix: '!',
	owner: constants.owner,
	partials: [
		'MESSAGE', 'CHANNEL', 'REACTION',
	],
	intents: [
		'DIRECT_MESSAGES', 'GUILDS', 'GUILD_BANS', 'GUILD_EMOJIS',
		'GUILD_INVITES', 'GUILD_MEMBERS', 'GUILD_MESSAGES',
		'GUILD_MESSAGE_REACTIONS', 'GUILD_PRESENCES', 'GUILD_VOICE_STATES',
	],
	presence: {
		activity: {
			name: 'Gamers Play',
			type: 'WATCHING',
		},
		status: 'online',
		afk: false,
	},
	allowedMentions: {
		parse: [
			'everyone', 'roles', 'users',
		],
		repliedUser: true,
	},
});

client.registry
	.registerDefaultTypes()
	.registerGroups([
		['management', 'Server Management'],
		['services', 'Server Services'],
		['experience', 'Server Experience Extensions'],
	])
	.registerDefaultGroups()
	.registerDefaultCommands({
		prefix: false,
		commandState: false,
	})
	.registerCommandsIn(path.join(__dirname, 'commands'));

client.once('ready', async () => {
	console.log('Ready!');
	const app = new App(client);
	client.app = app;
	await app.actions.startup();
	console.log('Initialized!');
});

console.log('Logging in');
client.login(process.env.BOT_TOKEN);