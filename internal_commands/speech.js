const OpusScript = require('opusscript'); // for TTS
const fs = require('fs');
const tts = require('google-translate-tts');

let is_saying = false;

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

const say = async function (message, channel) {
    try {
        while (is_saying) {
            await g_functions.sleep(500);
        }
        is_saying = true;

        return new Promise(async (resolve, reject) => {
            // Format words
            for (let word of format_words) {
                message = message.split(word.original).join(word.formatted);
            }
            // Begin TTS
            await channel.join().then(async connection => {
                let retries = 5, failed;
                do {
                    failed = false;
                    await tts.synthesize({
                        text: message,
                        voice: 'en-US'
                    }).then(async buffer => {
                        fs.writeFileSync('tts.mp3', buffer);
                        const dispatcher = await connection.play('tts.mp3');
                        dispatcher.on('speaking', async speaking => {
                            if (!speaking) {
                                await g_functions.sleep(1000);
                                await channel.leave();
                                is_saying = false;
                                resolve();
                            }
                        });
                    }).catch(async error => {
                        failed = error;
                        retries--;
                        await g_functions.sleep(2500);
                    });
                } while (retries > 0 && failed);

                if (failed) {
                    await channel.leave();
                    is_saying = false;
                    reject(failed);
                }
            }).catch(error => {
                is_saying = false;
                reject(error);
            });
        });
    } catch (error) {
        g_interface.on_error({
            name: 'say',
            location: 'speech.js',
            error: error
        });
    }
}

module.exports = {
    say
}