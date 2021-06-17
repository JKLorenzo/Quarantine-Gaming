export interface PartialMember {
  id: bigint;
  name: string;
  tagname: string;
  inviter: bigint;
  moderator: bigint;
}

export interface PartialRole {
  id: bigint;
  name: string;
  lastUpdated: number;
}

export interface FreeGame {
  id?: bigint;
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
