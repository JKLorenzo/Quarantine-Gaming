const constants = require('./constants.js');
const functions = require('./functions.js');
/** @type {import('./app.js')} */
let app;
/** @type {import('./error_manager.js')} */
let error_manager;

let error_ticket;
const ChannelMessageManager = functions.createManager(1000);
const DirectMessageManager = functions.createManager(5000);

module.exports = {
    intialize: function (t_Modules) {
        // Link
        const Modules = functions.parseModules(t_Modules);
        app = Modules.app;
        error_manager = Modules.error_manager;
        error_ticket = error_manager.for('message.js');
    },
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
    },
    process: function (message) {
        try {
            // Help
            if (message.channel && message.content.toLowerCase() == '!help') {
                message.channel.send(`Visit <https://quarantinegamingdiscord.wordpress.com/> to learn more.`);
            }

            // Game Invites Channel Blocking
            if (message.channel && message.channel.id == constants.channels.integrations.game_invites && (message.embeds.length == 0 || (message.embeds.length > 0 && message.embeds[0].author.name != 'Quarantine Gaming: Game Coordinator'))) {
                this.sendToUser(message.author, "Hello there! You can't send any messages in " + message.channel + " channel.");
                message.delete({ timeout: 2500 }).catch(() => { });
            }

            // DM
            if (message.guild == null) {
                const this_member = app.member(message.author);
                if (this_member && !this_member.user.bot) {
                    const embed = new MessageEmbed()
                        .setAuthor('Quarantine Gaming: Direct Message Handler')
                        .setTitle(`New Message`)
                        .setThumbnail(message.author.displayAvatarURL())
                        .addField('Sender:', this_member)
                        .addField('Message:', message.content)
                        .setFooter(`To reply, do: !message dm ${this_member.user.id} <message>`)
                        .setColor(`#00ff6f`);

                    this.sendToChannel(constants.channels.qg.dm, embed);
                }
            }
        } catch (error) {
            error_manager.mark(new error_ticket('incoming', error));
        }
    }
}