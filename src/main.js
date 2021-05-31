import { Intents, Structures } from 'discord.js';
import express from 'express';
import { Client, ExtendedMessage } from './structures/Base.js';

const {
	DIRECT_MESSAGES, GUILDS, GUILD_BANS, GUILD_EMOJIS, GUILD_INVITES, GUILD_MEMBERS,
	GUILD_MESSAGES, GUILD_MESSAGE_REACTIONS, GUILD_PRESENCES, GUILD_VOICE_STATES,
} = Intents.FLAGS;

Structures.extend('Message', () => ExtendedMessage);

const app = express();
const client = new Client({
	allowedMentions: {
		parse: [
			'everyone', 'roles', 'users',
		],
		repliedUser: true,
	},
	intents: [
		DIRECT_MESSAGES,
		GUILDS,
		GUILD_BANS,
		GUILD_EMOJIS,
		GUILD_INVITES,
		GUILD_MEMBERS,
		GUILD_MESSAGES,
		GUILD_MESSAGE_REACTIONS,
		GUILD_PRESENCES,
		GUILD_VOICE_STATES,
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

app.get('/', (req, res) => {
	res.send(client?.ws?.ping ? 'online' : 'offline');
});

app.listen(process.env.PORT || 3000, () => {
	console.log('Server is running...');
	client.login(process.env.BOT_TOKEN);
});