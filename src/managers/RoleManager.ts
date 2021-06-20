import {
  Client,
  GuildMember,
  Role,
  RoleData,
  RoleResolvable,
  UserResolvable,
} from 'discord.js';
import constants from '../utils/Constants.js';
import ErrorTicketManager from '../utils/ErrorTicketManager.js';
import ProcessQueue from '../utils/ProcessQueue.js';

const ETM = new ErrorTicketManager('Role Manager');

export default class RoleManager {
  client: Client;
  queuer: ProcessQueue;

  constructor(client: Client) {
    this.client = client;
    this.queuer = new ProcessQueue(1000);
  }

  create(options: RoleData & { guild?: 'qg' | 'cs' }): Promise<Role> {
    console.log(
      `RoleCreate: Queueing ${this.queuer.totalID} (${options.name})`,
    );
    return this.queuer.queue(async () => {
      let result, error;
      try {
        result = await this.client.qg.roles.create(options);
      } catch (this_error) {
        this.client.error_manager.mark(ETM.create('create', this_error));
        error = this_error;
      } finally {
        console.log(
          `RoleCreate: Finished ${this.queuer.currentID} (${options.name})`,
        );
      }
      if (error) throw error;
      return result;
    }) as Promise<Role>;
  }

  delete(role: RoleResolvable, reason?: string): Promise<Role> {
    const this_role = this.client.role(role);
    console.log(
      `RoleDelete: Queueing ${this.queuer.totalID} (${
        this_role?.name ?? role
      })`,
    );
    return this.queuer.queue(async () => {
      let result, error;
      try {
        if (this_role) result = await this_role.delete(reason);
      } catch (this_error) {
        this.client.error_manager.mark(ETM.create('delete', this_error));
        error = this_error;
      } finally {
        console.log(
          `RoleDelete: Finished ${this.queuer.currentID} (${
            this_role?.name ?? role
          })`,
        );
      }
      if (error) throw error;
      return result;
    }) as Promise<Role>;
  }

  add(
    user: UserResolvable,
    role: RoleResolvable,
    reason?: string,
  ): Promise<GuildMember> {
    const this_member = this.client.member(user);
    const this_role = this.client.role(role);
    console.log(
      `RoleAdd: Queueing ${this.queuer.totalID} (${
        this_member?.displayName ?? user
      } | ${this_role?.name ?? role})`,
    );
    return this.queuer.queue(async () => {
      let result, error;
      try {
        if (!this_member) {
          throw new TypeError(`${this_member} is not a member.`);
        }
        if (!this_role) {
          throw new TypeError(`${this_role} is not a role.`);
        }

        result = await this_member.roles.add(this_role, reason);
        if (this_role.hexColor === constants.colors.game_role) {
          await this_member.updateGameRole(this_role);
        }
      } catch (this_error) {
        this.client.error_manager.mark(ETM.create('add', this_error));
        error = this_error;
      } finally {
        console.log(
          `RoleAdd: Finished ${this.queuer.currentID} (${
            this_member?.displayName ?? user
          } | ${this_role?.name ?? role})`,
        );
      }
      if (error) throw error;
      return result;
    }) as Promise<GuildMember>;
  }

  remove(
    user: UserResolvable,
    role: RoleResolvable,
    reason?: string,
  ): Promise<GuildMember> {
    const this_member = this.client.member(user);
    const this_role = this.client.role(role);
    console.log(
      `RoleRemove: Queueing ${this.queuer.totalID} (${
        this_member?.displayName ?? user
      } | ${this_role?.name ?? role})`,
    );
    return this.queuer.queue(async () => {
      let result, error;
      try {
        if (!this_member) {
          throw new TypeError(`${this_member} is not a member.`);
        }
        if (!this_role) {
          throw new TypeError(`${this_role} is not a role.`);
        }

        result = await this_member.roles.remove(this_role, reason);
      } catch (this_error) {
        this.client.error_manager.mark(ETM.create('remove', this_error));
        error = this_error;
      } finally {
        console.log(
          `RoleRemove: Finished ${this.queuer.currentID} (${
            this_member?.displayName ?? user
          } | ${this_role?.name ?? role})`,
        );
      }
      if (error) throw error;
      return result;
    }) as Promise<GuildMember>;
  }
}
