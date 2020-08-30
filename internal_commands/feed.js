const fetch = require('node-fetch');

let results = new Array();

async function get(init = false) {
    console.log('**Updating Feed**');
    try {
        await fetch('https://www.reddit.com/r/FreeGameFindings/new/.json?limit=5&sort=new')
            .then(data => data.json())
            .then(data => {
                for (let child of data.data.children) {
                    let item = child.data;

                    if (!results.includes(item.title)) {
                        results.push(item.title);
                        if (!init) {
                            g_interface.push({
                                title: item.title,
                                url: item.url,
                                author: author,
                                description: item.selftext,
                                validity: item.upvote_ratio*100
                            });
                        }
                    }
                }
            });
    } catch (error) {
        let embed = new MessageEmbed()
            .setAuthor(`Get`)
            .setTitle(`Feed.js Error`)
            .setDescription(`An error occured while performing get function on feed.js.`)
            .addField('Error Message', error)
            .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Antu_dialog-error.svg/1024px-Antu_dialog-error.svg.png')
            .setColor('#FF0000');

        g_interface.log(embed);
        console.log(`An error occured while performing get function on feed.js.`);
        console.log(`\n${error}\n`);
    }
}

const start = async function () {
    // First feed fetch
    await get(true);
    // Future feed fetchs every 30 mins
    setInterval(() => {
        get();
    }, 1800000);
}

module.exports = {
    start
}