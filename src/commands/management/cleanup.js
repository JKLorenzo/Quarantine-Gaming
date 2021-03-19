const Discord = require('discord.js');
const Commando = require('discord.js-commando');
const constants = require('../../modules/constants.js');
const functions = require('../../modules/functions.js');
/** @type {import('../../modules/app.js')} */
let app;

module.exports = class CleanUp extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'cleanup',
			group: 'management',
			memberName: 'clean',
			description: '[Mod] Removes a number of messages on the current channel.',
			guildOnly: true,
			args: [
				{
					key: 'count',
					prompt: 'Enter the number of messages to delete.',
					type: 'integer',
					validate: arg => arg > 0,
				},
			],
		});
	}

	/**
	 * @param {Commando.CommandoMessage} message
	 * @param {{count: Number}}
	 */
	async run(message, { count }) {
		// Link
		app = this.client.modules.app;

		// Check user permissions
		if (!app.hasRole(message.author, [constants.roles.staff, constants.roles.moderator])) {
			message.delete({ timeout: 10000 }).catch(e => void e);
			return message.reply('You don\'t have permissions to use this command.').then(this_message => {
				this_message.delete({ timeout: 10000 }).catch(e => void e);
			}).catch(e => void e);
		}

		await functions.sleep(1000);
		await message.delete().catch(e => void e);
		await functions.sleep(1000);
		let deleted_messages_count = 0;
		/** @type {Discord.TextChannel} */
		const channel = message.channel;
		const deleted_messages = new Array();

		async function removeMessages(number_of_messages) {
			if (number_of_messages > 0) {
				await channel.bulkDelete(number_of_messages).then(messages => messages.array()).then(messages => {
					number_of_messages -= messages.length;
					count -= messages.length;
					deleted_messages_count += messages.length;
					for (const this_message of messages) {
						if (deleted_messages[`${this_message.author.id}`]) {
							deleted_messages[`${this_message.author.id}`] += 1;
						}
						else {
							deleted_messages[`${this_message.author.id}`] = 1;
						}
					}
				}).catch(e => void e);
			}
			let tries = 2;
			while (count > 0 && number_of_messages > 0 && tries > 0) {
				await channel.messages.fetch({ limit: 1 }).then(messages => messages.array()).then(async messages => {
					if (messages.length > 0) {
						for (const this_message of messages) {
							await this_message.delete().then(async () => {
								count--;
								deleted_messages_count++;
								if (deleted_messages[`${this_message.author.id}`]) {
									deleted_messages[`${this_message.author.id}`] += 1;
								}
								else {
									deleted_messages[`${this_message.author.id}`] = 1;
								}
								await functions.sleep(2000);
							}).catch(e => void e);
						}
						tries = 2;
					}
					else {
						tries > 0 ? tries-- : count = 0;
					}
				}).catch(() => {
					tries > 0 ? tries-- : count = 0;
				});
				await functions.sleep(6500);
			}
		}

		while (count > 100) {
			await removeMessages(100);
			await functions.sleep(5000);
		}
		await removeMessages(count);

		const embed = new Discord.MessageEmbed();
		embed.setAuthor('Quarantine Gaming: Cleanup Manager');
		embed.setTitle('Cleanup Process Complete');
		embed.setDescription('The total number of messages that were removed from affected authors:\n' + Object.entries(deleted_messages).map(entry => {
			const author = app.member(entry[0]);
			return `${author ? author : entry[0] == null ? 'Webhooks' : entry[0]}: ${entry[1]}`;
		}).join('\n'));
		embed.setFooter(`A total of ${deleted_messages_count} messages were removed.`);
		embed.setColor('#ffff00');

		message.say(embed).then(this_message => {
			this_message.delete({ timeout: 10000 }).catch(e => void e);
		}).catch(e => void e);
	}
};