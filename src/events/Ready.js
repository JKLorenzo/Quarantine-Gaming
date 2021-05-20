const { constants } = require('../utils/Base.js');

/**
 * @typedef {import('../structures/Base.js').Client} Client
 */

/** @param {Client} client */
module.exports = async function onceReady(client) {
	console.log('Client logged in. Initializing...');

	await client.database_manager.init();
	await client.gateway_manager.init();
	await client.interaction_manager.init();

	await client.methods.loadMembers();
	await client.game_manager.init();

	client.dedicated_channel_manager.actions.start();
	client.free_game_manager.actions.start();

	client.message_manager.sendToChannel(constants.interface.channels.logs, '<------------------------------**STARTUP**------------------------------>');

	console.log('Client initialized.');
};