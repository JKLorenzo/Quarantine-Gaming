// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');
const gtts = require('node-google-tts-api');
const tts = new gtts();
const fs = require('fs');

module.exports = class SpeechManager {
	/** @param {import('../app.js')} app */
	constructor(app) {
		this.app = app;
		this.queuer = app.utils.ProcessQueue(1000);
		this.ErrorTicketManager = new app.utils.ErrorTicketManager('Speech Manager');
	}

	/**
	 * Recites the supplied message on the target voice channel.
	 * @param {Discord.VoiceChannel} channel
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
						await this.app.utils.sleep(2500);
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
				this.app.error_manager.mark(this.ErrorTicketManager.create('say', this_error));
			}
		});
	}
};