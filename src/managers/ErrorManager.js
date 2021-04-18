const Discord = require('discord.js');
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
						name: `SERVER RESTART (${++this.threshold_hitcount})`,
						type: 'WATCHING',
					});

					// Notify staffs
					this.client.message_manager.sendToChannel(constants.channels.staff, 'I\'m currently detecting issues with Discord; some functionalities are disabled. A bot restart is recommended once the issues are resolved.').catch(async () => {
						const embed = new Discord.MessageEmbed();
						embed.setAuthor('Limited Functionality');
						embed.setTitle('Issues with Discord');
						embed.setDescription('I\'m currently detecting issues with Discord; some functionalities are disabled. A bot restart is recommended once the issues are resolved.');
						embed.setColor('ffe300');
						this.client.message_manager.sendToChannel(constants.channels.server.management, embed);
					});
					this.threshold_reached = true;
				}

				const embed = new Discord.MessageEmbed();
				embed.setAuthor('Quarantine Gaming: Telemetry');
				embed.setTitle('Exception Details');
				if (error_ticket.error) embed.setDescription(error_ticket.error);
				if (error_ticket.name) embed.addField('Method', error_ticket.name, true);
				if (error_ticket.location) embed.addField('Location', error_ticket.location, true);
				if (error_ticket.error.code) embed.addField('Error Code', error_ticket.error.code, true);
				embed.setFooter(`EPM: ${epm}\t | \tTH: ${this.threshold_reached ? 'True' : 'False'}\t | \tTHC: ${this.threshold_hitcount}`);
				embed.setThumbnail('https://mir-s3-cdn-cf.behance.net/project_modules/disp/c9955d46715833.589222657aded.png');
				embed.setTimestamp();
				embed.setColor('#FF0000');
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