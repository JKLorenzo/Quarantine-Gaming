const Discord = require('discord.js');
const functions = require('./functions.js');
const classes = require('./classes.js');
/** @type {import('./app.js')} */
let app;

const RoleCreateManager = new classes.ProcessQueue(1000);
const RoleDeleteManager = new classes.ProcessQueue(5000);
const RoleAddManager = new classes.ProcessQueue(1000);
const RoleRemoveManager = new classes.ProcessQueue(1000);

/**
 * Initializes this module.
 * @param {Function} ModulesFunction 
 */
module.exports.initialize = (ModulesFunction) => {
    // Link
    const Modules = functions.parseModules(ModulesFunction);
    app = Modules.app;
}

/**
 * Creates a new role in the guild.
 * @param {{name: String, color?: Discord.ColorResolvable, hoist?: Boolean, position?: number, permissions?: Discord.PermissionResolvable, mentionable?: Boolean, reason?: String}} options 
 * @returns {Promise<Discord.Role>} A role object
 */
module.exports.create = (options) => {
    return new Promise(async (resolve, reject) => {
        console.log(`RoleCreate: Queueing ${RoleCreateManager.processID + 1}`);
        await RoleCreateManager.queue();
        console.log(`RoleCreate: Started ${RoleCreateManager.processID}`);
        let output, error;
        try {
            output = await app.guild().roles.create({
                data: {
                    name: options.name,
                    color: options.color,
                    hoist: options.hoist,
                    mentionable: options.mentionable,
                    permissions: options.permissions,
                    position: options.position,
                },
                reason: options.reason
            });
        } catch (err) {
            error = err;
        }
        console.log(`RoleCreate: Finished ${RoleCreateManager.processID}`);
        RoleCreateManager.finish();
        error ? reject(error) : resolve(output)
    });
}

/**
 * Deletes a role from the guild.
 * @param {Discord.Role} role The role object to delete.
 * @param {String} reason The reason for the deletion.
 * @returns {Promise<Discord.Role>} A role object
 */
module.exports.delete = (RoleResolvable, reason = '') => {
    return new Promise(async (resolve, reject) => {
        console.log(`RoleDelete: Queueing ${RoleDeleteManager.processID + 1}`);
        await RoleDeleteManager.queue();
        console.log(`RoleDelete: Started ${RoleDeleteManager.processID}`);
        let output, error = '';
        try {
            output = await app.role(RoleResolvable).delete(reason);
        } catch (err) {
            error = err;
        }
        console.log(`RoleDelete: Finished ${RoleDeleteManager.processID}`);
        RoleDeleteManager.finish();
        error ? reject(error) : resolve(output)
    });
}

/**
 * Adds the role to the target user.
 * @param {Discord.UserResolvable} UserResolvable A message object, a guild member object, a user object, or a Snowflake.
 * @param {Discord.RoleResolvable} RoleResolvable A Role object or a Snowflake.
 * @returns {Promise<Discord.Role>} A role object
 */
module.exports.add = (UserResolvable, RoleResolvable) => {
    return new Promise(async (resolve, reject) => {
        console.log(`RoleAdd: Queueing ${RoleAddManager.processID + 1}`);
        await RoleAddManager.queue();
        console.log(`RoleAdd: Started ${RoleAddManager.processID}`);
        let output, error;
        try {
            output = await app.member(UserResolvable).roles.add(app.role(RoleResolvable));
        } catch (err) {
            error = err;
        }
        console.log(`RoleAdd: Finished ${RoleAddManager.processID}`);
        RoleAddManager.finish();
        error ? reject(error) : resolve(output)
    });
}

/**
 * Removes the role from the target user.
 * @param {Discord.UserResolvable} UserResolvable A message object, a guild member object, a user object, or a Snowflake.
 * @param {Discord.RoleResolvable} RoleResolvable A Role object or a Snowflake.
 * @returns {Promise<Discord.Role>} A role object
 */
module.exports.remove = (UserResolvable, RoleResolvable) => {
    return new Promise(async (resolve, reject) => {
        console.log(`RoleRemove: Queueing ${RoleRemoveManager.processID + 1}`);
        await RoleRemoveManager.queue();
        console.log(`RoleRemove: Started ${RoleRemoveManager.processID}`);
        let output, error;
        try {
            output = await app.member(UserResolvable).roles.remove(app.role(RoleResolvable));
        } catch (err) {
            error = err;
        }
        console.log(`RoleRemove: Finished ${RoleRemoveManager.processID}`);
        RoleRemoveManager.finish();
        error ? reject(error) : resolve(output)
    });
}