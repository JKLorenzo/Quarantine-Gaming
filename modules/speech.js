const OpusScript = require('opusscript'); // for TTS
const fs = require('fs');
const tts = require('google-translate-tts');
const functions = require('./functions.js');
let error_manager = require('./error_manager.js');

const error_ticket = error_manager.for('speech.js');
const SpeechManager = functions.createManager(5000);

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

module.exports = {
    initialize: function (t_Modules) {
        // Link
        const Modules = functions.parseModules(t_Modules);
        error_manager = Modules.error_manager;
    },
    say: function (message, voice_channel) {
        return new Promise(async (resolve) => {
            await SpeechManager.queue();
            let connection;
            try {
                // Format words
                for (let word of format_words) {
                    message = message.split(word.original).join(word.formatted);
                }
                // Join channel
                connection = await voice_channel.join();
                // TTS
                const buffer = await tts.synthesize({
                    text: message,
                    voice: 'en-US'
                });
                // Write TTS to file
                fs.writeFileSync('tts.mp3', buffer);
                // Speak to channel
                const dispatcher = await connection.play('tts.mp3');
                dispatcher.on('speaking', async speaking => {
                    if (!speaking) {
                        await g_functions.sleep(1000);
                        await voice_channel.leave();
                        SpeechManager.finish();
                        resolve();
                    }
                });
            } catch (error) {
                if (connection) await voice_channel.leave().catch(() => { });
                error_manager.mark(new error_ticket('say', error));
                SpeechManager.finish();
                resolve();
            }
        });
    }
}