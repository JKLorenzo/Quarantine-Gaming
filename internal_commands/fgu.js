const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');
const probe = require('probe-image-size');

let is_pushing = false, to_push = new Array(), raw_data_collection = new Array();;

// Internal Functions Region
const get = async function (link) {
    try {
        raw_data_collection = await fetch('https://www.reddit.com/r/FreeGameFindings/new/.json?limit=25&sort=new').then(data => data.json()).then(entry => entry.data.children.map(child => child.data));

        if (raw_data_collection) {
            for (let raw_data of raw_data_collection) {
                const information = {
                    title: g_functions.htmlEntities(raw_data.title),
                    url: raw_data.url,
                    author: raw_data.author,
                    description: g_functions.htmlEntities(raw_data.selftext),
                    validity: raw_data.upvote_ratio * 100,
                    score: raw_data.score,
                    flair: raw_data.link_flair_text,
                    permalink: `https://www.reddit.com${raw_data.permalink}`,
                    createdAt: raw_data.created_utc
                };

                const today = new Date();
                const published = new Date(information.createdAt * 1000);
                const elapsedMinutes = Math.floor((today - published) / 60000);

                const this_notification = g_db.hasRecords(information);
                if (link) {
                    if (link.toLowerCase() == information.url || link.toLowerCase().indexOf(information.permalink) !== -1) {
                        if (!this_notification) {
                            // Push
                            g_fgu.push(information);

                            return 'Got it! Inserting this entry to processing queue.';
                        } else {
                            return 'Uh-oh! This entry is already posted on the free games channel.';
                        }
                    }
                } else {
                    if (!this_notification && elapsedMinutes >= 30 && elapsedMinutes <= 300 && information.score >= 25) {
                        // Push
                        g_fgu.push(information);

                        // Process every 10 minutes
                        await g_functions.sleep(600000);
                    }
                }
            }
        }
    } catch (error) {
        g_interface.on_error({
            name: 'get',
            location: 'fgu.js',
            error: error
        });
    }
}

async function update() {
    try {
        if (raw_data_collection) {
            for (let raw_data of raw_data_collection) {
                const information = {
                    title: g_functions.htmlEntities(raw_data.title),
                    url: raw_data.url,
                    author: raw_data.author,
                    description: g_functions.htmlEntities(raw_data.selftext),
                    validity: raw_data.upvote_ratio * 100,
                    score: raw_data.score,
                    flair: raw_data.link_flair_text,
                    permalink: `https://www.reddit.com${raw_data.permalink}`,
                    createdAt: raw_data.created_utc
                };

                const this_notification = g_db.hasRecords(information);
                if (this_notification) {
                    // Update
                    await g_channels.get().updates.messages.fetch(this_notification.id).then(async this_message => {
                        if (this_message) {
                            if (information.description) {
                                this_message.embeds[0].spliceFields(1, 3)
                                    .addFields([
                                        { name: 'Trust Factor', value: `${information.validity} %`, inline: true },
                                        { name: 'Margin', value: `${information.score}`, inline: true },
                                        { name: 'Details', value: `${information.description}` }
                                    ])
                                    .setTimestamp();
                            } else {
                                this_message.embeds[0].spliceFields(1, 2)
                                    .addFields([
                                        { name: 'Trust Factor', value: `${information.validity} %`, inline: true },
                                        { name: 'Margin', value: `${information.score}`, inline: true }
                                    ])
                                    .setTimestamp();
                            }
                            if (information.flair) {
                                if (information.flair.toLowerCase().indexOf('comment') != -1 || information.flair.toLowerCase().indexOf('issue') != -1) {
                                    this_message.embeds[0].setDescription(`[${information.flair}](${information.permalink})`);
                                } else {
                                    this_message.embeds[0].setDescription(information.flair);
                                }
                            }
                            await this_message.edit({ content: this_message.content, embed: this_message.embeds[0] }).catch(error => {
                                g_interface.on_error({
                                    name: 'update -> edit(this_message)',
                                    location: 'fgu.js',
                                    error: error
                                });
                            });
                        }
                    });

                    // Process every 20 minutes
                    await g_functions.sleep(1200000);
                }
            }
        }
    } catch (error) {
        g_interface.on_error({
            name: 'update',
            location: 'fgu.js',
            error: error
        });
    }
}

async function process_push() {
    try {
        // Set the pushing status to true
        is_pushing = true;
        do {
            // Get the first pushed notification and remove it from the array
            let this_notification = to_push.shift();
            // Dissect the notification to parts
            let title = this_notification.title;
            let url = this_notification.url;
            let author = this_notification.author;
            let description = this_notification.description;
            let validity = this_notification.validity;
            let score = this_notification.score;
            let flair = this_notification.flair;
            let permalink = this_notification.permalink;

            // Stores the output message as an embed
            let output = new MessageEmbed().setTimestamp();
            output.setAuthor('Quarantine Gaming: Free Game/DLC Notification');
            if (flair) {
                if (flair.toLowerCase().indexOf('comment') !== -1 || flair.toLowerCase().indexOf('issue') !== -1) {
                    output.setDescription(`[${flair}](${permalink})`);
                } else {
                    output.setDescription(flair);
                }
            }
            output.addFields([
                { name: 'Author', value: author, inline: true },
                { name: 'Trust Factor', value: `${validity} %`, inline: true },
                { name: 'Margin', value: `${score}`, inline: true }
            ]);
            if (description) {
                output.addField('Details', description);
            }

            // Title
            let safe_title = '', exclude_title = [], filtered_content = [];
            if (title) {
                let title_parts = title.split(' ');
                let filters = ['other', 'alpha', 'beta', 'psa'];
                title_parts.forEach(part => {
                    // Check if the word is not one of the classifiers
                    if (!part.startsWith('[') && !part.startsWith('(') && !part.endsWith(']') && !part.endsWith(')')) {
                        safe_title += `${part} `;
                    } else {
                        exclude_title.push(part);
                        for (let filter of filters) {
                            if (part.toLowerCase().indexOf(filter) !== -1) {
                                filtered_content.push(part);
                                break;
                            }
                        }
                    }
                });
                output.setTitle(`**${safe_title ? safe_title : title}**`);
            }

            // URL
            if (url) {
                // Initialize a has error boolean identifier, stores the response of the url
                let has_error = false, response;
                response = await fetch(url).catch(() => {
                    has_error = true
                });
                // Check if there's no error and there's a response
                if (!has_error && response && response.ok) {
                    output.setURL(url);
                    let hostname = new URL(url).hostname;
                    output.setFooter(`${hostname} | Updated as of `, g_functions.getIcon(hostname));
                }
            }

            // Image
            let image_url;
            let has_image = false;
            let default_img = process.env.DEFAULT_IMAGE;
            let gis_results;
            let has_error = false;
            // Search for images
            await g_functions.image_search(title).then(results => gis_results = results).catch(() => {
                has_error = true;
            });
            // Check if there's no error
            if (!has_error) {
                for (let gis_result of gis_results) {
                    has_error = false;
                    let response = await fetch(gis_result.url).catch(() => {
                        has_error = true;
                    });
                    // Check if there's no error and response and that the response is ok
                    if (!has_error && response && response.ok) {
                        let probe_result = await probe(gis_result.url, { timeout: 10000 }).catch(() => {
                            has_error = true;
                        });
                        if (!has_error) {
                            // Get the resolution of the image
                            let image_width = parseInt(probe_result.width);
                            let image_height = parseInt(probe_result.height);
                            // Get the ratio of the image
                            let image_ratio = image_width / image_height;
                            // Check if the image has an acceptable resolution and ratio (close to 16:9)
                            if (image_width >= 200 && image_height >= 200 && image_ratio >= 1.7) {
                                image_url = probe_result.url
                                has_image = true;
                                break;
                            }
                        }
                    }
                }
                // Check if there's a final image
                if (has_image) {
                    output.setImage(image_url);
                } else {
                    output.setImage(default_img);
                }
            } else {
                output.setImage(default_img);
            }

            // Color of the embeds
            let color = {
                // Defaults to black
                Red: 0,
                Green: 0,
                Blue: 0,
                // Supports color scaling
                add: function (red, green, blue) {
                    // Adds the new rgb values to this color
                    this.Red += red;
                    this.Green += green;
                    this.Blue += blue;
                    // Scale the colors until its acceptable
                    while (this.Red > 255) {
                        if (this.Red > 0) this.Red--;
                        if (this.Green > 0) this.Green--;
                        if (this.Blue > 0) this.Blue--;
                    }
                    while (this.Green > 255) {
                        if (this.Red > 0) this.Red--;
                        if (this.Green > 0) this.Green--;
                        if (this.Blue > 0) this.Blue--;
                    }
                    while (this.Blue > 255) {
                        if (this.Red > 0) this.Red--;
                        if (this.Green > 0) this.Green--;
                        if (this.Blue > 0) this.Blue--;
                    }
                },
                // Converts the rgb values to hex
                toHex: function () {
                    let red = this.Red.toString(16);
                    let green = this.Green.toString(16);
                    let blue = this.Blue.toString(16);
                    if (red.length == 1) red = `0${red}`;
                    if (green.length == 1) green = `0${green}`;
                    if (blue.length == 1) blue = `0${blue}`;
                    return `#${red}${green}${blue}`;
                }
            };

            // Stores all the mentionables in this array
            let mentionables = [];
            let searchables = (description ? description.toLowerCase() : '*') + ' ' + (url ? url.toLowerCase() : '*');

            if (searchables.indexOf('steampowered.com') !== -1) {
                mentionables.push(`<@&722645979248984084>`);
                color.add(0, 157, 255);
            }

            if (searchables.indexOf('epicgames.com') !== -1) {
                mentionables.push(`<@&722691589813829672>`);
                color.add(157, 255, 0);
            }

            if (searchables.indexOf('gog.com') !== -1) {
                mentionables.push(`<@&722691679542312970>`);
                color.add(157, 0, 255)
            }

            let Console_URLs = ['playstation.com', 'wii.com', 'xbox.com', 'microsoft.com'];
            for (let Console_URL of Console_URLs) {
                if (searchables.indexOf(Console_URL) !== -1 && !mentionables.includes('<@&722691724572491776>')) {
                    mentionables.push(`<@&722691724572491776>`);
                    color.add(200, 80, 200)
                }
            }

            if (searchables.indexOf('ubisoft.com') !== -1) {
                mentionables.push(`<@&750517524738605087>`);
                color.add(200, 120, 255)
            }

            output.setColor(color.toHex());

            // Status
            if (filtered_content.length == 0 && mentionables.length > 0) {
                const sent_message = await g_interface.updates({ content: mentionables.join(', '), embed: output });
                await g_db.pushNotification({
                    id: sent_message.id,
                    title: safe_title ? safe_title : title,
                    url: url,
                    author: author,
                    permalink: permalink
                });

                // Crosspost a message
                if (sent_message.channel.type === 'news') {
                    sent_message.crosspost().then(() => {
                        let embed = new MessageEmbed();
                        embed.setColor('#da00ff');
                        embed.setAuthor('Quarantine Gaming: Free Game/DLC Crossposting');
                        embed.setTitle(sent_message.embeds[0].title);
                        embed.setDescription('This notification is now published and is visible to all external(following) servers.')
                        g_interface.log(embed);
                    }).catch(error => {
                        g_interface.on_error({
                            name: 'process_push -> .crosspost()',
                            location: 'fgu.js',
                            error: error
                        });
                    });
                }
            }
        } while (to_push.length > 0);
        // Reset the status to false
        is_pushing = false;
    } catch (error) {
        g_interface.on_error({
            name: 'process_push',
            location: 'fgu.js',
            error: error
        });
    }
}

const push = function (notification) {
    try {
        // Push this notification to the push array
        to_push.push(notification);
        // Check if there's no ongoing push process
        if (!is_pushing) {
            // Start the push process
            process_push();
        }
    } catch (error) {
        g_interface.on_error({
            name: 'push',
            location: 'fgu.js',
            error: error
        });
    }
}

const begin = function () {
    // Inital fetch
    get();

    // Fetch after every 1 hour
    setInterval(() => {
        get();
    }, 3600000);

    // Offset 5 minutes
    setTimeout(() => {
        // Update after every 2 hours
        setInterval(() => {
            update();
        }, 7200000);
    }, 12000)
}

// Interface Module Functions
module.exports = {
    push,
    begin,
    get
}