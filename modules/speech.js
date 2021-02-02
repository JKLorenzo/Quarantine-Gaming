const Discord = require('discord.js');
const OpusScript = require('opusscript'); // for TTS
const fs = require('fs');
const tts = require('google-translate-tts');
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
    { original: 'A Total War Saga: TROY', formatted: 'A Total War Saga: Troy' }
];

/**
 * Initializes the module.
 * @param {CommandoClient} ClientInstance The Commando Client instance used to login.
 */
module.exports.initialize = (ClientInstance) => {
    // Link
    error_manager = ClientInstance.modules.error_manager;
}

/**
 * Joins a voice channel and converts the message to an audio then plays it.
 * @param {String} message The text to convert to speech.
 * @param {Discord.VoiceChannel} channel The target voice channel.
 * @returns {Promise<null>} A null promise.
 */
module.exports.say = (message, channel) => {
    return new Promise(async (resolve) => {
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
            const buffer = await tts.synthesize({
                text: message,
                voice: 'en',
            });
            // Write TTS to file
            fs.writeFileSync('tts.mp3', buffer);
            await functions.sleep(1000);
            // Speak to channel
            const dispatcher = connection.play('tts.mp3');
            dispatcher.on('speaking', async speaking => {
                if (!speaking) {
                    await functions.sleep(2500);
                    await channel.leave();
                    SpeechManager.finish();
                    resolve();
                }
            });
        } catch (error) {
            if (connection) channel.leave();
            error_manager.mark(ErrorTicketManager.create('say', error));
            SpeechManager.finish();
            resolve();
        }
    });
}