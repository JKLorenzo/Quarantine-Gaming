const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');
const axios = require('axios');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

async function valorant(username, id) {
    let stats;
    await axios.get(`https://tracker.gg/valorant/profile/riot/${username}%23${id}/overview?playlist=competitive`).then(resp => {
        const { document } = (new JSDOM(resp.data)).window;
        const highlight_stat_value = document.querySelectorAll(".valorant-highlighted-stat__value");
        const stat_value = document.querySelectorAll(".value");
        const top_weapons_name = document.querySelectorAll(".weapon__name");
        const top_weapons_type = document.querySelectorAll(".weapon__type");
        const top_agents_name = document.querySelectorAll(".agent__name");
        const top_agents_stats = document.querySelectorAll(".name");

        stats = {
            playtime: document.querySelectorAll(".playtime")[0].innerHTML.split('</svg>')[1].trim().split('Play Time').join(''),
            matches: document.querySelectorAll(".matches")[0].innerHTML.trim(),
            rating: highlight_stat_value[0].innerHTML.trim(),
            kad_ratio: highlight_stat_value[1].innerHTML.trim(),
            top_agents: [
                {
                    name: top_agents_name[0].innerHTML.trim(),
                    time_played: top_agents_stats[28].innerHTML.trim(),
                    win_percent: top_agents_stats[29].innerHTML.trim(),
                    kd_ratio: top_agents_stats[30].innerHTML.trim(),
                    damage_per_round: top_agents_stats[31].innerHTML.trim()
                },
                {
                    name: top_agents_name[1].innerHTML.trim(),
                    time_played: top_agents_stats[32].innerHTML.trim(),
                    win_percent: top_agents_stats[33].innerHTML.trim(),
                    kd_ratio: top_agents_stats[34].innerHTML.trim(),
                    damage_per_round: top_agents_stats[35].innerHTML.trim()
                },
                {
                    name: top_agents_name[2].innerHTML.trim(),
                    time_played: top_agents_stats[36].innerHTML.trim(),
                    win_percent: top_agents_stats[37].innerHTML.trim(),
                    kd_ratio: top_agents_stats[38].innerHTML.trim(),
                    damage_per_round: top_agents_stats[39].innerHTML.trim()
                }
            ],
            top_weapons: [
                {
                    kills: stat_value[0].innerHTML.trim(),
                    name: top_weapons_name[0].innerHTML.trim(),
                    type: top_weapons_type[0].innerHTML.trim()
                },
                {
                    kills: stat_value[1].innerHTML.trim(),
                    name: top_weapons_name[1].innerHTML.trim(),
                    type: top_weapons_type[1].innerHTML.trim()
                },
                {
                    kills: stat_value[2].innerHTML.trim(),
                    name: top_weapons_name[2].innerHTML.trim(),
                    type: top_weapons_type[2].innerHTML.trim()
                }
            ],
            damage_per_round: stat_value[3].innerHTML.trim(),
            kd_ratio: stat_value[4].innerHTML.trim(),
            headshots_percent: stat_value[5].innerHTML.trim(),
            win_percent: stat_value[6].innerHTML.trim(),
            wins: stat_value[7].innerHTML.trim(),
            kills: stat_value[8].innerHTML.trim(),
            headshots: stat_value[9].innerHTML.trim(),
            deaths: stat_value[10].innerHTML.trim(),
            assists: stat_value[11].innerHTML.trim(),
            score_per_round: stat_value[12].innerHTML.trim(),
            kills_per_round: stat_value[13].innerHTML.trim(),
            first_bloods: stat_value[14].innerHTML.trim(),
            aces: stat_value[15].innerHTML.trim(),
            clutches: stat_value[16].innerHTML.trim(),
            flawless: stat_value[17].innerHTML.trim(),
            most_kills_match: stat_value[18].innerHTML.trim()
        };
    }).catch(error => { });
    return stats;
}

module.exports = class Stats extends Command {
    constructor(client) {
        super(client, {
            name: 'stats',
            group: 'experience',
            memberName: 'stats',
            description: 'A stats tracker that shows your performace over time.',
            args: [
                {
                    key: 'game',
                    prompt: 'Enter the name of the game.',
                    type: 'string',
                    oneOf: ['valorant']
                },
                {
                    key: 'riot',
                    prompt: 'Enter your riot username and id.',
                    type: 'string'
                }
            ]
        });
    }

    async run(message, { game, riot }) {
        switch (game) {
            case 'valorant':
                message.say(`Getting information...`).then(async this_message => {
                    let stats = await valorant(riot.split('#')[0], riot.split('#')[1]);
                    if (stats) {
                        message.delete({ timeout: 300000 }).catch(error => { });
                        this_message.delete().catch(error => { })

                        let embed1 = new MessageEmbed()
                            .setAuthor(`Quarantine Gaming Experience: Stats Tracker`)
                            .setColor('#25ff00')
                            .setFooter(`${riot}'s Competitive Stats | Realtime information is not guaranteed.`)
                            .setThumbnail('https://preview.redd.it/pq2si1uks8t41.png?width=512&format=png&auto=webp&s=a86b0d7a2620b6f0d404e191d37d75f895996c23')
                            .setTitle(`Overview`)
                            .addFields([
                                { name: 'Rating', value: stats.rating, inline: true },
                                { name: 'Matches', value: stats.matches, inline: true },
                                { name: 'Play Time', value: stats.playtime, inline: true },
                                { name: 'KAD Ratio', value: stats.kad_ratio, inline: true },
                                { name: 'Wins', value: stats.wins, inline: true },
                                { name: 'Loss', value: parseInt(stats.matches) - parseInt(stats.wins), inline: true }
                            ]);

                        let embed2 = new MessageEmbed()
                            .setAuthor(`Quarantine Gaming Experience: Stats Tracker`)
                            .setColor('#25ff00')
                            .setFooter(`${riot}'s Competitive Stats | Realtime information is not guaranteed.`)
                            .setThumbnail('https://preview.redd.it/pq2si1uks8t41.png?width=512&format=png&auto=webp&s=a86b0d7a2620b6f0d404e191d37d75f895996c23')
                            .setTitle(`Top Weapons`)
                            .addFields([
                                { name: `Name`, value: stats.top_weapons[0].name, inline: true },
                                { name: `Type`, value: stats.top_weapons[0].type, inline: true },
                                { name: `Kills`, value: stats.top_weapons[0].kills, inline: true },

                                { name: `Name`, value: stats.top_weapons[1].name, inline: true },
                                { name: `Type`, value: stats.top_weapons[1].type, inline: true },
                                { name: `Kills`, value: stats.top_weapons[1].kills, inline: true },

                                { name: `Name`, value: stats.top_weapons[2].name, inline: true },
                                { name: `Type`, value: stats.top_weapons[2].type, inline: true },
                                { name: `Kills`, value: stats.top_weapons[2].kills, inline: true }
                            ]);

                        let embed3 = new MessageEmbed()
                            .setAuthor(`Quarantine Gaming Experience: Stats Tracker`)
                            .setColor('#25ff00')
                            .setFooter(`${riot}'s Competitive Stats | Realtime information is not guaranteed.`)
                            .setThumbnail('https://preview.redd.it/pq2si1uks8t41.png?width=512&format=png&auto=webp&s=a86b0d7a2620b6f0d404e191d37d75f895996c23')
                            .setTitle(`Top Agents`)
                            .addFields([
                                { name: `Agent`, value: stats.top_agents[0].name, inline: true },
                                { name: `Time Played`, value: stats.top_agents[0].time_played, inline: true },
                                { name: `Win %`, value: stats.top_agents[0].win_percent, inline: true },

                                { name: `Agent`, value: stats.top_agents[1].name, inline: true },
                                { name: `Time Played`, value: stats.top_agents[1].time_played, inline: true },
                                { name: `Win %`, value: stats.top_agents[1].win_percent, inline: true },

                                { name: `Agent`, value: stats.top_agents[2].name, inline: true },
                                { name: `Time Played`, value: stats.top_agents[2].time_played, inline: true },
                                { name: `Win %`, value: stats.top_agents[2].win_percent, inline: true }
                            ]);

                        let embed4 = new MessageEmbed()
                            .setAuthor(`Quarantine Gaming Experience: Stats Tracker`)
                            .setColor('#25ff00')
                            .setFooter(`${riot}'s Competitive Stats | Realtime information is not guaranteed.`)
                            .setThumbnail('https://preview.redd.it/pq2si1uks8t41.png?width=512&format=png&auto=webp&s=a86b0d7a2620b6f0d404e191d37d75f895996c23')
                            .setTitle(`General`)
                            .addFields([
                                { name: 'Damage/Round', value: stats.damage_per_round, inline: true },
                                { name: 'K/D Ratio', value: stats.kd_ratio, inline: true },
                                { name: 'Headshots %', value: stats.headshots_percent, inline: true },
                                { name: 'Wins %', value: stats.win_percent, inline: true },
                                { name: 'Kills', value: stats.kills, inline: true },
                                { name: 'Headshots', value: stats.headshots, inline: true },
                                { name: 'Deaths', value: stats.deaths, inline: true },
                                { name: 'Assists', value: stats.assists, inline: true },
                                { name: 'Score/Round', value: stats.score_per_round, inline: true },
                                { name: 'Kills/Round', value: stats.kills_per_round, inline: true },
                                { name: 'First Bloods', value: stats.first_bloods, inline: true },
                                { name: 'Aces', value: stats.aces, inline: true },
                                { name: 'Clutches', value: stats.clutches, inline: true },
                                { name: 'Flawless', value: stats.flawless, inline: true },
                                { name: 'Most Kills (Match)', value: stats.most_kills_match, inline: true }
                            ]);

                        await message.say(embed1).then(the_message => {
                            the_message.delete({ timeout: 300000 }).catch(error => { });
                        }).catch(error => { });
                        await message.say(embed2).then(the_message => {
                            the_message.delete({ timeout: 300000 }).catch(error => { });
                        }).catch(error => { });
                        await message.say(embed3).then(the_message => {
                            the_message.delete({ timeout: 300000 }).catch(error => { });
                        }).catch(error => { });
                        await message.say(embed4).then(the_message => {
                            the_message.delete({ timeout: 300000 }).catch(error => { });
                        }).catch(error => { });
                    } else {
                        message.delete({ timeout: 10000 }).catch(error => { });
                        this_message.edit("Failed to get information from this account. The account may have been set to private or the account does not exist.").then(the_message => {
                            the_message.delete({ timeout: 10000 }).catch(error => { });
                        }).catch(error => { });
                    }
                }).catch(error => { });
                break;
        }
    }
};