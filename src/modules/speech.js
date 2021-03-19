// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');
const gtts = require('node-google-tts-api');
const tts = new gtts();
const fs = require('fs');
const functions = require('./functions.js');
const classes = require('./classes.js');
/** @type {import('./error_manager.js')} */
let error_manager;

const ErrorTicketManager = new classes.ErrorTicketManager('speech.js');
const SpeechManager = new classes.Manager;

const format_words = [
	{ original: 'VALORANT', formatted: 'Valorant' },
	{ original: 'TEKKEN', formatted: 'Tekken' },
	{ original: 'ROBLOX', formatted: 'Roblox' },
	{ original: 'MONSTER HUNTER: WORLD', formatted: 'Monster Hunter: World' },
	{ original: 'DOOMEternal', formatted: 'Doom Eternal' },
	{ original: 'FINAL FANTASY XIV', formatted: 'Final Fantasy 14' },
	{ original: 'Total War: WARHAMMER II', formatted: 'Total War: War Hammer 2' },
	{ original: 'A Total War Saga: TROY', formatted: 'A Total War Saga: Troy' },
	{ original: 'ACE COMBAT™ 7: SKIES UNKNOWN', formatted: 'Ace Combat 7: Skies Unknown' },
	{ original: 'VA-11 HALL-A', formatted: 'Vallhalla' },
];

/**
 * Initializes the module.
 * @param {import('discord.js-commando').CommandoClient} ClientInstance The Commando Client instance used to login.
 */
module.exports.initialize = (ClientInstance) => {
	// Link
	error_manager = ClientInstance.modules.error_manager;
};

/**
 * Joins a voice channel and converts the message to an audio then plays it.
 * @param {String} message The text to convert to speech.
 * @param {Discord.VoiceChannel} channel The target voice channel.
 * @returns {Promise<null>} A null promise.
 */
module.exports.say = async (message, channel) => {
	let res, rej;
	const promise = new Promise((resolve, reject) => {
		res = resolve;
		rej = reject;
	});
	console.log(`Speech: Queueing ${SpeechManager.totalID} (${channel.name})`);
	SpeechManager.queue(async function() {
		try {
			// Format words
			for (const word of format_words) {
				message = message.split(word.original).join(word.formatted);
			}
			// Join channel
			const connection = await channel.join();
			// TTS
			const data = await tts.get({
				text: message,
				lang: 'en',
			});
			fs.writeFileSync('tts.mp3', data);
			// Speak to channel
			const dispatcher = connection.play('tts.mp3');
			dispatcher.on('finish', async () => {
				await functions.sleep(2500);
				await channel.leave();
				console.log(`Speech: Finished ${SpeechManager.currentID} (${channel.name})`);
				res();
			});
		}
		catch (this_error) {
			console.log(`Speech: Finished ${SpeechManager.currentID} (${channel.name})`);
			error_manager.mark(ErrorTicketManager.create('say', this_error));
			rej(this_error);
		}
	});
	return promise;
};

module.exports.SpeechManager = SpeechManager;