const { Command } = require('discord.js-commando');

module.exports = class CleanUp extends Command {
	constructor(client) {
		super(client, {
			name: 'cleanup',
			group: 'management',
			memberName: 'clean',
			description: '[Admin Only] Removes a number of messages on the current channel.',
			userPermissions: ["ADMINISTRATOR"],
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
		message.delete();
		let remaining = count;
		let deleted = 0;
		async function removeMessages(number_of_messages) {
			if (number_of_messages > 0) {
				await message.channel.bulkDelete(number_of_messages).then(messages => {
					deleted += messages.size
					remaining -= deleted;
					number_of_messages -= deleted;
				}).catch(() => { });
			}
			if (number_of_messages > 0) {
				await message.channel.messages.fetch({ limit: 1 }).then(async messages => {
					if (messages.size > 0) {
						for (let this_message of messages) {
							await this_message[1].delete().then(() => {
								remaining--;
								deleted++;
							}).catch(() => { });
						}
					} else {
						remaining = 0;
					}
				});
			}
		}
		while (remaining > 100) {
			await removeMessages(100);
		}
		await removeMessages(remaining);

		return message.channel.send(`Cleanup complete. ${deleted} messages removed.`).then(this_message => {
			this_message.delete({ timeout: 5000 }).catch(() => { });
		});
	}
};