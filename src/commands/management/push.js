const Commando = require('discord.js-commando');
const constants = require('../../modules/constants.js');
/** @type {import('../../modules/app.js')} */
let app;
/** @type {import('../../modules/general.js')} */
let general;

module.exports = class PushCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'push',
			group: 'management',
			memberName: 'push',
			description: '[Mod] Manually push a free game update url.',
			userPermissions: [constants.permissions.general.MANAGE_CHANNELS],
			args: [
				{
					key: 'url',
					prompt: 'Enter the url to the giveaway or the permalink of the source.',
					type: 'string',
				},
			],
		});
	}

	/**
     * @param {Commando.CommandoMessage} message
     * @param {{url: String}}
     */
	async run(message, { url }) {
		// Link
		app = this.client.modules.app;
		general = this.client.modules.general;

		// Check user permissions
		if (!app.hasRole(message.author, [constants.roles.staff, constants.roles.moderator])) {
			return message.reply('You don\'t have permissions to use this command.').then(this_message => {
				this_message.delete({ timeout: 10000 }).catch(e => void e);
			}).catch(e => void e);
		}

		const reply = await message.reply('Checking...');
		reply.edit(await general.freeGameFetch(url)).then(this_message => {
			this_message.delete({ timeout: 10000 }).catch(e => void e);
		}).catch(e => void e);
	}
};