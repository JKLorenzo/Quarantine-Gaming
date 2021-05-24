import { Intents, Structures } from 'discord.js';
import { Client, ExtendedMember, ExtendedMessage } from './structures/Base.js';

Structures.extend('GuildMember', () => ExtendedMember);
Structures.extend('Message', () => ExtendedMessage);

const FLAGS = Intents.FLAGS;

const client = new Client({
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
				name: '/commands',
				type: 'LISTENING',
			},
		],
		status: 'online',
		afk: false,
	},
});

client.login(process.env.BOT_TOKEN);
console.log('Logging in...');