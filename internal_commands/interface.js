const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');
const probe = require('probe-image-size');
const gis = require('g-i-s');

let client, is_pushing = false, to_push = new Array();
const vr_prefix = 'Play ';

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
    } else if (contains('intel')) {
        icon_url = 'https://cdn2.iconfinder.com/data/icons/metro-uinvert-dock/256/Intel.png';
    } else if (contains('gleam')) {
        icon_url = 'https://apps.shopifycdn.com/listing_images/8dc670630c433c7c7d2fc8d93581762a/icon/f60f22399e98992a330e0d12e91b5a25.png';
    } else if (contains('grabthegames')) {
        icon_url = 'https://scontent.fmnl6-2.fna.fbcdn.net/v/t31.0-8/24254693_2201298796677818_7066385480118918221_o.jpg?_nc_cat=109&_nc_sid=85a577&_nc_eui2=AeGMkbuMWJXXgQbEX2PGAQaTUdcu0yrTgjFR1y7TKtOCMaSCoX8TNVA7K7PcDrhyWDLouN_xjEsPa_RJTAw1SCIN&_nc_ohc=AIMdmiqIii8AX_AkFNM&_nc_ht=scontent.fmnl6-2.fna&oh=e918a376f6cad8bdbcadab90e7807285&oe=5F281495';
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
async function updateGuild() {
    // Loops through every guild
    for (let this_guild of client.guilds.cache.array()) {
        // Transfer members from generic voice rooms to dynamic voice rooms
        for (let this_channel of this_guild.channels.cache.array()) {
            if (this_channel.type == 'voice' && this_channel.name.startsWith('Voice Room')) {
                if (this_channel.members.size > 1) {
                    // Get baseline activity
                    let baseline_role;
                    for (let this_member of this_channel.members.array()) {
                        let member_roles = new Array();
                        if (!baseline_role) {
                            for (let this_role of this_member.roles.cache.array()) {
                                if (this_role.name.startsWith('Play')) {
                                    member_roles.push(this_role);
                                }
                            }
                            if (member_roles.length == 1) {
                                baseline_role = member_roles.pop();
                            }
                        }
                    }
                    if (baseline_role) {
                        // Check if all members have the same activity
                        let same_acitivities = true;
                        for (let this_member of this_channel.members.array()) {
                            if (same_acitivities && !this_member.roles.cache.find(role => role == baseline_role)) {
                                same_acitivities = false;
                            }
                        }
                        // Check if all members are playing more than 5 minutes
                        let are_playing = true;
                        for (let this_member of this_channel.members.array()) {
                            for (let this_activity of this_member.presence.activities) {
                                if (this_activity.name == baseline_role.name.substring(vr_prefix.length)) {
                                    let today = new Date();
                                    let diffMins = Math.round((today - this_activity.createdAt) / 60000); // minutes
                                    if (diffMins < 5) {
                                        are_playing = false;
                                    }
                                }
                            }
                        }

                        if (same_acitivities && are_playing) {
                            // Create
                            await this_guild.channels.create(baseline_role.name, {
                                type: 'voice',
                                topic: `Voice room dedicated for ${baseline_role.name.substring(vr_prefix.length)} players.`,
                                reason: `${baseline_role.name.substring(vr_prefix.length)} is being played by members in a voice room.`,
                                parent: this_guild.channels.cache.find(channel => channel.name.toLowerCase() == 'dedicated voice channels').id,
                                permissionOverwrites: [
                                    {
                                        id: this_guild.roles.everyone.id,
                                        deny: ["CONNECT"]
                                    },
                                    {
                                        id: this_guild.roles.cache.find(role => role.name.toLowerCase() == 'music bots').id,
                                        allow: ["CONNECT"]
                                    },
                                    {
                                        id: baseline_role.id,
                                        allow: ["CONNECT"]
                                    }
                                ]
                            }).then(async channel => {
                                // Transfer
                                for (let this_member of this_channel.members.array()) {
                                    await this_member.voice.setChannel(channel).catch(console.error);
                                }
                            }).catch(console.error);
                        }
                    }
                }
            }
        }
    }

    setTimeout(async function () {
        // Repeat
        updateGuild();
    }, 30000)
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

            // Stores the output message as an embed
            let output = new MessageEmbed().setTimestamp();
            output.setAuthor('Quarantine Gaming: Free Game/DLC Notification', client.user.displayAvatarURL());
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
                // Splits the title to words
                let title_parts = title.split(' ');
                // Contains the filter words
                let filters = ['other', 'alpha', 'beta', 'psa'];
                // Loop all the words
                title_parts.forEach(part => {
                    // Check if the word is not one of the classifiers
                    if (!part.startsWith('[') && !part.startsWith('(') && !part.endsWith(']') && !part.endsWith(')')) {
                        // Concatenate this word to the safe title
                        safe_title += `${part} `;
                    } else {
                        // Add to excluded word
                        exclude_title.push(part);
                        // Loop all the filter words
                        for (let filter of filters) {
                            // Checks if the word is one of the filter words
                            if (part.toLowerCase().indexOf(filter) !== -1) {
                                // Add the filtered word to the filtered content
                                filtered_content.push(part);
                                // Stop the loop
                                break;
                            }
                        }
                    }
                });

                // Set the title of the output embed
                output.setTitle(`**${safe_title ? safe_title : title}**`);
            } else {
                // Set the identifier to true
                no_title = true;
            }

            // URL
            let no_url = false;
            if (url && url.length > 4) {
                // Initialize a has error boolean identifier, stores the response of the url
                let has_error = false, response;
                try {
                    response = await fetch(url); // Fetch the response of the url
                } catch (err) {
                    has_error = true; // Set the identifier to true if there's an error
                };
                // Check if there's no error and there's a response
                if (!has_error && response) {
                    // Check if the response is ok
                    if (response.ok) {
                        // Set the output embed url
                        output.setURL(url);
                        // Get the hostname of the url
                        let hostname = new URL(url).hostname;
                        // Set the footer of the output embed with the hostname and its icon
                        output.setFooter(`${hostname} | Updated as of `, getIcon(hostname));
                    } else {
                        // Set the identifier to true
                        no_url = true;
                    }
                } else {
                    // Set the identifier to true
                    no_url = true;
                }
            } else {
                // Set the identifier to true
                no_url = true;
            }

            // Image
            let image_url;
            let has_image = false;
            // Stores a default image to be used when image search fails to give acceptable images
            let default_img = process.env.DEFAULT_IMAGE;
            // Stores the google image search results
            let gis_results;
            // Initializes a has error boolean identifier
            let has_error = false;
            // Get the google image search results using the output embed title
            try {
                // Search for images
                await image_search(title).then(results => gis_results = results); // Assign the results to the gis results
            } catch (error) {
                has_error = true; // Set the identifier to true if there's an error
            }
            // Check if there's no error
            if (!has_error) {
                // Loops all the google image search results
                for (let gis_result of gis_results) {
                    // Resets the identifier to false
                    has_error = false;
                    // Stores the response of the gis result url
                    let response;
                    try {
                        response = await fetch(gis_result.url); // Fetch the response of the url
                    } catch (error) {
                        has_error = true; // Sets the identifier to true if there's an error
                    }
                    // Check if there's no error and response and that the response is ok
                    if (!has_error && response && response.ok) {
                        let probe_result;
                        try {
                            probe_result = await probe(gis_result.url, { timeout: 10000 }); // Probe the image url
                        } catch (error) {
                            has_error = true; // Sets the identifier to true if there's an error
                        }
                        if (!has_error) {
                            // Get the resolution of the image
                            let image_width = parseInt(probe_result.width);
                            let image_height = parseInt(probe_result.height);
                            // Get the ratio of the image
                            let image_ratio = image_width / image_height;
                            // Check if the image has an acceptable resolution and ratio (close to 16:9)
                            if (image_width >= 200 && image_height >= 200 && image_ratio >= 1.7) {
                                // Set the image url to this probe result url for a no-redirect url
                                image_url = probe_result.url
                                // Set the identifier to true
                                has_image = true;
                                // Stops the google image search results loop
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
            // Sets the url to lower case to remove case sensitivity and concatenate a space to disable undefined error
            let _url = no_url ? ' ' : url.toLowerCase();
            // Console keywords
            let Console_URLs = ['playstation.com', 'wii.com', 'xbox.com'];
            let Console_KWs = ['playstation', 'wii', 'ps3', 'ps4', 'xbox'];

            // Checks if the title or the url contains the word steam
            if (_url.indexOf('steampowered.com') !== -1) {
                // Add steam to the mentionable array
                mentionables[mentionables.length] = 'steam';
                // Set the color
                color.add(0, 157, 255);
            }
            // Checks if the title or the url contains the word epic
            if (_url.indexOf('epicgames.com') !== -1) {
                // Add epic to the mentionable array
                mentionables[mentionables.length] = 'epic';
                // Set the color
                color.add(157, 255, 0);
            }
            // Checks if the title or the url contains the word gog
            if (_url.indexOf('gog.com') !== -1) {
                // Add gog to the mentionable array
                mentionables[mentionables.length] = 'gog';
                // Set the color
                color.add(157, 0, 255)
            }
            // Checks if the title or the url contains these words
            for (let Console_URL of Console_URLs) {
                if (_url.indexOf(Console_URL) !== -1) {
                    // Add console to the mentionable array
                    mentionables[mentionables.length] = 'console';
                    // Set the color
                    color.add(200, 80, 200)
                }
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
                    // Update database
                    await g_db.pushNotification(safe_notification);
                    // Set the color of the embeds
                    output.setColor(color.toHex());
                    // Check if the this guild's steam mentionable-role is not null and that the mentionables contains steam
                    if (mentionables.includes('steam')) {
                        // Concatenate the steam role to the to-be-mentioned roles
                        this_mentionables.push(`<@&722645979248984084>`);
                    }
                    // Check if the this guild's epic mentionable-role is not null and that the mentionables contains epic
                    if (mentionables.includes('epic')) {
                        // Concatenate the epic role to the to-be-mentioned roles
                        this_mentionables.push(`<@&722691589813829672>`);
                    }
                    // Check if the this guild's gog mentionable-role is not null and that the mentionables contains gog
                    if (mentionables.includes('gog')) {
                        // Concatenate the gog role to the to-be-mentioned roles
                        this_mentionables.push(`<@&722691679542312970>`);
                    }
                    // Check if the this guild's console mentionable-role is not null and that the mentionables contains console
                    if (mentionables.includes('console')) {
                        // Concatenate the console role to the to-be-mentioned roles
                        this_mentionables.push(`<@&722691724572491776>`);
                    }
                    // Checks if the to-be-mentioned roles is not null
                    if (this_mentionables) {
                        // Send the embed to the guild's specified channel
                        await subscription({ content: this_mentionables.join(', '), embed: output });
                    }
                }
            }
        } while (to_push.length > 0);
        // Reset the status to false
        is_pushing = false;
    } catch (error) {
        let embed = new MessageEmbed()
            .setAuthor(`Process Push`)
            .setTitle(`Interface.js Error`)
            .setDescription(`An error occured while performing process_push function on interface.js.`)
            .addField('Error Message', error)
            .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Antu_dialog-error.svg/1024px-Antu_dialog-error.svg.png')
            .setColor('#FF0000');

        g_interface.log(embed);
        console.log(`An error occured while performing process_push function on interface.js.`);
        console.log(`\n${error}\n`);
    }
}
// External Functions Region
const init = function (this_client) {
    // Set the commando client instance
    client = this_client;
    updateGuild();
}
const log = async function (message) {
    try {
        // Send a message to the FGU Interface's #bot-logs channel
        client.guilds.cache.get('351178660725915649').channels.cache.get('722760285622108210').send(message);
    } catch (error) {
        let embed = new MessageEmbed()
            .setAuthor(`Log`)
            .setTitle(`Interface.js Error`)
            .setDescription(`An error occured while performing log function on interface.js.`)
            .addField('Error Message', error)
            .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Antu_dialog-error.svg/1024px-Antu_dialog-error.svg.png')
            .setColor('#FF0000');

        log(embed);
        console.log(`An error occured while performing log function on interface.js.`);
        console.log(`\n${error}\n`);
    }
}
const subscription = async function (message) {
    let no_error = true;
    // Send a message to a specific channel on a specific guild
    client.guilds.cache.get('351178660725915649').channels.cache.get('699763763859161108').send(message).catch(error => {
        no_error = false;
        let embed = new MessageEmbed()
            .setAuthor(`subscription`)
            .setTitle(`Interface.js Error`)
            .setDescription(`An error occured while performing subscription function on interface.js.`)
            .addField('Error Message', error)
            .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Antu_dialog-error.svg/1024px-Antu_dialog-error.svg.png')
            .setColor('#FF0000');

        log(embed);
        console.log(`An error occured while performing subscription function on interface.js.`);
        console.log(`\n${error}\n`);
    });
    return no_error;
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
    log,
    subscription,
    push
}