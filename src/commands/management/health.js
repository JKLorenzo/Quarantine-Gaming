const Discord = require('discord.js');
const Commando = require('discord.js-commando');
const functions = require('../../modules/functions.js');

module.exports = class Health extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'health',
			group: 'management',
			memberName: 'health',
			description:'Checks the health of this bot.',
		});
	}

	/** @param {Commando.CommandoMessage} message */
	async run(message) {
		const now = Date.now();
		const dummy_message = await message.channel.send('Pinging...');
		await dummy_message.delete({ timeout: 2500 }).catch(e => void e);

		/** @type {import('../../modules/message_manager.js');} */
		const message_manager = this.client.modules.message_manager;
		/** @type {import('../../modules/reaction_manager.js');} */
		const reaction_manager = this.client.modules.reaction_manager;
		/** @type {import('../../modules/channel_manager.js');} */
		const channel_manager = this.client.modules.channel_manager;
		/** @type {import('../../modules/role_manager.js');} */
		const role_manager = this.client.modules.role_manager;
		/** @type {import('../../modules/speech.js');} */
		const speech = this.client.modules.speech;
		/** @type {import('../../modules/error_manager.js');} */
		const error_manager = this.client.modules.error_manager;
		/** @type {import('../../modules/database.js')} */
		const database = this.client.modules.database;

		message.delete({ timeout: 1000 }).catch(e => void e);

		const embed = new Discord.MessageEmbed();
		embed.setAuthor('Quarantine Gaming: Health Monitor');
		embed.setTitle('Health Report');
		embed.setColor('#ffff00');

		let buffer = new Array();
		let ping = this.client.ws.ping;
		buffer.push(`${getPingStatus(ping)} **API Latency:** ${ping} ms`);
		ping = now - message.createdTimestamp;
		buffer.push(`${getPingStatus(ping)} **Response Time:** ${ping} ms`);
		ping = dummy_message.createdTimestamp - message.createdTimestamp;
		buffer.push(`${getPingStatus(ping)} **Message Round-trip Time:** ${ping} ms`);
		embed.addField('Connection', buffer.join('\n'));

		buffer = new Array();
		let currentID = database.ExpiredGameRoleManager.currentID;
		let totalID = database.ExpiredGameRoleManager.totalID;
		buffer.push(`${getStatus(currentID, totalID)} **Expired Game Role Manager:** ${getPercent(currentID, totalID)} of ${totalID + 1}`);
		currentID = database.GameRoleSetManager.currentID;
		totalID = database.GameRoleSetManager.totalID;
		buffer.push(`${getStatus(currentID, totalID)} **Game Role Update Manager:** ${getPercent(currentID, totalID)} of ${totalID + 1}`);
		currentID = database.GameRoleDeleteManager.currentID;
		totalID = database.GameRoleDeleteManager.totalID;
		buffer.push(`${getStatus(currentID, totalID)} **Game Role Delete Manager:** ${getPercent(currentID, totalID)} of ${totalID + 1}`);
		embed.addField('Database', buffer.join('\n'));

		buffer = new Array();
		currentID = message_manager.OutgoingMessageManager.currentID;
		totalID = message_manager.OutgoingMessageManager.totalID;
		buffer.push(`${getStatus(currentID, totalID)} **Message Manager:** ${getPercent(currentID, totalID)} of ${totalID + 1}`);
		currentID = reaction_manager.ReactionAddManager.currentID;
		totalID = reaction_manager.ReactionAddManager.totalID;
		buffer.push(`${getStatus(currentID, totalID)} **Reaction Manager:** ${getPercent(currentID, totalID)} of ${totalID + 1}`);
		currentID = channel_manager.ChannelQueueManager.currentID;
		totalID = channel_manager.ChannelQueueManager.totalID;
		buffer.push(`${getStatus(currentID, totalID)} **Channel Manager:** ${getPercent(currentID, totalID)} of ${totalID + 1}`);
		currentID = role_manager.RoleManager.currentID;
		totalID = role_manager.RoleManager.totalID;
		buffer.push(`${getStatus(currentID, totalID)} **Role Manager:** ${getPercent(currentID, totalID)} of ${totalID + 1}`);
		currentID = speech.SpeechManager.currentID;
		totalID = speech.SpeechManager.totalID;
		buffer.push(`${getStatus(currentID, totalID)} **Speech Manager:** ${getPercent(currentID, totalID)} of ${totalID + 1}`);
		currentID = error_manager.MarkManager.currentID;
		totalID = error_manager.MarkManager.totalID;
		buffer.push(`${getStatus(currentID, totalID)} **Error Manager:** ${getPercent(currentID, totalID)} of ${totalID + 1}`);
		embed.addField('Process', buffer.join('\n'));

		const startup_date = new Date(Date.now() - this.client.uptime);
		embed.setFooter(`Startup Time: ${functions.compareDate(startup_date).estimate}`);
		embed.setTimestamp(startup_date);

		return message.channel.send(embed).then(this_message => {
			this_message.delete({ timeout: 60000 }).catch(e => void e);
		});
	}
};

/** @type {Number} ping */
function getPingStatus(ping) {
	if (ping >= 250) {
		return '🔴';
	}
	else if (ping >= 100) {
		return '🟠';
	}
	else {
		return '🟢';
	}
}

/**
 * @param {Number} currentID
 * @param {Number} totalID
 */
function getStatus(currentID, totalID) {
	const difference = totalID - currentID;
	if (difference >= 10) {
		return '🔴';
	}
	else if (difference >= 5) {
		return '🟠';
	}
	else {
		return '🟢';
	}
}

/**
 * @param {Number} currentID
 * @param {Number} totalID
 */
function getPercent(currentID, totalID) {
	return `${Math.floor((currentID + 1) / (totalID + 1) * 100)}%`;
}