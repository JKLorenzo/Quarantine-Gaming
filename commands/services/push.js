const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');

module.exports = class PushCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'push',
            group: 'services',
            memberName: 'push',
            description: 'Accepts manual push commands of free game updates.',
            guildOnly: true,
            userPermissions: ["ADMINISTRATOR"],
            args: [
                {
                    key: 'link',
                    prompt: 'Enter the link to the giveaway.',
                    type: 'string',
                }
            ]
        });
    }

    async run(message, { link }) {
        message.delete();
        try {
            await fetch('https://www.reddit.com/r/FreeGameFindings/new/.json?limit=5&sort=new')
                .then(data => data.json())
                .then(data => {
                    for (let child of data.data.children) {
                        let item = child.data;
                        if (item.url == link) {
                            function htmlEntities(str) {
                                return String(str).replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"');
                            }
                            g_interface.push({
                                title: htmlEntities(item.title),
                                url: item.url,
                                author: item.author,
                                description: htmlEntities(item.selftext),
                                validity: item.upvote_ratio*100,
                                score: item.score
                            });
                        }
                    }
                });
        } catch (error) {
            let embed = new MessageEmbed()
                .setAuthor(`Push`)
                .setTitle(`Push.js Error`)
                .setDescription(`An error occured while performing push function on feed.js.`)
                .addField('Error Message', error)
                .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Antu_dialog-error.svg/1024px-Antu_dialog-error.svg.png')
                .setColor('#FF0000');

            g_interface.log(embed);
            console.log(`An error occured while performing push function on feed.js.`);
            console.log(`\n${error}\n`);
        }
        return;
    }
};