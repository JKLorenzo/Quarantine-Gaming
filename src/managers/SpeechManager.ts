import fs from 'fs';
import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
  VoiceConnection,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import { Client, GuildChannelResolvable, VoiceChannel } from 'discord.js';
import gtts from 'node-google-tts-api';
import ErrorTicketManager from '../utils/ErrorTicketManager';
import { sleep } from '../utils/Functions';
import ProcessQueue from '../utils/ProcessQueue';

const ETM = new ErrorTicketManager('Speech Manager');
const tts = new gtts();

export default class SpeechManager {
  client: Client;
  queuer: ProcessQueue;
  connection: VoiceConnection | null;

  constructor(client: Client) {
    this.client = client;
    this.queuer = new ProcessQueue(1000);
    this.connection = null;
  }

  join(channel: GuildChannelResolvable): VoiceConnection {
    try {
      const voice_channel = this.client.channel(channel);
      if (!voice_channel || !(voice_channel instanceof VoiceChannel)) {
        throw new TypeError(
          `${
            (channel as VoiceChannel)?.name ?? channel
          } is not a voice channel.`,
        );
      }
      if (this.connection) this.leave();
      return (this.connection = joinVoiceChannel({
        adapterCreator: voice_channel.guild.voiceAdapterCreator,
        guildId: voice_channel.guild.id,
        channelId: voice_channel.id,
      }));
    } catch (error) {
      this.client.error_manager.mark(ETM.create('join', error));
      throw error;
    }
  }

  leave(): void {
    this.connection?.destroy();
    this.connection = null;
  }

  say(channel: GuildChannelResolvable, message: string): Promise<void> {
    console.log(
      `Speech: Queueing ${this.queuer.totalID} (${
        (channel as VoiceChannel)?.name ?? channel
      })`,
    );
    return this.queuer.queue(async () => {
      try {
        const player = createAudioPlayer();
        this.join(channel).subscribe(player);

        const data = await tts.get({
          text: message,
          lang: 'en',
        });
        fs.writeFileSync('tts.mp3', data);

        if (!this.connection) {
          throw new RangeError('no connection found.');
        }

        this.connection.on(VoiceConnectionStatus.Ready, async () => {
          await sleep(1000);
          player.play(createAudioResource('tts.mp3'));
        });
        await entersState(player, AudioPlayerStatus.Playing, 10e3);
        await entersState(player, AudioPlayerStatus.Idle, 30e3);
      } catch (this_error) {
        this.client.error_manager.mark(ETM.create('say', this_error));
      } finally {
        this.leave();
        console.log(
          `Speech: Finished ${this.queuer.currentID} (${
            (channel as VoiceChannel)?.name ?? channel
          })`,
        );
      }
    }) as Promise<void>;
  }
}
