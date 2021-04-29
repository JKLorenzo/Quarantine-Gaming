const { ErrorTicketManager, ProcessQueue, sleep } = require('../utils/Base.js');
const gtts = require('node-google-tts-api');
const tts = new gtts();
const fs = require('fs');

const ETM = new ErrorTicketManager('SpeechManager');

/**
 * @typedef {import('../structures/Base.js').Client} Client
 * @typedef {import('discord.js').VoiceChannel} VoiceChannel
 */

module.exports = class SpeechManager {
	/** @param {Client} client */
	constructor(client) {
		this.client = client;
		this.queuer = new ProcessQueue(1000);
	}

	/**
	 * Recites the supplied message on the target voice channel.
	 * @param {VoiceChannel} channel
	 * @param {String} message
	 * @returns {Promise<null>}
	 */
	say(channel, message) {
		console.log(`Speech: Queueing ${this.queuer.totalID} (${channel.name})`);
		return this.queuer.queue(async () => {
			try {
				// Join channel
				const connection = await channel.join();
				// TTS
				const data = await tts.get({
					text: message,
					lang: 'en',
				});
				fs.writeFileSync('tts.mp3', data);
				// Speak to channel
				const speak = new Promise((resolve, reject) => {
					const dispatcher = connection.play('tts.mp3');
					dispatcher.on('finish', async () => {
						await sleep(2500);
						await channel.leave();
						console.log(`Speech: Finished ${this.queuer.currentID} (${channel.name})`);
						resolve();
					});
					dispatcher.on('error', error => {
						reject(error);
					});
				});
				await speak;
			}
			catch (this_error) {
				console.log(`Speech: Finished ${this.queuer.currentID} (${channel.name})`);
				this.client.error_manager.mark(ETM.create('say', this_error));
			}
		});
	}
};