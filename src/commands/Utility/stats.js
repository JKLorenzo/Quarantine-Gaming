const { MessageEmbed } = require('discord.js');
const { Command } = require('discord-akairo');
const { compareDate } = require('../../utils/Base.js');

/**
 * @typedef {import('../../structures/Base.js').Client} Client
 * @typedef {import('../../structures/Base.js').ExtendedMessage} ExtendedMessage
 * @typedef {import('../../utils/Base.js').ProcessQueue} ProcessQueue
 */

/**
 * @param {String} name
 * @param {ProcessQueue | ProcessQueue[]} processqueue
 */
function getProcessQueueHealth(name, processqueue) {
	let difference = 0;
	let percent = 1;
	let currentID, totalID;
	if (Array.isArray(processqueue)) {
		for (const this_pq of processqueue) {
			totalID = this_pq.totalID + 1;
			currentID = this_pq.currentID + 1;
			difference += totalID;
			difference -= currentID;
			percent *= currentID / totalID;
		}
	}
	else {
		totalID = processqueue.totalID + 1;
		currentID = processqueue.currentID + 1;
		difference = totalID - currentID;
		percent = currentID / totalID;
	}
	return `${difference >= 10 ? '🔴' : difference >= 5 ? '🟠' : '🟢'} **${name}**: ${(percent * 100).toFixed(0)}% of ${totalID}`;
}

/**
 * @param {String} name
 * @param {Number} ping
 */
function getPingHealth(name, ping) {
	return `${ping >= 200 ? '🔴' : ping >= 100 ? '🟠' : '🟢'} **${name}**: ${ping} ms`;
}

module.exports = class Stats extends Command {
	constructor() {
		super('stats', {
			aliases: ['stats', 'health'],
			category: 'Utility',
			description: 'Checks the health of this bot.',
		});
	}

	/** @param {ExtendedMessage} message */
	async exec(message) {
		/** @type {Client} */
		const client = message.client;

		const now = Date.now();
		const reply = await message.reply('Checking message round-trip time...');
		const uptime = new Date(now - client.uptime);
		const embed = new MessageEmbed({
			author: { name: 'Quarantine Gaming: Telemetry' },
			title: 'Bot Statistics',
			footer: { text: `Startup Time: ${compareDate(uptime).estimate}` },
			timestamp: uptime,
			color: '#ffff00',
		});
		let buffer = new Array();
		buffer.push(getPingHealth('API Latency', client.ws.ping));
		buffer.push(getPingHealth('Message Response Time', now - message.createdTimestamp));
		buffer.push(getPingHealth('Message Round-trip Time', reply.createdTimestamp - message.createdTimestamp));
		embed.addField('Connection', `${buffer.join('\n')}`);

		const {
			onGuildBanAdd, onGuildBanRemove,
			onGuildMemberAdd, onGuildMemberRemove, onGuildMemberUpdate,
			onInviteCreate,
			onMessage, onMessageReactionAdd, onMessageReactionRemove,
			onPresenceUpdate,
			onRoleCreate, onRoleDelete, onRoleUpdate,
			onUserUpdate,
			onVoiceStateUpdate,
		} = client.events;
		buffer = new Array();
		buffer.push(getProcessQueueHealth('User Events', [onUserUpdate.queuer]));
		buffer.push(getProcessQueueHealth('Member Events', [onGuildMemberAdd.queuer, onGuildMemberRemove.queuer, onGuildMemberUpdate.queuer]));
		buffer.push(getProcessQueueHealth('Message Events', [onMessage.queuer, onMessageReactionAdd.queuer, onMessageReactionRemove.queuer]));
		buffer.push(getProcessQueueHealth('Presence Events', [onPresenceUpdate.queuer]));
		buffer.push(getProcessQueueHealth('Role Events', [onRoleCreate.queuer, onRoleDelete.queuer, onRoleUpdate.queuer]));
		buffer.push(getProcessQueueHealth('Voice Events', [onVoiceStateUpdate.queuer]));
		buffer.push(getProcessQueueHealth('Ban Events', [onGuildBanAdd.queuer, onGuildBanRemove.queuer]));
		buffer.push(getProcessQueueHealth('Invite Events', [onInviteCreate.queuer]));
		embed.addField('Client Events', `${buffer.join('\n')}`);

		buffer = new Array();
		buffer.push(getProcessQueueHealth('Channel Manager', client.channel_manager.queuer));
		buffer.push(getProcessQueueHealth('Database Manager', [client.database_manager.queuers.expired_gameroles]));
		buffer.push(getProcessQueueHealth('Dedicated Channel Manager', client.dedicated_channel_manager.queuer));
		buffer.push(getProcessQueueHealth('Error Manager', client.error_manager.queuer));
		buffer.push(getProcessQueueHealth('Message Manager', client.message_manager.queuer));
		buffer.push(getProcessQueueHealth('Reaction Manager', client.reaction_manager.queuer));
		buffer.push(getProcessQueueHealth('Role Manager', client.role_manager.queuer));
		buffer.push(getProcessQueueHealth('Speech Manager', client.speech_manager.queuer));
		embed.addField('Client Managers', `${buffer.join('\n')}`);

		return reply.edit({ content: '', embed }).then(() => {
			message.delete({ timeout: 30000 }).catch(e => void e);
			reply.delete({ timeout: 30000 }).catch(e => void e);
		});
	}
};