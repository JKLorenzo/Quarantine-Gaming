const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');
const probe = require('probe-image-size');

let is_pushing = false, to_push = new Array();

// Internal Functions Region
async function get() {
    try {
        await fetch('https://www.reddit.com/r/FreeGameFindings/new/.json?limit=25&sort=new').then(data => data.json()).then(async data => {
            for (let child of data.data.children) {
                let item = child.data;

                let item_details = {
                    title: g_functions.htmlEntities(item.title),
                    url: item.url,
                    author: item.author,
                    description: g_functions.htmlEntities(item.selftext),
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
                        if (this_message) {
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
                                    location: 'fgu.js',
                                    error: error
                                });
                            });
                        }
                    });

                    // Process every 5 minutes
                    await g_functions.sleep(300000);
                } else if (elapsedMinutes >= 30 && elapsedMinutes <= 150) {
                    // Push
                    g_fgu.push(item_details);
                }
            }
        }).catch(error => {
            if (!error.message.indexOf('getaddrinfo EAI_AGAIN') !== -1) {
                g_interface.on_error({
                    name: 'get -> fetch()',
                    location: 'fgu.js',
                    error: error
                });
            }
        });
    } catch (error) {
        g_interface.on_error({
            name: 'get',
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
            let no_title = false, safe_title = '', exclude_title = [], filtered_content = [];
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
            } else {
                no_title = true;
            }

            // URL
            let no_url = false;
            if (url && url.length > 4) {
                // Initialize a has error boolean identifier, stores the response of the url
                let has_error = false, response;
                response = await fetch(url).catch(() => {
                    has_error = true
                });
                // Check if there's no error and there's a response
                if (!has_error && response) {
                    if (response.ok) {
                        output.setURL(url);
                        let hostname = new URL(url).hostname;
                        output.setFooter(`${hostname} | Updated as of `, g_functions.getIcon(hostname));
                    } else {
                        no_url = true;
                    }
                } else {
                    no_url = true;
                }
            } else {
                no_url = true;
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
            let _url = no_url ? ' ' : url.toLowerCase();

            if (_url.indexOf('steampowered.com') !== -1) {
                mentionables.push(`<@&722645979248984084>`);
                color.add(0, 157, 255);
            }

            if (_url.indexOf('epicgames.com') !== -1) {
                mentionables.push(`<@&722691589813829672>`);
                color.add(157, 255, 0);
            }

            if (_url.indexOf('gog.com') !== -1) {
                mentionables.push(`<@&722691679542312970>`);
                color.add(157, 0, 255)
            }

            let Console_URLs = ['playstation.com', 'wii.com', 'xbox.com'];
            for (let Console_URL of Console_URLs) {
                if (_url.indexOf(Console_URL) !== -1 && !mentionables.includes('<@&722691724572491776>')) {
                    mentionables.push(`<@&722691724572491776>`);
                    color.add(200, 80, 200)
                }
            }

            if (_url.indexOf('ubisoft.com') !== -1) {
                mentionables.push(`<@&750517524738605087>`);
                color.add(200, 120, 255)
            }

            output.setColor(color.toHex());

            // Status
            if (!(no_title || filtered_content.length > 0 || no_url || mentionables.length == 0)) {
                const sent_message = await g_interface.updates({ content: mentionables.join(', '), embed: output });
                await g_db.pushNotification({
                    id: sent_message.id,
                    title: no_title ? '' : safe_title ? safe_title : title,
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
    // Fetch after every 1 hour
    setInterval(() => {
        get();
    }, 3600000);
}

// Interface Module Functions
module.exports = {
    push,
    begin
}