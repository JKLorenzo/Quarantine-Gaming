import { ErrorTicketManager, ProcessQueue, constants } from '../utils/Base.js';

/**
 * @typedef {import('discord.js').Role} Role
 * @typedef {import('discord.js').RoleData} RoleData
 * @typedef {import('discord.js').GuildMember} GuildMember
 * @typedef {import('discord.js').RoleResolvable} RoleResolvable
 * @typedef {import('discord.js').UserResolvable} UserResolvable
 * @typedef {import('discord.js').ColorResolvable} ColorResolvable
 * @typedef {import('discord.js').PermissionResolvable} PermissionResolvable
 * @typedef {import('../structures/Base').Client} Client
 */

const ETM = new ErrorTicketManager('Role Manager');

export default class RoleManager {
  /**
   * @param {Client} client The QG Client
   */
  constructor(client) {
    this.client = client;
    this.queuer = new ProcessQueue(1000);
  }

  /**
   * Creates a new role in the guild.
   * @param {RoleData} options The options of this role
   * @returns {Role}
   */
  create(options) {
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
    });
  }

  /**
   * Deletes a role from the guild.
   * @param {RoleResolvable} role The role to delete
   * @param {string} [reason] The reason for deleting this role
   * @returns {Promise<Role>}
   */
  delete(role, reason) {
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
    });
  }

  /**
   * Adds the role to the target user.
   * @param {UserResolvable} user The user where the role will be added
   * @param {RoleResolvable} role The role to be added
   * @param {string} [reason] The reason for adding the role
   * @returns {Promise<GuildMember>}
   */
  add(user, role, reason) {
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
        result = await this_member.roles.add(this_role, reason);
        if (this_role.hexColor === constants.colors.game_role) {
          await this.client.database_manager.updateMemberGameRole(
            this_member.id,
            {
              id: this_role.id,
              name: this_role.name,
            },
          );
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
    });
  }

  /**
   * Removes the role from the target user.
   * @param {UserResolvable} user The user where the role will be removed
   * @param {RoleResolvable} role The role to be removed
   * @param {string} [reason] The reason for removing the role
   * @returns {Promise<GuildMember>}
   */
  remove(user, role, reason) {
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
    });
  }
}
