const { MessageEmbed } = require('discord.js');
const { ProcessQueue, constants } = require('../utils/Base.js');

/**
 * @typedef {import('../structures/Base.js').Client} Client
 */

module.exports = class ErrorManager {
	/** @param {Client} client */
	constructor(client) {
		this.client = client;
		this.queuer = new ProcessQueue(1000);
		this.threshold_hitcount = 0;
		this.threshold_reached = false;
		this.errors = new Array();
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
					if (this.errors.length == 0) this.threshold_reached = false;
				}, 60000);

				const epm = this.errors.length;

				if ((epm > 5 || (error_ticket.error.code != null && error_ticket.error.code == '500')) && !this.threshold_reached) {
					// Change bot presence
					this.client.user.setActivity({
						name: `THC ${++this.threshold_hitcount}`,
						type: 'WATCHING',
					});

					// Notify staffs
					this.client.message_manager.sendToChannel(constants.channels.staff, 'I\'m currently detecting issues with Discord; some functionalities are disabled. A bot restart is recommended once the issues are resolved.').catch(async () => {
						this.client.message_manager.sendToChannel(constants.channels.server.management, new MessageEmbed({
							author: { name: 'Quarantine Gaming: Telemetry' },
							title: 'Limited Functionality',
							description: 'I\'m currently detecting issues with Discord; some functionalities are disabled. A bot restart is recommended once the issues are resolved.',
							color: '#FF4700',
						}));
					});
					this.threshold_reached = true;
				}

				const embed = new MessageEmbed({
					author: { name: 'Quarantine Gaming: Telemetry' },
					title: 'Error Detection',
					thumbnail: { url: constants.images.error_message_thumbnail },
					fields: [
						{ name: 'Errors/Min:', value: epm, inline: true },
						{ name: 'Threshold Hit:', value: this.threshold_reached ? 'True' : 'False', inline: true },
						{ name: 'Threshold Hit Count:', value: this.threshold_hitcount, inline: true },
					],
					color: '#FF0000',
				});
				if (error_ticket.name) embed.addField('Method', error_ticket.name, true);
				if (error_ticket.location) embed.addField('Location', error_ticket.location, true);
				if (error_ticket.error.code) embed.addField('Error Code', error_ticket.error.code, true);
				if (error_ticket.error) embed.addField('Error Message', error_ticket.error);

				return this.client.message_manager.sendToChannel(constants.channels.qg.logs, embed);
			}
			catch (error) {
				console.log(`ErrorManager: Failed with error (${error})`);
			}
			finally {
				console.log(`ErrorManager: Finished ${this.queuer.currentID}`);
			}
		});
	}
};