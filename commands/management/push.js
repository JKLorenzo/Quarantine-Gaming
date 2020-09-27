const { Command } = require('discord.js-commando');
const fetch = require('node-fetch');

module.exports = class PushCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'push',
            group: 'management',
            memberName: 'push',
            description: '[Admin Only] Manually push a free game update link.',
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
        message.delete({ timeout: 5000 }).catch(console.error);
        try {
            await fetch('https://www.reddit.com/r/FreeGameFindings/new/.json?limit=25&sort=new').then(data => data.json()).then(data => {
                for (let child of data.data.children) {
                    let item = child.data;
                    if (item.url == link) {
                        function htmlEntities(str) {
                            return String(str).replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"');
                        }
                        g_fgu.push({
                            title: htmlEntities(item.title),
                            url: item.url,
                            author: item.author,
                            description: htmlEntities(item.selftext),
                            validity: item.upvote_ratio * 100,
                            score: item.score,
                            flair: item.link_flair_text,
                            permalink: `https://www.reddit.com${item.permalink}`
                        });
                    }
                }
            });
        } catch (error) {
            g_interface.on_error({
                name: 'run',
                location: 'push.js',
                error: error
            });
        }
        return;
    }
};