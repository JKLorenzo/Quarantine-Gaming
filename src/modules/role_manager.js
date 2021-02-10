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
module.exports.create = (options) => {
	return new Promise((resolve, reject) => {
		console.log(`RoleCreate: Queueing ${RoleManager.processID} (${options.name})`);
		RoleManager.queue().then(async () => {
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
					reason: options.reason,
				});
			}
			catch (err) {
				error = err;
			}
			console.log(`RoleCreate: Finished ${RoleManager.currentID} (${options.name})`);
			RoleManager.finish();
			error ? reject(error) : resolve(output);
		});
	});
};

/**
 * Deletes a role from the guild.
 * @param {Discord.Role} role The role object to delete.
 * @param {String} reason The reason for the deletion.
 * @returns {Promise<Discord.Role>} A role object
 */
module.exports.delete = (RoleResolvable, reason = '') => {
	return new Promise((resolve, reject) => {
		const role = app.role(RoleResolvable);
		console.log(`RoleDelete: Queueing ${RoleManager.processID} (${role ? role.name : RoleResolvable})`);
		RoleManager.queue().then(async () => {
			let output, error = '';
			try {
				output = await role.delete(reason);
			}
			catch (err) {
				error = err;
			}
			console.log(`RoleDelete: Finished ${RoleManager.currentID} (${role ? role.name : RoleResolvable})`);
			RoleManager.finish();
			error ? reject(error) : resolve(output);
		});
	});
};

/**
 * Adds the role to the target user.
 * @param {Discord.UserResolvable} UserResolvable A message object, a guild member object, a user object, or a Snowflake.
 * @param {Discord.RoleResolvable} RoleResolvable A Role object or a Snowflake.
 * @returns {Promise<Discord.Role>} A role object
 */
module.exports.add = (UserResolvable, RoleResolvable) => {
	return new Promise((resolve, reject) => {
		const member = app.member(UserResolvable);
		const role = app.role(RoleResolvable);
		console.log(`RoleAdd: Queueing ${RoleManager.processID} (${member ? member.displayName : UserResolvable} | ${role ? role.name : RoleResolvable})`);
		RoleManager.queue().then(async () => {
			let output, error;
			try {
				output = await member.roles.add(role);
			}
			catch (err) {
				error = err;
			}
			console.log(`RoleAdd: Finished ${RoleManager.currentID} (${member ? member.displayName : UserResolvable} | ${role ? role.name : RoleResolvable})`);
			RoleManager.finish();
			error ? reject(error) : resolve(output);
		});
	});
};

/**
 * Removes the role from the target user.
 * @param {Discord.UserResolvable} UserResolvable A message object, a guild member object, a user object, or a Snowflake.
 * @param {Discord.RoleResolvable} RoleResolvable A Role object or a Snowflake.
 * @returns {Promise<Discord.Role>} A role object
 */
module.exports.remove = (UserResolvable, RoleResolvable) => {
	return new Promise((resolve, reject) => {
		const member = app.member(UserResolvable);
		const role = app.role(RoleResolvable);
		console.log(`RoleRemove: Queueing ${RoleManager.processID} (${member ? member.displayName : UserResolvable} | ${role ? role.name : RoleResolvable})`);
		RoleManager.queue().then(async () => {
			let output, error;
			try {
				output = await member.roles.remove(role);
			}
			catch (err) {
				error = err;
			}
			console.log(`RoleRemove: Finished ${RoleManager.currentID} (${member ? member.displayName : UserResolvable} | ${role ? role.name : RoleResolvable})`);
			RoleManager.finish();
			error ? reject(error) : resolve(output);
		});
	});
};