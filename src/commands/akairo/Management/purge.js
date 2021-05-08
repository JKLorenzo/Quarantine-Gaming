const { MessageEmbed, Permissions } = require('discord.js');
const { Command } = require('discord-akairo');
const { constants, sleep } = require('../../../utils/Base.js');

/**
 * @typedef {import('../../../structures/Base.js').Client} Client
 * @typedef {import('../../../structures/Base.js').ExtendedMessage} ExtendedMessage
 * @typedef {import('../../../structures/Base.js').ExtendedMember} ExtendedMember
 * @typedef {import('discord.js').TextChannel} TextChannel
 */

module.exports = class Purge extends Command {
	constructor() {
		super('purge', {
			aliases: ['purge', 'cleanup'],
			category: 'Management',
			description: '[Mod] Removes a number of messages on the current channel.',
			channel: 'guild',
			args: [
				{
					id: 'count',
					type: (message, phrase) => {
						const this_int = parseInt(phrase);
						if (!isNaN(this_int) && this_int > 0 && this_int <= 100) return this_int;
						return null;
					},
					description: 'The number of messages to delete.',
					prompt: {
						start: 'Enter the number of messages to delete.',
						retry: 'You must enter a number from 1 to 100.',
					},
				},
			],
		});
	}

	/** @param {ExtendedMessage} message */
	userPermissions(message) {
		/** @type {ExtendedMember} */
		const member = message.member;
		if (!member.hasRole([constants.roles.staff, constants.roles.moderator])) return 'Staff/Moderator';
		if (!member.permissionsIn(message.channel).has(Permissions.FLAGS.MANAGE_MESSAGES)) return 'Manage Messages';
		return null;
	}

	/**
     * @param {ExtendedMessage} message
     * @param {{count: Number}} args
     */
	async exec(message, args) {
		const embed = new MessageEmbed({
			author: { name: 'Quarantine Gaming: Message Cleanup' },
			title: 'Channel Purge in Progress',
			description: `Purging ${args.count} messages as requested by ${message.author}.`,
			color: '#ffff00',
			timestamp: new Date(),
		});
		const reply = await message.reply(embed);

		let retries = 3;
		let deleted_messages_count = 0;
		const deleted_messages = new Array();
		/** @type {TextChannel} */
		const channel = message.channel;

		do {
			/** @type {ExtendedMessage[]} */
			const messages_to_delete = new Array();
			const authors_id = new Array();
			await channel.messages.fetch().then(async messages => {
				for (const this_message of messages.array()) {
					if (this_message.id == message.id || this_message.id == reply.id) continue;
					if (this_message.deletable) {
						messages_to_delete.push(this_message);
						authors_id[this_message.id] = [this_message.author ? this_message.author : 'Unavailable'];
					}
					if (messages_to_delete.length >= args.count) break;
				}
			});
			let msg_to_del = messages_to_delete;
			await channel.bulkDelete(msg_to_del, true).then(messages => {
				for (const this_message of messages.array()) {
					deleted_messages_count++;
					if (deleted_messages[authors_id[this_message.id]]) {
						deleted_messages[authors_id[this_message.id]] += 1;
					}
					else {
						deleted_messages[authors_id[this_message.id]] = 1;
					}
					messages_to_delete.splice(messages_to_delete.indexOf(this_message), 1);
				}
			});
			msg_to_del = messages_to_delete;
			for (const this_message of msg_to_del) {
				await this_message.delete().then(the_message => {
					deleted_messages_count++;
					if (deleted_messages[authors_id[the_message.id]]) {
						deleted_messages[authors_id[the_message.id]] += 1;
					}
					else {
						deleted_messages[authors_id[the_message.id]] = 1;
					}
					messages_to_delete.splice(messages_to_delete.indexOf(this_message), 1);
				});
				await sleep(3000);
			}
			retries--;
		} while (retries > 0 && deleted_messages_count != args.count);
		const elapsedTime = (Date.now() - reply.createdTimestamp) / 1000;

		embed.setTitle('Channel Purge Complete');
		embed.setDescription(`A total of ${deleted_messages_count} messages were removed.`);
		embed.addField('Affected Authors', Object.entries(deleted_messages).map(entry => `${entry[0]}: ${entry[1]}`));
		embed.setFooter(`This process took ${elapsedTime.toFixed(2)} seconds to finish.`);

		return reply.edit(embed).then(this_message => {
			this_message.delete({ timeout: 30000 }).catch(e => void e);
			message.delete({ timeout: 30000 }).catch(e => void e);
		});
	}
};