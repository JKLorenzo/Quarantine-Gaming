import {
  GuildChannelResolvable,
  RoleResolvable,
  Snowflake,
  UserResolvable,
} from 'discord.js';
import gis from 'g-i-s';
import humanizeDuration from 'humanize-duration';
import probe from 'probe-image-size';
import { Color } from '../structures/Interfaces.js';

export function sleep(timeout: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

export function parseHTML(html: string): string {
  return String(html)
    .replace('&amp;', '&')
    .replace('&lt;', '<')
    .replace('&gt;', '>')
    .replace('&quot;', '"');
}

export function parseMention(
  mention: GuildChannelResolvable | UserResolvable | RoleResolvable,
): Snowflake {
  return `${BigInt(String(mention).replace(/\W/g, ''))}`;
}

export function getPercentSimilarity(string1: string, string2: string): number {
  let longer_string = string1;
  let shorter_string = string2;

  if (string1.length < string2.length) {
    longer_string = string2;
    shorter_string = string1;
  }

  if (longer_string.length === 0 || shorter_string.length === 0) return 0;

  const costs = [];
  for (let i = 0; i <= longer_string.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= shorter_string.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (longer_string.charAt(i - 1) !== shorter_string.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[shorter_string.length] = lastValue;
  }

  return (
    100 *
    ((longer_string.length - costs[shorter_string.length]) /
      longer_string.length)
  );
}

export function compareDate(date: Date): {
  days: number;
  hours: number;
  minutes: number;
  totalMinutes: number;
  estimate: string;
} {
  const today = new Date();
  const diffMs = today.getTime() - date.getTime();
  return {
    days: Math.floor(diffMs / 86400000),
    hours: Math.floor((diffMs % 86400000) / 3600000),
    minutes: Math.round(((diffMs % 86400000) % 3600000) / 60000),
    totalMinutes: Math.round(diffMs / 60000),
    estimate: humanizeDuration(diffMs, { largest: 1, round: true }),
  };
}

export function contains(base: string, part: string | string[]): boolean {
  let parts: string[];
  if (Array.isArray(part)) {
    parts = [...part];
  } else {
    parts = [part];
  }
  for (const this_part of parts) {
    if (base.indexOf(this_part) !== -1) return true;
  }
  return false;
}

export function searchImage(
  name: string,
  options: {
    ratio?: number;
    minWidth?: number;
    minHeight?: number;
  },
): Promise<string | null> {
  return new Promise<string | null>((resolve, reject) => {
    gis(name, async (error, results) => {
      if (error) reject(error);
      if (!results || !Array.isArray(results)) resolve(null);
      for (const result of results) {
        if (!result || !result.url) continue;
        // eslint-disable-next-line no-empty-function
        const probe_result = await probe(result.url, {
          timeout: 10000,
          retries: 3,
        }).catch(probe_error => {
          console.warn(`$searchImage: ${probe_error}`);
        });
        if (!probe_result) continue;
        const width = probe_result.width;
        if (options.minWidth && width < options.minWidth) continue;
        const height = probe_result.height;
        if (options.minHeight && height < options.minHeight) continue;
        const ratio = width / height;
        if (
          options.ratio &&
          (ratio > options.ratio + 0.2 || ratio < options.ratio - 0.2)
        ) {
          continue;
        }
        resolve(result.url);
      }
      resolve(null);
    });
  });
}

export function generateColor(
  options: {
    min?: number;
    max?: number;
  } = {},
): Color {
  const min = options.min ?? 0;
  const max = options.max ?? 255;

  function randomize() {
    const randomNumber = Math.random();
    return Math.floor(randomNumber * (max - min) + min);
  }

  return {
    red: randomize(),
    green: randomize(),
    blue: randomize(),
  };
}
