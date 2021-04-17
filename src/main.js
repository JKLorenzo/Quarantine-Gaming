const Discord = require('discord.js');
const FLAGS = Discord.Intents.FLAGS;
const { CommandoClient } = require('discord.js-commando');
const App = require('./app.js');
const { ExtendedMember, ExtendedMessage } = require('./structures/Base.js');
const path = require('path');
const constants = require('./utils/Constants.js');

Discord.Structures.extend('GuildMember', () => ExtendedMember);
Discord.Structures.extend('Message', () => ExtendedMessage);

const client = new CommandoClient({
	commandPrefix: '!',
	owner: constants.owner,
	partials: [
		'MESSAGE', 'CHANNEL', 'REACTION',
	],
	intents: [
		FLAGS.DIRECT_MESSAGES,
		FLAGS.GUILDS,
		FLAGS.GUILD_BANS,
		FLAGS.GUILD_EMOJIS,
		FLAGS.GUILD_INVITES,
		FLAGS.GUILD_MEMBERS,
		FLAGS.GUILD_MESSAGES,
		FLAGS.GUILD_MESSAGE_REACTIONS,
		FLAGS.GUILD_PRESENCES,
		FLAGS.GUILD_VOICE_STATES,
	],
	presence: {
		activities: [
			{
				name: 'QG Arena',
				type: 'COMPETING',
			},
		],
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
	client.app = new App(client);
});

console.log('Logging in');
client.login(process.env.BOT_TOKEN);