const fetch = require('node-fetch');

let client, results = new Array();

function htmlEntities(str) {
    return String(str).replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"');
}

async function get(init = false) {
    console.log('**Updating Feed**');
    await fetch('https://www.reddit.com/r/FreeGameFindings/new/.json?limit=10&sort=new').then(data => data.json()).then(async data => {
        for (let child of data.data.children) {
            let item = child.data;
            let item_details = {
                title: htmlEntities(item.title),
                url: item.url,
                author: item.author,
                description: htmlEntities(item.selftext),
                validity: item.upvote_ratio * 100,
                score: item.score
            };

            if (!results.includes(item_details.title)) {
                results.push(item_details.title);
                if (!init) {
                    g_fgu.push(item_details);
                }
            }

            await g_interface.get('subscription').messages.fetch({ limit: 5 }).then(async messages => {
                let this_messages = new Array();
                messages.map(msg => {
                    if (msg.author.bot && msg.embeds[0].url == item_details.url) {
                        this_messages.push(msg);
                    }
                    return msg;
                });
                if (this_messages.length > 0) {
                    let this_message = this_messages[0];
                    if (item_details.description) {
                        this_message.embeds[0].spliceFields(1, 3)
                            .addFields([
                                { name: 'Validity', value: `${item_details.validity} %`, inline: true },
                                { name: 'Score', value: `${item_details.score}`, inline: true },
                                { name: 'Details', value: `${item_details.description}` }
                            ])
                            .setTimestamp();
                    } else {
                        this_message.embeds[0].spliceFields(1, 2)
                            .addFields([
                                { name: 'Validity', value: `${item_details.validity} %`, inline: true },
                                { name: 'Score', value: `${item_details.score}`, inline: true }
                            ])
                            .setTimestamp();
                    }
                    await this_message.edit({ content: this_message.content, embed: this_message.embeds[0] }).catch(error => {
                        g_interface.on_error({
                            name: 'get -> edit(this_message)',
                            location: 'feed.js',
                            error: error
                        });
                    });
                }
            });
        }
    }).catch(error => {
        g_interface.on_error({
            name: 'get -> fetch()',
            location: 'feed.js',
            error: error
        });
    });
}

const init = function (this_client) {
    client = this_client;
    // First feed fetch
    get(true);
    // Future feed fetchs every 30 mins
    setInterval(() => {
        get();
    }, 1800000);
}

module.exports = {
    init
}