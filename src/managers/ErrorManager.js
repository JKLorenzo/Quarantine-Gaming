import { MessageEmbed } from 'discord.js';
import { ProcessQueue, constants } from '../utils/Base.js';

/**
 * @typedef {import('../structures/Base').Client} Client
 */

export default class ErrorManager {
	/** @param {Client} client */
	constructor(client) {
		this.client = client;
		this.queuer = new ProcessQueue(1000);
		this.threshold_hitcount = 0;
		this.threshold_reached = false;
		this.errors = new Array();

		this.client.on('rateLimit', data => {
			this.client.message_manager.sendToChannel(constants.interface.channels.telemetry, new MessageEmbed({
				author: { name: 'Quarantine Gaming: Telemetry' },
				title: 'Client Rate Limit',
				thumbnail: { url: constants.images.ratelimit_thumbnail },
				description: [
					`**Method:** ${data.method}`,
					`**Limit:** ${data.limit}`,
					`**Timeout:** ${data.timeout}`,
				].join('\n'),
				footer: { text: data.route },
				color: '#1F85DE',
			}));
		});

		this.client.on('warn', message => {
			this.client.message_manager.sendToChannel(constants.interface.channels.telemetry, new MessageEmbed({
				author: { name: 'Quarantine Gaming: Telemetry' },
				title: 'Client Warning',
				thumbnail: { url: constants.images.warning_thumbnail },
				description: `**Message:** ${message}`,
				color: '#FFA721',
			}));
		});

		this.client.on('error', error => {
			this.client.message_manager.sendToChannel(constants.interface.channels.telemetry, new MessageEmbed({
				author: { name: 'Quarantine Gaming: Telemetry' },
				title: 'Client Error',
				thumbnail: { url: constants.images.error_thumbnail },
				description: [
					`**Name:** ${error.name}`,
					`**Message:** ${error.message}`,
				].join('\n'),
				color: '#FF0A0A',
			}));
		});
	}

	/**
	 * Marks an error for telemetry and notify staff when threshold is reached.
	 * @param {import('../types/Base.js').ErrorTicket} error_ticket
	 */
	mark(error_ticket) {
		console.log(`ErrorManager: Queueing ${this.queuer.totalID} (${error_ticket.name} @${error_ticket.location}: ${error_ticket.error})`);
		return this.queuer.queue(async () => {
			try {
				this.errors.push(error_ticket);
				setTimeout(() => {
					this.errors.shift();
					if (this.errors.length == 0 && !this.errors.some(e => e.error.code && e.error.code == '500')) this.threshold_reached = false;
				}, 60000);

				const epm = this.errors.length;

				if (epm > 5 || (error_ticket.error.code != null && error_ticket.error.code == '500')) {
					this.threshold_reached = true;
				}

				const embed = new MessageEmbed({
					author: { name: 'Quarantine Gaming: Telemetry' },
					title: 'Error Detection',
					thumbnail: { url: constants.images.error_message_thumbnail },
					fields: [
						{ name: 'Method', value: 'N/A', inline: true },
						{ name: 'Location', value: 'N/A', inline: true },
						{ name: 'Error Code', value: 'N/A', inline: true },
						{ name: 'Error Message', value: 'N/A' },
					],
					footer: { text: `Errors/Min: ${epm}    |    Threshold Hit: ${this.threshold_reached ? 'YES' : 'NO'}    |    Threshold Hit Count: ${this.threshold_hitcount}` },
					color: '#FF0000',
				});

				if (error_ticket.name) embed.fields[0].value = error_ticket.name;
				if (error_ticket.location) embed.fields[1].value = error_ticket.location;
				if (error_ticket.error) embed.fields[3].value = error_ticket.error;
				if (error_ticket.error.code) embed.fields[2].value = error_ticket.error.code;

				return this.client.message_manager.sendToChannel(constants.interface.channels.telemetry, embed);
			} catch (error) {
				console.error(`ErrorManager: ${error}`);
			} finally {
				console.log(`ErrorManager: Finished ${this.queuer.currentID}`);
			}
		});
	}
}