const Discord = require('discord.js');
const { Command } = require('discord.js-commando');
const constants = require('../../modules/constants.js');
/** @type {import('../../modules/app.js')} */
let app;
/** @type {import('../../modules/message_manager.js')} */
let message_manager;

function guidelines() {
	const embed = new Discord.MessageEmbed();
	embed.setAuthor('Discord', 'http://orig08.deviantart.net/5d90/f/2016/099/d/a/discord_token_icon_light_by_flexo013-d9y9q3w.png');
	embed.setTitle('**Discord Community Guidelines**');
	embed.setURL('https://discord.com/guidelines');
	const description = new Array();
	description.push('Our community guidelines are meant to explain what is and isn’t allowed on Discord, and ensure that everyone has a good experience. If you come across a message that appears to break these rules, please report it to us. We may take a number of steps, including issuing a warning, removing the content, or removing the accounts and/or servers responsible.');
	description.push(' ');
	description.push('**Here are some rules for interacting with others:**');
	description.push(' ');
	description.push('1. Do not organize, participate in, or encourage harassment of others.');
	description.push(' ');
	description.push('2. Do not organize, promote, or coordinate servers around hate speech.');
	description.push(' ');
	description.push('3. Do not make threats of violence or threaten to harm others.');
	description.push(' ');
	description.push('4. Do not evade user blocks or server bans.');
	description.push(' ');
	description.push('5. Do not send others viruses or malware.');
	description.push(' ');
	description.push(' ');
	description.push('**Here are some rules for content on Discord:**');
	description.push(' ');
	description.push('6. You must apply the NSFW label to channels if there is adult content in that channel.');
	description.push(' ');
	description.push('7. You may not sexualize minors in any way.');
	description.push(' ');
	description.push('8. You may not share sexually explicit content of other people without their consent.');
	description.push(' ');
	description.push('9. You may not share content that glorifies or promotes suicide or self-harm.');
	description.push(' ');
	description.push('10. You may not share images of sadistic gore or animal cruelty.');
	description.push(' ');
	description.push('11. You may not use Discord for the organization, promotion, or support of violent extremism.');
	description.push(' ');
	description.push('12. You may not operate a server that sells or facilitates the sales of prohibited or potentially dangerous goods.');
	description.push(' ');
	description.push('13. You may not promote, distribute, or provide access to content involving the hacking, cracking, or distribution of pirated software or stolen accounts.');
	description.push(' ');
	description.push('14. In general, you should not promote, encourage or engage in any illegal behavior.');
	embed.setDescription(description.join('\n'));
	embed.setFooter('Last Updated: May 19th, 2020.');
	embed.setColor('#6464ff');
	return embed;
}

const modeSelector = {
	/** @type {String} */
	mode: '',
};

module.exports = class Message extends Command {
	constructor(client) {
		super(client, {
			name: 'message',
			group: 'management',
			memberName: 'message',
			description: '[Mod] Send a message to a channel, update a message on a channel, or send a DM to a member as Quarantine Gaming.',
			args: [
				{
					key: 'mode',
					prompt: 'Send, Update or DM?',
					type: 'string',
					oneOf: ['send', 'update', 'dm'],
					validate: mode => {
						if (mode == 'send' || mode == 'update' || mode == 'dm') {
							modeSelector.mode = mode;
							return true;
						}
						return false;
					},
				},
				{
					key: 'argument',
					prompt: '**Arguments:**\n' +
                        'On Send: `<Channel ID> [Message]`\n' +
                        'On Update: `<Channel ID> [Message ID] {Message}`\n' +
                        'On DM: `<User ID> [Message]`',
					type: 'string',
					validate: async argument => {
						// Link
						app = this.client.modules.app;

						const commands = String(argument).split(' ');
						if (commands.length < 2 || !modeSelector.mode) return false;
						switch (modeSelector.mode) {
						case 'send':
							if (app.channel(commands[0]) && commands.slice(1).length > 0) {return true;}
							return false;
						case 'update':
							if (app.message(commands[0], commands[1]) && commands.slice(2).length > 0) {return true;}
							return false;
						case 'dm':
							if (app.member(commands[0]) && commands.slice(1).length > 0) {return true;}
							return false;
						}
					},
				},
			],
		});
	}

	/**
     * @param {Discord.Message} message
     * @param {{mode: 'send' | 'update' | 'dm', argument: String}}
     */
	async run(message, { mode, argument }) {
		// Link
		app = this.client.modules.app;
		message_manager = this.client.modules.message_manager;

		// Check user permissions
		if (!app.hasRole(message.author, [constants.roles.staff, constants.roles.moderator])) {
			return message.reply('You don\'t have permissions to use this command.');
		}

		const commands = String(argument).split(' ');
		/** @type {Discord.TextChannel} */
		let SendChannel;
		/** @type {Discord.Message} */
		let MessageReference;
		/** @type {Discord.Message} */
		let UpdateMessage;
		/** @type {String} */
		let SendContent;
		/** @type {String} */
		let UpdateContent;
		switch (mode.toLowerCase()) {
		case 'send':
			SendChannel = app.channel(commands[0]);
			SendContent = commands.slice(1).join(' ');
			if (SendContent == 'guidelines') {MessageReference = await message_manager.sendToChannel(SendChannel, guidelines());}
			else {MessageReference = await message_manager.sendToChannel(SendChannel, SendContent);}
			break;
		case 'update':
			UpdateMessage = app.message(commands[0], commands[1]);
			UpdateContent = commands.slice(2).join(' ');
			if (UpdateMessage) {
				MessageReference = await UpdateMessage.edit(UpdateContent);
			}
			break;
		case 'dm':
			MessageReference = await message_manager.sendToUser(commands[0], commands.slice(1).join(' '));
			break;
		}
		return message.reply(`Done! Reference ID: \`${MessageReference.id}\``);
	}
};