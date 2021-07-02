import {
  Client,
  Guild,
  GuildChannel,
  GuildChannelResolvable,
  GuildMember,
  GuildMemberResolvable,
  Role,
  RoleResolvable,
  ThreadChannel,
} from 'discord.js';
import { parseMention } from '../utils/Functions';

export default class ExtendedGuild extends Guild {
  // eslint-disable-next-line no-useless-constructor
  constructor(client: Client, data: unknown) {
    super(client, data);
  }

  member(resolvable: GuildMemberResolvable): GuildMember | undefined {
    if (typeof resolvable === 'string') resolvable = parseMention(resolvable);
    return this.members.resolve(resolvable) ?? undefined;
  }

  role(resolvable: RoleResolvable): Role | undefined {
    if (typeof resolvable === 'string') resolvable = parseMention(resolvable);
    return this.roles.resolve(resolvable) ?? undefined;
  }

  channel(
    resolvable: GuildChannelResolvable,
  ): GuildChannel | ThreadChannel | undefined {
    if (typeof resolvable === 'string') resolvable = parseMention(resolvable);
    return this.channels.resolve(resolvable) ?? undefined;
  }
}
