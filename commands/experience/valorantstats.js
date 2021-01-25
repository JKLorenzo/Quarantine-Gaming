const Discord = require('discord.js');
const { Command } = require('discord.js-commando');
const { JSDOM } = require("jsdom");
const axios = require('axios');
const functions = require('../../modules/functions.js');
/** @type {import('../../modules/message_manager.js')} */
let message_manager;

async function valorant(username, id) {
    await axios.get(`https://tracker.gg/valorant/profile/riot/${username}%23${id}/overview?playlist=competitive`).then(resp => {
        const { document } = (new JSDOM(resp.data)).window;
        const highlight_stat_value = document.querySelectorAll(".valorant-highlighted-stat__value");
        const stat_value = document.querySelectorAll(".value");
        const top_weapons_name = document.querySelectorAll(".weapon__name");
        const top_weapons_type = document.querySelectorAll(".weapon__type");
        const top_agents_name = document.querySelectorAll(".agent__name");
        const top_agents_stats = document.querySelectorAll(".name");

        return {
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
    }).catch(() => { });
}

module.exports = class StatsVALORANT extends Command {
    constructor(client) {
        super(client, {
            name: 'valorantstats',
            group: 'experience',
            memberName: 'valorantstats',
            description: `A stats tracker for VALORANT which shows a player's competitive performances over time.`,
            guildOnly: true,
            args: [
                {
                    key: 'player',
                    prompt: "Enter the player's riot username and id. Example: `username#1234`",
                    type: 'string'
                },
                {
                    key: 'target',
                    prompt: "Where would you like to receive the information? `DM` or `Here`?",
                    type: 'string',
                    oneOf: ['dm', 'here'],
                    default: 'dm'
                }
            ]
        });
    }

    /**
     * @param {Discord.Message} message 
     * @param {{player: Discord.UserResolvable, target: String}} 
     */
    async run(message, { player, target }) {
        // Link 
        const Modules = functions.parseModules(GlobalModules);
        message_manager = Modules.message_manager;

        const this_message = message.say(`Getting information...`);
        const stats = await valorant(player.split('#')[0], player.split('#')[1]);
        this_message.delete().catch(() => { });

        if (stats) {
            const embed1 = new MessageEmbed();
            embed1.setAuthor(`Quarantine Gaming: Experience`);
            embed1.setColor('#25ff00');
            embed1.setFooter(`${player}'s Competitive Stats | Realtime information is not guaranteed.`);
            embed1.setThumbnail('https://preview.redd.it/pq2si1uks8t41.png?width=512&format=png&auto=webp&s=a86b0d7a2620b6f0d404e191d37d75f895996c23');
            embed1.setTitle(`Stats Tracker for VALORANT`);
            embed1.setDescription('**Overview**');
            embed1.addFields([
                { name: 'Rating', value: stats.rating, inline: true },
                { name: 'Matches', value: stats.matches, inline: true },
                { name: 'Play Time', value: stats.playtime, inline: true },
                { name: 'KAD Ratio', value: stats.kad_ratio, inline: true },
                { name: 'Wins', value: stats.wins, inline: true },
                { name: 'Loss', value: parseInt(stats.matches) - parseInt(stats.wins), inline: true }
            ]);

            const embed2 = new MessageEmbed();
            embed2.setAuthor(`Quarantine Gaming: Experience`);
            embed2.setColor('#25ff00');
            embed2.setFooter(`${player}'s Competitive Stats | Realtime information is not guaranteed.`);
            embed2.setThumbnail('https://preview.redd.it/pq2si1uks8t41.png?width=512&format=png&auto=webp&s=a86b0d7a2620b6f0d404e191d37d75f895996c23');
            embed2.setTitle(`Stats Tracker for VALORANT`);
            embed2.setDescription('**Top Weapons**');
            embed2.addFields([
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

            const embed3 = new MessageEmbed();
            embed3.setAuthor(`Quarantine Gaming: Experience`);
            embed3.setColor('#25ff00');
            embed3.setFooter(`${player}'s Competitive Stats | Realtime information is not guaranteed.`);
            embed3.setThumbnail('https://preview.redd.it/pq2si1uks8t41.png?width=512&format=png&auto=webp&s=a86b0d7a2620b6f0d404e191d37d75f895996c23');
            embed3.setTitle(`Stats Tracker for VALORANT`);
            embed3.setDescription('**Top Agents**');
            embed3.addFields([
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

            const embed4 = new MessageEmbed();
            embed4.setAuthor(`Quarantine Gaming: Experience`);
            embed4.setColor('#25ff00');
            embed4.setFooter(`${player}'s Competitive Stats | Realtime information is not guaranteed.`);
            embed4.setThumbnail('https://preview.redd.it/pq2si1uks8t41.png?width=512&format=png&auto=webp&s=a86b0d7a2620b6f0d404e191d37d75f895996c23');
            embed4.setTitle(`Stats Tracker for VALORANT`);
            embed4.setDescription('**General**');
            embed4.addFields([
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

            if (target == 'here') {
                await message.say(embed1).then(the_message => {
                    the_message.delete({ timeout: 300000 }).catch(() => { });
                }).catch(() => { });
                await message.say(embed2).then(the_message => {
                    the_message.delete({ timeout: 300000 }).catch(() => { });
                }).catch(() => { });
                await message.say(embed3).then(the_message => {
                    the_message.delete({ timeout: 300000 }).catch(() => { });
                }).catch(() => { });
                await message.say(embed4).then(the_message => {
                    the_message.delete({ timeout: 300000 }).catch(() => { });
                }).catch(() => { });
            } else {
                await message_manager.sendToUser(message.author, embed1);
                await message_manager.sendToUser(message.author, embed2);
                await message_manager.sendToUser(message.author, embed3);
                await message_manager.sendToUser(message.author, embed4);
                message.reply('Sent you a DM with information.');
            }
        } else {
            this_message.edit("Failed to get information from this account. The account may be private or the account does not exist.\nTo make your account public, you must sign up your riot account here: <https://tracker.gg/valorant>.").catch(() => { });
        }
    }
};