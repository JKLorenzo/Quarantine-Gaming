import { constants } from '../utils/Base';

/**
 * @typedef {import('discord.js').GuildMember} GuildMember
 */

/**
 * Gets the most played game from these members.
 * @param {GuildMember[]} members The members to check the activities.
 * @returns {string}
 */
export default function getMostPlayedGame(members) {
  const members_games = members
    .map(member =>
      member.roles.cache
        .array()
        .filter(r => r.hexColor === constants.colors.play_role),
    )
    .filter(r => r.length);

  const game_count = {};
  for (const member_games of members_games) {
    for (const game of member_games) {
      if (game_count[game.name]) {
        game_count[game.name] += 1;
      } else {
        game_count[game.name] = 1;
      }
    }
  }

  let highest = { name: '', count: 0 };
  for (const [game_name, players] of Object.entries(game_count)) {
    if (players > highest.count) {
      highest = {
        name: game_name,
        count: players,
      };
    }
  }

  return highest.name;
}
