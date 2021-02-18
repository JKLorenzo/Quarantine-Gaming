// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');
const classes = require('./classes.js');
/** @type {import('./app.js')} */
let app;

const RoleManager = new classes.ProcessQueue(2500);

/**
 * Initializes the module.
 * @param {import('discord.js-commando').CommandoClient} ClientInstance The Commando Client instance used to login.
 */
module.exports.initialize = (ClientInstance) => {
	// Link
	app = ClientInstance.modules.app;
};

/**
 * Creates a new role in the guild.
 * @param {{name: String, color?: Discord.ColorResolvable, hoist?: Boolean, position?: number, permissions?: Discord.PermissionResolvable, mentionable?: Boolean, reason?: String}} options
 * @returns {Promise<Discord.Role>} A role object
 */
module.exports.create = async (options) => {
	console.log(`RoleCreate: Queueing ${RoleManager.processID} (${options.name})`);
	await RoleManager.queue();
	const result = await app.guild().roles.create({
		data: {
			name: options.name,
			color: options.color,
			hoist: options.hoist,
			mentionable: options.mentionable,
			permissions: options.permissions,
			position: options.position,
		},
		reason: options.reason,
	});
	console.log(`RoleCreate: Finished ${RoleManager.currentID} (${options.name})`);
	RoleManager.finish();
	return result;
};

/**
 * Deletes a role from the guild.
 * @param {Discord.Role} role The role object to delete.
 * @param {String} reason The reason for the deletion.
 * @returns {Promise<Discord.Role>} A role object
 */
module.exports.delete = async (RoleResolvable, reason = '') => {
	const role = app.role(RoleResolvable);
	console.log(`RoleDelete: Queueing ${RoleManager.processID} (${role ? role.name : RoleResolvable})`);
	await RoleManager.queue();
	const result = await role.delete(reason);
	console.log(`RoleDelete: Finished ${RoleManager.currentID} (${role ? role.name : RoleResolvable})`);
	RoleManager.finish();
	return result;
};

/**
 * Adds the role to the target user.
 * @param {Discord.UserResolvable} UserResolvable A message object, a guild member object, a user object, or a Snowflake.
 * @param {Discord.RoleResolvable} RoleResolvable A Role object or a Snowflake.
 * @returns {Promise<Discord.Role>} A role object
 */
module.exports.add = async (UserResolvable, RoleResolvable) => {
	const member = app.member(UserResolvable);
	const role = app.role(RoleResolvable);
	console.log(`RoleAdd: Queueing ${RoleManager.processID} (${member ? member.displayName : UserResolvable} | ${role ? role.name : RoleResolvable})`);
	await RoleManager.queue();
	const result = await member.roles.add(role);
	console.log(`RoleAdd: Finished ${RoleManager.currentID} (${member ? member.displayName : UserResolvable} | ${role ? role.name : RoleResolvable})`);
	RoleManager.finish();
	return result;
};

/**
 * Removes the role from the target user.
 * @param {Discord.UserResolvable} UserResolvable A message object, a guild member object, a user object, or a Snowflake.
 * @param {Discord.RoleResolvable} RoleResolvable A Role object or a Snowflake.
 * @returns {Promise<Discord.Role>} A role object
 */
module.exports.remove = async (UserResolvable, RoleResolvable) => {
	const member = app.member(UserResolvable);
	const role = app.role(RoleResolvable);
	console.log(`RoleRemove: Queueing ${RoleManager.processID} (${member ? member.displayName : UserResolvable} | ${role ? role.name : RoleResolvable})`);
	await RoleManager.queue();
	const result = await member.roles.remove(role);
	console.log(`RoleRemove: Finished ${RoleManager.currentID} (${member ? member.displayName : UserResolvable} | ${role ? role.name : RoleResolvable})`);
	RoleManager.finish();
	return result;
};

module.exports.RoleManager = RoleManager;