// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');
const classes = require('./classes.js');
/** @type {import('./app.js')} */
let app;

const RoleManager = new classes.Manager;

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
	let res, rej;
	const promise = new Promise((resolve, reject) => {
		res = resolve;
		rej = reject;
	});
	console.log(`RoleCreate: Queueing ${RoleManager.totalID} (${options.name})`);
	RoleManager.queue(async function() {
		let result, error;
		try {
			result = await app.guild().roles.create({
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
		}
		catch (this_error) {
			error = this_error;
		}
		finally {
			console.log(`RoleCreate: Finished ${RoleManager.currentID} (${options.name})`);
			error ? rej(error) : res(result);
		}
	});
	return promise;
};

/**
 * Deletes a role from the guild.
 * @param {Discord.Role} role The role object to delete.
 * @param {String} reason The reason for the deletion.
 * @returns {Promise<Discord.Role>} A role object
 */
module.exports.delete = async (RoleResolvable, reason = '') => {
	let res, rej;
	const promise = new Promise((resolve, reject) => {
		res = resolve;
		rej = reject;
	});
	const role = app.role(RoleResolvable);
	console.log(`RoleDelete: Queueing ${RoleManager.totalID} (${role ? role.name : RoleResolvable})`);
	RoleManager.queue(async function() {
		let result, error;
		try {
			result = await role.delete(reason);
		}
		catch (this_error) {
			error = this_error;
		}
		finally {
			console.log(`RoleDelete: Finished ${RoleManager.currentID} (${role ? role.name : RoleResolvable})`);
			error ? rej(error) : res(result);
		}
	});
	return promise;
};

/**
 * Adds the role to the target user.
 * @param {Discord.UserResolvable} UserResolvable A message object, a guild member object, a user object, or a Snowflake.
 * @param {Discord.RoleResolvable} RoleResolvable A Role object or a Snowflake.
 * @returns {Promise<Discord.Role>} A role object
 */
module.exports.add = async (UserResolvable, RoleResolvable) => {
	let res, rej;
	const promise = new Promise((resolve, reject) => {
		res = resolve;
		rej = reject;
	});
	const member = app.member(UserResolvable);
	const role = app.role(RoleResolvable);
	console.log(`RoleAdd: Queueing ${RoleManager.totalID} (${member ? member.displayName : UserResolvable} | ${role ? role.name : RoleResolvable})`);
	RoleManager.queue(async function() {
		let result, error;
		try {
			result = await member.roles.add(role);
		}
		catch (this_error) {
			error = this_error;
		}
		finally {
			console.log(`RoleAdd: Finished ${RoleManager.currentID} (${member ? member.displayName : UserResolvable} | ${role ? role.name : RoleResolvable})`);
			error ? rej(error) : res(result);
		}
	});
	return promise;
};

/**
 * Removes the role from the target user.
 * @param {Discord.UserResolvable} UserResolvable A message object, a guild member object, a user object, or a Snowflake.
 * @param {Discord.RoleResolvable} RoleResolvable A Role object or a Snowflake.
 * @returns {Promise<Discord.Role>} A role object
 */
module.exports.remove = async (UserResolvable, RoleResolvable) => {
	let res, rej;
	const promise = new Promise((resolve, reject) => {
		res = resolve;
		rej = reject;
	});
	const member = app.member(UserResolvable);
	const role = app.role(RoleResolvable);
	console.log(`RoleRemove: Queueing ${RoleManager.totalID} (${member ? member.displayName : UserResolvable} | ${role ? role.name : RoleResolvable})`);
	RoleManager.queue(async function() {
		let result, error;
		try {
			result = await member.roles.remove(role);
		}
		catch (this_error) {
			error = this_error;
		}
		finally {
			console.log(`RoleRemove: Finished ${RoleManager.currentID} (${member ? member.displayName : UserResolvable} | ${role ? role.name : RoleResolvable})`);
			error ? rej(error) : res(result);
		}
	});
	return promise;
};

module.exports.RoleManager = RoleManager;