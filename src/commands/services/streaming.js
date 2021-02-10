const Discord = require('discord.js');
const Commando = require('discord.js-commando');
const constants = require('../../modules/constants.js');
/** @type {import('../../modules/app.js')} */
let app;
/** @type {import('../../modules/role_manager.js')} */
let role_manager;
/** @type {import('../../modules/message_manager.js')} */
let message_manager;
/** @type {import('../../modules/speech.js')} */
let speech;

module.exports = class StreamingCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'streaming',
			group: 'services',
			memberName: 'streaming',
			description: 'Notify all members joining your voice channel that you are currently streaming. This will be turned off automatically once you\'re offline or disconnected from a voice channel.',
			throttling: {
				usages: 1,
				duration: 60,
			},
		});
	}

	/** @param {Commando.CommandoMessage} message */
	async run(message) {
		// Link
		app = this.client.modules.app;
		role_manager = this.client.modules.role_manager;
		message_manager = this.client.modules.message_manager;
		speech = this.client.modules.speech;

		message.delete({ timeout: 10000 }).catch(e => void e);
		const member = app.member(message.author);
		const streaming_role = app.role(constants.roles.streaming);
		if (!member.roles.cache.has(streaming_role)) {
			message.reply('Got it! Your streaming status will be removed once you\'re disconnected to a voice channel or when you go offline.').then(this_message => {
				this_message.delete({ timeout: 10000 }).catch(e => void e);
			}).catch(e => void e);

			// Add streaming role
			await role_manager.add(member, streaming_role);

			const voice_channel = member.voice.channel;
			if (voice_channel) {
				// Notify voice channel members through DM
				const embed = new Discord.MessageEmbed();
				embed.setAuthor('Quarantine Gaming: Information');
				embed.setTitle(`${member.displayName} is currently Streaming`);
				embed.setDescription('Please observe proper behavior on your current voice channel.');
				embed.setImage('https://pa1.narvii.com/6771/d33918fa87ad0d84b7dc854dcbf6a8545c73f94d_hq.gif');
				embed.setColor('#5dff00');
				for (const the_member of voice_channel.members.array()) {
					if (member.id != the_member.id) {
						await message_manager.sendToUser(the_member, embed);
					}
				}

				// Notify voice channel members through TTS
				await speech.say('Be notified: A member in this voice channel is currently streaming.', voice_channel);
			}
		}
	}
};