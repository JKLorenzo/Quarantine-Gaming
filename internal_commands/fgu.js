const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');
const probe = require('probe-image-size');
const gis = require('g-i-s');

let client, is_pushing = false, to_push = new Array();

// Internal Functions Region
function getIcon(hostname) {
    function contains(word) {
        return hostname.toLowerCase().indexOf(word) !== -1;
    }
    let icon_url = '';
    if (contains('reddit')) {
        icon_url = 'https://image.flaticon.com/icons/png/512/355/355990.png';
    } else if (contains('steam')) {
        icon_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/1024px-Steam_icon_logo.svg.png';
    } else if (contains('epicgames')) {
        icon_url = 'https://cdn2.unrealengine.com/EpicGames%2Fno-exist-576x576-5c7c5c6c4edc402cbd0d369cf7dd2662206b4657.png';
    } else if (contains('gog')) {
        icon_url = 'https://static.techspot.com/images2/downloads/topdownload/2016/12/gog.png';
    } else if (contains('playstation')) {
        icon_url = 'https://lh3.ggpht.com/pYDuCWSs7TIopjHX_i89et1C6zyk82iRZKAiWe8yJt5KNXp-B2ZuK7KHydkpaQmAnV0=w300';
    } else if (contains('xbox')) {
        icon_url = 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/i/0428cd5e-b1ca-4c7c-8d6a-0b263465bfe0/d4hcb91-d614c470-8051-43ef-ab75-18100a527bd1.png';
    } else if (contains('ubisoft')) {
        icon_url = 'https://vignette.wikia.nocookie.net/ichc-channel/images/e/e2/Ubisoft_round_icon_by_slamiticon-d66j9vs.png/revision/latest/scale-to-width-down/220?cb=20160328232011';
    } else if (contains('microsoft')) {
        icon_url = 'https://cdn0.iconfinder.com/data/icons/shift-free/32/Microsoft-512.png';
    } else if (contains('discord')) {
        icon_url = 'https://i1.pngguru.com/preview/373/977/320/discord-for-macos-white-and-blue-logo-art.jpg';
    } else {
        icon_url = `http://www.google.com/s2/favicons?domain=${hostname}`;
    }
    return icon_url;
}
function image_search(name) {
    return new Promise(function (resolve, reject) {
        gis(name, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        })
    })
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

            // Stores the output message as an embed
            let output = new MessageEmbed().setTimestamp();
            output.setAuthor('Quarantine Gaming: Free Game/DLC Notification', client.user.displayAvatarURL());
            if (flair) output.setDescription(flair);
            output.addFields([
                { name: 'Author', value: author, inline: true },
                { name: 'Validity', value: `${validity} %`, inline: true },
                { name: 'Score', value: `${score}`, inline: true }
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
                        output.setFooter(`${hostname} | Updated as of `, getIcon(hostname));
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
            await image_search(title).then(results => gis_results = results).catch(() => {
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
                mentionables[mentionables.length] = 'steam';
                color.add(0, 157, 255);
            }

            if (_url.indexOf('epicgames.com') !== -1) {
                mentionables[mentionables.length] = 'epic';
                color.add(157, 255, 0);
            }

            if (_url.indexOf('gog.com') !== -1) {
                mentionables[mentionables.length] = 'gog';
                color.add(157, 0, 255)
            }

            let Console_URLs = ['playstation.com', 'wii.com', 'xbox.com'];
            for (let Console_URL of Console_URLs) {
                if (_url.indexOf(Console_URL) !== -1) {
                    mentionables[mentionables.length] = 'console';
                    color.add(200, 80, 200)
                }
            }

            if (_url.indexOf('ubisoft.com') !== -1) {
                mentionables[mentionables.length] = 'uplay';
                color.add(200, 120, 255)
            }

            // Status
            if (!(no_title || filtered_content.length > 0 || no_url || mentionables.length == 0)) {
                // Create the final notification to be used
                let safe_notification = {
                    title: no_title ? '' : safe_title ? safe_title : title,
                    link: no_url ? '' : output.url,
                    image: output.image.url
                };
                // Check if this notification has duplicates
                if (!g_db.hasRecords(safe_notification)) {
                    let this_mentionables = new Array();
                    await g_db.pushNotification(safe_notification);
                    output.setColor(color.toHex());

                    if (mentionables.includes('steam')) {
                        this_mentionables.push(`<@&722645979248984084>`);
                    }
                    if (mentionables.includes('epic')) {
                        this_mentionables.push(`<@&722691589813829672>`);
                    }
                    if (mentionables.includes('gog')) {
                        this_mentionables.push(`<@&722691679542312970>`);
                    }
                    if (mentionables.includes('console')) {
                        this_mentionables.push(`<@&722691724572491776>`);
                    }
                    if (mentionables.includes('uplay')) {
                        this_mentionables.push(`<@&750517524738605087>`);
                    }

                    // Checks if the to-be-mentioned roles is not null
                    if (this_mentionables) {
                        await g_interface.subscription({ content: this_mentionables.join(', '), embed: output });
                    }
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

// External Functions Region
const init = function (this_client) {
    // Set the commando client instance
    client = this_client;
}
const push = function (notification) {
    // Push this notification to the push array
    to_push.push(notification);
    // Check if there's no ongoing push process
    if (!is_pushing) {
        // Start the push process
        process_push();
    }
}

// Interface Module Functions
module.exports = {
    init,
    push
}