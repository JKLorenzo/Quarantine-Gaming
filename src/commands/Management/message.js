const { Command } = require('discord-akairo');
const { MessageEmbed } = require('discord.js');
const { parseMention, constants, contains } = require('../../utils/Base.js');

/**
 * @typedef {import('../../structures/Base.js').Client} Client
 * @typedef {import('../../structures/Base.js').ExtendedMessage} ExtendedMessage
 * @typedef {import('../../structures/Base.js').ExtendedMember} ExtendedMember
 * @typedef {import('discord.js').TextChannel} TextChannel
 * @typedef {import('discord.js').MessageAttachment} MessageAttachment
 * @typedef {import('discord.js').MessageAdditions} MessageAdditions
 * @typedef {import('discord.js').MessageOptions} MessageOptions
 * @typedef {import('discord.js').APIMessageContentResolvable} APIMessageContentResolvable
 * @typedef {{target: { type: 'channel' | 'member' | 'reply', data: TextChannel | ExtendedMember | ExtendedMessage }, content: {text: String, attachments: MessageAttachment[]}}} Args
 * @typedef {(MessageAdditions | APIMessageContentResolvable | (MessageOptions & {split?: boolean})) & { isEdit?: boolean, reactions?: String | String[]}} MessageData
 */

module.exports = class Message extends Command {
	constructor() {
		super('message', {
			aliases: ['message'],
			category: 'Management',
			description: '[Mod] Sends a message to a user, a channel, reply to a message or update an existing message.',
			channel: 'guild',
			args: [
				{
					id: 'target',
					type: (message, phrase) => {
						const reply = message.referencedMessage;
						if (reply) return { type: 'reply', data: reply };
						const channel = message.guild.channels.cache.get(phrase) || message.guild.channels.cache.get(parseMention(phrase));
						if (channel && channel.type == 'text') return { type: 'channel', data: channel };
						const member = message.guild.members.cache.get(phrase) || message.guild.members.cache.get(parseMention(phrase));
						if (member) return { type: 'member', data: member };
						return null;
					},
					prompt: {
						start: 'Mention the member or the channel, or their corresponding ID.',
						retry: 'You must enter a valid member/ID or channel/ID',
					},
				},
				{
					id: 'content',
					type: (message, content) => {
						if (message.attachments.length || content.length) {
							return {
								text: content,
								attachments: message.attachments.array(),
							};
						}
						return null;
					},
					description: 'The content of the whole message.',
					default: '',
					prompt: {
						start: 'Enter the message to be sent or attach a file to be sent.',
					},
					match: 'content',
				},
			],
		});
	}

	/** @param {ExtendedMessage} message */
	userPermissions(message) {
		/** @type {ExtendedMember} */
		const member = message.member;
		if (!member.hasRole(constants.roles.staff)) return 'Staff';
		return null;
	}

	/**
     * @param {ExtendedMessage} message
     * @param {Args} args
     */
	async exec(message, args) {
		/** @type {Client} */
		const client = message.client;
		/** @type {TextChannel} */
		const channel = args.target.data;
		/** @type {ExtendedMember} */
		const member = args.target.data;
		/** @type {ExtendedMessage} */
		const reference = message.referencedMessage;

		/** @type {ExtendedMessage} */
		let reply;
		const data = transform(client, message.content, args);

		// Send
		switch(args.target.type) {
		case 'channel':
			reply = await channel.send(data);
			break;
		case 'member':
			reply = await member.send(data);
			break;
		case 'reply':
			if (reference.author.id == this.client.user.id && data.isEdit) {
				reply = await reference.edit(data);
			}
			else {
				reply = await reference.reply(data);
			}
			break;
		}
		if (data.reactions) await client.reaction_manager.add(reply, data.reactions);
		return message.reply(`Done! Reference ID: \`${reply.id}\``);
	}
};

/**
 * @param {Client} client
 * @param {String} raw
 * @param {Args} args
 * @returns {MessageData}
 */
function transform(client, raw, args) {
	/** @type {MessageData} */
	const data = {};

	// Format
	if (raw.split(' ').join('') == '!message') {
		data.content = args.content.text;
	}
	else if (contains(raw.split(' ').join(''), '!message') && args.target.type != 'reply') {
		data.content = args.content.text.split(' ').slice(1).join(' ');
	}
	else {
		data.content = args.content.text;
	}

	// Remove --edit flag
	const phrases = data.content.split(' ');
	if (phrases[0] == '--edit') {
		data.content = phrases.slice(1).join(' ');
		data.isEdit = true;
	}

	// Reaction Roles
	switch(data.content) {
	case '--nsfw':
		data.content = '';
		data.embed = new MessageEmbed({
			author: { name: 'Quarantine Gaming: NSFW' },
			title: 'Unlock NSFW Bots and Channel',
			description: [
				`${client.role(constants.roles.nsfw_bot)} and ${client.channel(constants.channels.text.explicit)} channel will be unlocked after getting the role.`,
				' ',
				`🔴 - ${client.role(constants.roles.nsfw)} (Not Safe For Work)`,
				'The marked content may contain nudity, intense sexuality, profanity, violence or other potentially disturbing subject matter.',
			].join('\n'),
			image: { url: constants.images.nsfw_banner },
			color: '#ffff00',
			footer: { text: 'Update your role by reacting below.' },
		});
		data.reactions = ['🔴'];
		break;
	case '--fgu':
		data.content = '';
		data.embed = new MessageEmbed({
			author: { name: 'Quarantine Gaming: Free Game Updates' },
			title: 'Subscribe to get updated',
			description: [
				`All notifications will be made available on our ${client.channel(constants.channels.integrations.free_games)} channel.`,
				' ',
				`1️⃣ - ${client.role(constants.roles.steam)}`,
				'Notifies you with Steam games and DLCs that are currently free.',
				' ',
				`2️⃣ - ${client.role(constants.roles.epic)}`,
				'Notifies you with Epic games and DLCs that are currently free.',
				' ',
				`3️⃣ - ${client.role(constants.roles.gog)}`,
				'Notifies you with GOG games and DLCs that are currently free.',
				' ',
				`4️⃣ - ${client.role(constants.roles.console)}`,
				'Notifies you with games and DLCs that are currently free for Xbox(One/360), PlayStation(3/4/Vita), and Wii(U/3DS/Switch).',
				' ',
				`5️⃣ - ${client.role(constants.roles.ubisoft)}`,
				'Notifies you with Ubisoft games and DLCs that are currently free.',
			].join('\n'),
			image: { url: constants.images.free_games_banner },
			color: '#ffff00',
			footer: { text: 'Update your role by reacting below.' },
		});
		data.reactions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
		break;
	default:
		data.attachments = args.content.attachments;
		break;
	}

	return data;
}