import fs from 'fs';
import {
  joinVoiceChannel,
  createAudioResource,
  createAudioPlayer,
  entersState,
  AudioPlayerStatus,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import gtts from 'node-google-tts-api';
import { ErrorTicketManager, ProcessQueue } from '../utils/Base.js';

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
      let connection;
      try {
        const player = createAudioPlayer();
        connection = joinVoiceChannel({
          adapterCreator: channel.guild.voiceAdapterCreator,
          guildId: channel.guild.id,
          channelId: channel.id,
        });
        connection.subscribe(player);

        const data = await tts.get({
          text: message,
          lang: 'en',
        });
        fs.writeFileSync('tts.mp3', data);

        connection.on(VoiceConnectionStatus.Ready, () => {
          player.play(createAudioResource('tts.mp3'));
        });
        await entersState(player, AudioPlayerStatus.Playing, 10e3);
        await entersState(player, AudioPlayerStatus.Idle, 30e3);
      } catch (this_error) {
        this.client.error_manager.mark(ETM.create('say', this_error));
      } finally {
        if (connection) connection.destroy();
        console.log(
          `Speech: Finished ${this.queuer.currentID} (${channel.name})`,
        );
      }
    });
  }
}
