import onGuildMemberUpdate from './GuildMemberUpdate.js';
import onceReady from './Ready.js';
import onUserUpdate from './UserUpdate.js';
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
			this.onceReady = {
				emitted: false,
				event: this.client.once('ready', async () => {
					try {
						if (this.onceReady.emitted) throw new Error('Event already emitted.');
						this.onceReady.emitted = true;
						await onceReady(this.client);
					} catch(error) {
						this.client.error_manager.mark(ETM.create('ready', error));
					}
				}),
			};

			this.onUserUpdate = {
				queuer: new ProcessQueue(1000),
				event:  this.client.on('userUpdate', (oldUser, newUser) => {
					this.onUserUpdate.queuer.queue(async () => {
						try {
							await onUserUpdate(this.client, oldUser, newUser);
						} catch(error) {
							this.client.error_manager.mark(ETM.create('userUpdate', error));
						}
					});
				}),
			};

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