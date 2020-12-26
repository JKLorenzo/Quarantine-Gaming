const app = require('./app.js');
const functions = require('./functions.js');

const ChannelCreateManager = functions.createManager(5000);
const ChannelDeleteManager = functions.createManager(1000);

module.exports = {
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
        userLimit: null,

        get: function () {
            const GuildCreateChannelOptions;
            if (this.bitrate !== null) options.bitrate = this.bitrate;
            if (this.nsfw !== null) options.nsfw = this.nsfw;
            if (this.parent !== null) options.parent = this.parent;
            if (this.permissionOverwrites !== null) options.permissionOverwrites = this.permissionOverwrites;
            if (this.position !== null) options.position = this.position;
            if (this.rateLimitPerUser !== null) options.rateLimitPerUser = this.rateLimitPerUser;
            if (this.reason !== null) options.reason = this.reason;
            if (this.topic !== null) options.topic = this.topic;
            if (this.type !== null) options.type = this.type;
            if (this.userLimit !== null) options.userLimit = this.userLimit;
            return GuildCreateChannelOptions;
        }
    }) {
        return new Promise(async (resolve, reject) => {
            await ChannelCreateManager.queue();
            let output, error;
            try {
                output = await app.guild.channels.create(options.name, options.get());
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
    }
}