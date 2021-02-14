// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');
// eslint-disable-next-line no-unused-vars
const OpusScript = require('opusscript');
const googleTTS = require('google-tts-api');
const functions = require('./functions.js');
const classes = require('./classes.js');
/** @type {import('./error_manager.js')} */
let error_manager;

const ErrorTicketManager = new classes.ErrorTicketManager('speech.js');
const SpeechManager = new classes.ProcessQueue(5000);

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
	await SpeechManager.queue();
	let connection;
	try {
		// Format words
		for (const word of format_words) {
			message = message.split(word.original).join(word.formatted);
		}
		// Join channel
		connection = await channel.join();
		// TTS
		const url = googleTTS.getAudioUrl(message, {
			lang: 'en-US',
			slow: false,
			host: 'https://translate.google.com',
		});
		// Speak to channel
		const dispatcher = connection.play(url);
		dispatcher.on('finish', async () => {
			await functions.sleep(2500);
			await channel.leave();
			SpeechManager.finish();
			return;
		});
	}
	catch (error) {
		error_manager.mark(ErrorTicketManager.create('say', error));
		await functions.sleep(1000);
		if (connection) channel.leave();
		SpeechManager.finish();
		return;
	}
};