const app = require('./app.js');
const functions = require('./functions.js');

const ChannelMessageManager = functions.createManager(1000);
const DirectMessageManager = functions.createManager(5000);

module.exports = {
    sendToChannel: function (channel_resolvable, message) {
        return new Promise(async (resolve, reject) => {
            await ChannelMessageManager.queue();
            let output, error;
            try {
                output = await app.channel(channel_resolvable).send(message);
            } catch (err) {
                error = err;
            }
            ChannelMessageManager.finish();
            error ? reject(error) : resolve(output)
        });
    },
    sendToUser: function (user_resolvable, message) {
        return new Promise(async (resolve, reject) => {
            await DirectMessageManager.queue();
            let output, error;
            try {
                const member = app.member(user_resolvable);
                const dm_channel = await member.createDM();
                output = await dm_channel.send(message);
                output.delete({ timeout: 3600000 }).catch(() => { });
            } catch (err) {
                error = err;
            }
            DirectMessageManager.finish();
            error ? reject(error) : resolve(output)
        });
    }
}