const fetch = require('node-fetch');

function htmlEntities(str) {
    return String(str).replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"');
}

async function get() {
    console.log('**Updating Feed**');
    await fetch('https://www.reddit.com/r/FreeGameFindings/new/.json?limit=25&sort=new').then(data => data.json()).then(async data => {
        for (let child of data.data.children) {
            let item = child.data;

            let item_details = {
                title: htmlEntities(item.title),
                url: item.url,
                author: item.author,
                description: htmlEntities(item.selftext),
                validity: item.upvote_ratio * 100,
                score: item.score,
                flair: item.link_flair_text,
                permalink: `https://www.reddit.com${item.permalink}`,
                createdAt: item.created_utc
            };

            let today = new Date();
            let published = new Date(item_details.createdAt * 1000);
            let elapsedMinutes = Math.floor((today - published) / 60000);

            let this_notif = g_db.hasRecords(item_details);
            if (this_notif) {
                // Update
                await g_channels.get().updates.messages.fetch(this_notif.id).then(async this_message => {
                    if (item_details.description) {
                        this_message.embeds[0].spliceFields(1, 3)
                            .addFields([
                                { name: 'Trust Factor', value: `${item_details.validity} %`, inline: true },
                                { name: 'Margin', value: `${item_details.score}`, inline: true },
                                { name: 'Details', value: `${item_details.description}` }
                            ])
                            .setTimestamp();
                    } else {
                        this_message.embeds[0].spliceFields(1, 2)
                            .addFields([
                                { name: 'Trust Factor', value: `${item_details.validity} %`, inline: true },
                                { name: 'Margin', value: `${item_details.score}`, inline: true }
                            ])
                            .setTimestamp();
                    }
                    if (item_details.flair) {
                        if (item_details.flair.toLowerCase().indexOf('comment') != -1 || item_details.flair.toLowerCase().indexOf('issue') != -1) {
                            this_message.embeds[0].setDescription(`[${item_details.flair}](${item_details.permalink})`);
                        } else {
                            this_message.embeds[0].setDescription(item_details.flair);
                        }
                    }
                    await this_message.edit({ content: this_message.content, embed: this_message.embeds[0] }).catch(error => {
                        g_interface.on_error({
                            name: 'get -> edit(this_message)',
                            location: 'feed.js',
                            error: error
                        });
                    });
                });
            } else if (elapsedMinutes >= 30 && elapsedMinutes <= 120) {
                // Push
                g_fgu.push(item_details);
            }
        }
    }).catch(error => {
        if (!error.indexOf('getaddrinfo EAI_AGAIN') !== -1) {
            g_interface.on_error({
                name: 'get -> fetch()',
                location: 'feed.js',
                error: error
            });
        }
    });
}

const init = function () {
    // First feed fetch
    get();
    // Future feed fetchs every 30 mins
    setInterval(() => {
        get();
    }, 1800000);
}

module.exports = {
    init
}