const { Intents, Structures } = require('discord.js');
const { Client, ExtendedMember, ExtendedMessage } = require('./structures/Base.js');
const { constants } = require('./utils/Base.js');

const FLAGS = Intents.FLAGS;

Structures.extend('GuildMember', () => ExtendedMember);
Structures.extend('Message', () => ExtendedMessage);

const client = new Client({
	ownerID: constants.owner,
}, {
	allowedMentions: {
		parse: [
			'everyone', 'roles', 'users',
		],
		repliedUser: true,
	},
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
	partials: [
		'MESSAGE', 'CHANNEL', 'REACTION',
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
});

client.login(process.env.BOT_TOKEN);
console.log('Logging in...');