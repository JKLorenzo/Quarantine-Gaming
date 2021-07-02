import { Client, Guild, GuildMember, GuildMemberResolvable } from 'discord.js';
import { parseMention } from '../utils/Functions';

export default class extends Guild {
  // eslint-disable-next-line no-useless-constructor
  constructor(client: Client, data: unknown) {
    super(client, data);
  }

  member(resolvable: GuildMemberResolvable): GuildMember | undefined {
    if (typeof resolvable === 'string') resolvable = parseMention(resolvable);
    return this.members.resolve(resolvable) ?? undefined;
  }
}
