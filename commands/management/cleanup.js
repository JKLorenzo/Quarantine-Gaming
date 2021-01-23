const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');
const constants = require('../../modules/constants.js');
const functions = require('../../modules/functions.js');
/** @type {import('../../modules/app.js')} */
let app;

module.exports = class CleanUp extends Command {
	constructor(client) {
		super(client, {
			name: 'cleanup',
			group: 'management',
			memberName: 'clean',
			description: '[Mod] Removes a number of messages on the current channel.',
			userPermissions: [constants.permissions.general.MANAGE_CHANNELS],
			guildOnly: true,
			args: [
				{
					key: 'count',
					prompt: 'Enter the number of messages to delete.',
					type: 'integer',
					validate: arg => arg > 0
				},
			]
		});
	}

	async run(message, { count }) {
		// Link
		const Modules = functions.parseModules(GlobalModules);
		app = Modules.app;

		await functions.sleep(1000);
		await message.delete().catch(() => { });
		await functions.sleep(1000);
		let deleted_messages_count = 0;
		const deleted_messages = new Array();
		async function removeMessages(number_of_messages) {
			if (number_of_messages > 0) {
				await message.channel.bulkDelete(number_of_messages).then(messages => messages.array()).then(messages => {
					number_of_messages -= messages.length;
					count -= messages.length;
					deleted_messages_count += messages.length;
					for (const this_message of messages) {
						if (deleted_messages[`${this_message.author.id}`]) {
							deleted_messages[`${this_message.author.id}`] += 1;
						} else {
							deleted_messages[`${this_message.author.id}`] = 1;
						}
					}
				}).catch(() => { });
			}
			while (count > 0 && number_of_messages > 0) {
				await message.channel.messages.fetch({ limit: number_of_messages }).then(messages => messages.array()).then(async messages => {
					if (messages.length > 0) {
						for (const this_message of messages) {
							await this_message.delete().then(async () => {
								count--;
								deleted_messages_count++;
								if (deleted_messages[`${this_message.author.id}`]) {
									deleted_messages[`${this_message.author.id}`] += 1;
								} else {
									deleted_messages[`${this_message.author.id}`] = 1;
								}
								await functions.sleep(2000); // Rate Limit
							}).catch(() => { });
						}
					} else {
						count = 0;
					}
				}).catch(() => {
					count = 0;
				});
			}
		}

		while (count > 100) {
			await removeMessages(100);
			await functions.sleep(5000); // Rate Limit
		}
		await removeMessages(count);

		const embed = new MessageEmbed();
		embed.setAuthor('Quarantine Gaming: Cleanup Manager');
		embed.setTitle('Cleanup Process Complete');
		embed.setDescription('The total number of messages that were removed from affected authors:\n' + Object.entries(deleted_messages).map(entry => {
			return `${app.member(entry[0])}: ${entry[1]}`;
		}).join('\n'));
		embed.setFooter(`A total of ${deleted_messages_count} messages were removed.`);
		embed.setColor('#ffff00');

		message.say(embed).then(this_message => {
			this_message.delete({ timeout: 60000 }).catch(() => { });
		});
	}
};