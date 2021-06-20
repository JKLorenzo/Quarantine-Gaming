import { Collection, DiscordAPIError } from 'discord.js';

export interface PartialRole {
  id: `${bigint}`;
  name: string;
  lastUpdated: Date;
}

export interface PartialRoleData {
  name?: string;
  lastUpdated?: Date;
}

export interface PartialMember {
  id: `${bigint}`;
  name: string;
  tagname: string;
  inviter?: `${bigint}`;
  moderator?: `${bigint}`;
  roles: Collection<string, PartialRole>;
}

export interface PartialMemberData {
  name?: string;
  tagname?: string;
  inviter?: `${bigint}`;
  moderator?: `${bigint}`;
  roles?: Collection<string, PartialRole>;
}

export interface Game {
  name: string;
  icon: string;
  banner: string;
  status: 'Pending' | 'Approved' | 'Denied';
}

export interface GameData {
  icon?: string;
  banner?: string;
  status?: 'Pending' | 'Approved' | 'Denied';
}

export interface FreeGame {
  id?: `${bigint}`;
  title: string;
  url: string;
  author: string;
  description: string | null;
  created: Date;
  validity: number;
  score: string;
  flair: string | null;
  permalink: string;
}

export interface Color {
  red: number;
  green: number;
  blue: number;
}

export interface ErrorTicket {
  name: string;
  location: string;
  error: Error | DiscordAPIError;
}
