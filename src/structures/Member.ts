import { Client, Collection, Guild, GuildMember, Role } from 'discord.js';
import { PartialMember, PartialRole } from './Interfaces';

export default class ExtendedMember extends GuildMember {
  private partial_data: PartialMember;

  constructor(client: Client, data: unknown, guild: Guild) {
    super(client, data, guild);

    this.partial_data = {
      id: this.id,
      name: this.displayName,
      tagname: this.user.tag,
      roles: new Collection(),
    };
  }

  public register(inviter: GuildMember, moderator: GuildMember): Promise<void> {
    this.partial_data.inviter = inviter.id;
    this.partial_data.moderator = moderator.id;
    return this.client.database_manager.updateMemberData(
      this.id,
      this.partial_data,
    );
  }

  private async fetchData(): Promise<void> {
    const partial_member = await this.client.database_manager.getMemberData(
      this.id,
    );

    if (partial_member?.inviter) {
      this.partial_data.inviter = partial_member.inviter;
    }
    if (partial_member?.moderator) {
      this.partial_data.moderator = partial_member.moderator;
    }
    if (partial_member?.roles) {
      this.partial_data.roles = partial_member.roles;
    }
  }

  public async fetchInviter(): Promise<GuildMember | null> {
    await this.fetchData();

    return this.partial_data.inviter
      ? this.client.member(this.partial_data.inviter)
      : null;
  }

  async fetchModerator(): Promise<GuildMember | null> {
    await this.fetchData();

    return this.partial_data.moderator
      ? this.client.member(this.partial_data.moderator)
      : null;
  }

  public async fetchExpiredGameRoles(): Promise<PartialRole[]> {
    await this.fetchData();

    const expired_roles = [] as PartialRole[];
    const today = Date.now();
    for (const this_role of this.partial_data.roles.array()) {
      if (today >= this_role.lastUpdated.getTime()) {
        expired_roles.push(this_role);
      }
    }
    return expired_roles;
  }

  public async updateGameRole(role: Role): Promise<void> {
    await this.client.database_manager.updateMemberGameRole(this.id, role.id, {
      name: role.name,
      lastUpdated: new Date(),
    });

    this.partial_data.roles.set(role.id, {
      id: role.id,
      name: role.name,
      lastUpdated: new Date(),
    });
  }

  public async deleteGameRole(id: `${bigint}`): Promise<void> {
    await this.client.database_manager.deleteMemberGameRole(this.id, id);

    const this_role = this.partial_data.roles.get(id);
    if (this_role) this.partial_data.roles.delete(id);
  }
}
