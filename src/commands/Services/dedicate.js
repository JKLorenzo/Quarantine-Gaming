const { Command } = require('discord-akairo');
const { MessageEmbed } = require('discord.js');
const { parseMention, constants } = require('../../utils/Base.js');

/**
 * @typedef {import('../../structures/Base.js').Client} Client
 * @typedef {import('../../structures/Base.js').ExtendedMessage} ExtendedMessage
 * @typedef {import('discord.js').CategoryChannel} CategoryChannel
 * @typedef {import('discord.js').TextChannel} TextChannel
 */

module.exports = class Dedicate extends Command {
	constructor() {
		super('dedicate', {
			aliases: ['dedicate'],
			category: 'Services',
			description: 'Create a dedicated channel for your current voice channel.',
			args: [
				{
					id: 'flag',
					description: 'Lock or unlock a dedicated channel.',
					match: 'option',
					flag: '--',
				},
				{
					id: 'name',
					type: (message, content) => {
						/** @type {Client} */
						const client = message.client;

						const role = client.role(content);
						if (role) return role.name;

						const member = client.member(content);
						if (member) return member.displayName;

						return content;
					},
					description: 'The name of the dedicated channel to create.',
					match: 'rest',
					default: '',
					prompt: {
						start: 'Enter a custom name for your dedicated channel.',
						retry: 'You must enter a name that is 1 to 30 characters long.',
					},
				},
			],
		});
	}

	/**
     * @param {ExtendedMessage} message
     * @param {{name?: String, flag: 'lock' | 'unlock'}} args
     */
	async exec(message, args) {
		/** @type {Client} */
		const client = message.client;

		let voice_channel = client.member(message.author).voice.channel;
		if (!voice_channel) {
			return message.reply('You must be connected to any Voice Room channels to create a dedicated channel.').then(reply => {
				message.delete({ timeout: 30000 }).catch(e => void e);
				reply.delete({ timeout: 30000 }).catch(e => void e);
			});
		}

		if ((args.name && args.name != voice_channel.name.substring(1)) || voice_channel.parentID != constants.channels.category.dedicated_voice) {
			if (!args.name) args.name = message.member.displayName;
			let reply;

			if (voice_channel.parentID != constants.channels.category.dedicated_voice) {reply = await message.reply(`Got it! Please wait while I'm preparing **${args.name}** voice and text channels.`);}
			else {reply = await message.reply(`Alright, renaming your dedicated channel to **${args.name}**.`);}

			const data = await client.dedicated_channel_manager.create(voice_channel, args.name);
			if (data.transfer_process) {
				reply.edit(`You will be transfered to ${data.voice_channel} dedicated channel momentarily.`).then(async () => {
					await data.transfer_process;
					if (reply) reply.edit(`Transfer complete! Here are your dedicated ${data.voice_channel} voice and ${data.text_channel} text channels.`);
				});
			}
			reply.delete({ timeout: 30000 }).catch(e => void e);
			voice_channel = data.voice_channel;
		}

		if (args.flag && ['lock', 'unlock'].includes(args.flag)) {
			const reply = await message.reply(`${ args.flag.charAt(0).toUpperCase() + args.flag.substring(1).toLowerCase()}ing ${voice_channel} dedicated channel.`);

			switch (args.flag) {
			case 'lock':
				await voice_channel.updateOverwrite(constants.roles.member, {
					'CONNECT': false,
				});
				break;
			case 'unlock':
				await voice_channel.updateOverwrite(constants.roles.member, {
					'CONNECT': false,
				});
				break;
			}

			/** @type {CategoryChannel} */
			const dedicated_text_channels_category = client.channel(constants.channels.category.dedicated);
			/** @type {Array<TextChannel>} */
			const dedicated_text_channels = dedicated_text_channels_category.children.array();
			const text_channel = dedicated_text_channels.find(channel => channel.topic && parseMention(channel.topic.split(' ')[0]) == voice_channel.id);
			await text_channel.send(new MessageEmbed({
				author: { name: 'Quarantine Gaming: Dedicated Channels' },
				title: voice_channel.name,
				description: `${message.author} ${args.flag}ed this channel.`,
				color: '#ffe500',
				timestamp: new Date(),
			}));

			reply.edit(`${voice_channel} dedicated channel is now ${args.flag}ed.`).then(() => {
				reply.delete({ timeout: 30000 }).catch(e => void e);
			});
		}

		return message.delete({ timeout: 30000 }).catch(e => void e);
	}
};