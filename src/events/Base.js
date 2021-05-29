import onGuildMemberUpdate from './GuildMemberUpdate.js';
import { ErrorTicketManager, ProcessQueue } from '../utils/Base.js';

const ETM = new ErrorTicketManager('Base Events');

/**
 * @typedef {import('../structures/Base').Client} Client
 */

export default class BaseEvents {
	/** @param {Client} client */
	constructor(client) {
		this.client = client;

		try {
			this.onGuildMemberUpdate = {
				queuer: new ProcessQueue(1000),
				event: this.client.on('guildMemberUpdate', (oldMember, newMember) => {
					this.onGuildMemberUpdate.queuer.queue(async () => {
						try {
							await onGuildMemberUpdate(this.client, oldMember, newMember);
						} catch(error) {
							this.client.error_manager.mark(ETM.create('guildMemberUpdate', error));
						}
					});
				}),
			};
		} catch (error) {
			this.client.error_manager.mark(ETM.create('Base', error));
		}
	}
}