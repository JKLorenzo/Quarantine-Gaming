import fs from 'fs';
import gtts from 'node-google-tts-api';
import { ErrorTicketManager, ProcessQueue, sleep } from '../utils/Base.js';

/**
 * @typedef {import('discord.js').VoiceChannel} VoiceChannel
 * @typedef {import('../structures/Base').Client} Client
 */

const ETM = new ErrorTicketManager('SpeechManager');
const tts = new gtts();

export default class SpeechManager {
  /**
   * @param {Client} client The QG Client
   */
  constructor(client) {
    this.client = client;
    this.queuer = new ProcessQueue(1000);
  }

  /**
   * Recites the supplied message on the target voice channel.
   * @param {VoiceChannel} channel The channel where the message will be spoken
   * @param {string} message The message to be converted into TTS
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
            console.log(
              `Speech: Finished ${this.queuer.currentID} (${channel.name})`,
            );
            resolve();
          });
          dispatcher.on('error', error => {
            reject(error);
          });
        });
        await speak;
      } catch (this_error) {
        console.log(
          `Speech: Finished ${this.queuer.currentID} (${channel.name})`,
        );
        this.client.error_manager.mark(ETM.create('say', this_error));
      }
    });
  }
}
