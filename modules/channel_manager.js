const constants = require('./constants.js');
const functions = require('./functions.js');
let app = require('./app.js');

const ChannelCreateManager = functions.createManager(5000);
const ChannelDeleteManager = functions.createManager(1000);

module.exports = {
    initialize: function (t_Modules) {
        // Link
        const Modules = functions.parseModules(t_Modules);
        app = Modules.app;
    },
    create: function (options = {
        name: null,
        bitrate: null,
        nsfw: null,
        parent: null,
        permissionOverwrites: null,
        position: null,
        rateLimitPerUser: null,
        reason: null,
        topic: null,
        type: null,
        userLimit: null
    }) {
        return new Promise(async (resolve, reject) => {
            await ChannelCreateManager.queue();
            let output, error;
            try {
                output = await app.guild().channels.create(options.name, {
                    bitrate: options.bitrate,
                    nsfw: options.nsfw,
                    parent: options.parent,
                    permissionOverwrites: options.permissionOverwrites,
                    position: options.position,
                    rateLimitPerUser: options.rateLimitPerUser,
                    reason: options.reason,
                    topic: options.topic,
                    type: options.type,
                    userLimit: options.userLimit
                });
            } catch (err) {
                error = err;
            }
            ChannelCreateManager.finish();
            error ? reject(error) : resolve(output)
        });
    },
    delete: function (channel) {
        return new Promise(async (resolve, reject) => {
            await ChannelDeleteManager.queue();
            let output, error = '';
            try {
                output = await app.channel(channel).delete();
            } catch (err) {
                error = err;
            }
            ChannelDeleteManager.finish();
            error ? reject(error) : resolve(output)
        })
    },
    clearTempChannels: function () {
        const channels_to_clear = [
            constants.channels.integrations.game_invites,
            constants.channels.qg.testing_ground_text
        ];
        for (let channel of channels_to_clear) {
            app.channel(channel).messages.fetch().then(async messages => {
                for (let message of messages) {
                    message[1].delete({ timeout: 900000 }).catch(() => { }); // Delete after 15 mins
                }
            });
        }
    }
}