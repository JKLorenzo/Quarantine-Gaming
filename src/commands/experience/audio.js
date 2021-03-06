const Discord = require('discord.js');
const Commando = require('discord.js-commando');
/** @type {import('../../modules/reaction_manager.js')} */
let reaction_manager;

module.exports = class Audio extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'audio',
			group: 'experience',
			memberName: 'audio',
			description: 'Summon the audio control extension for voice channels.',
			guildOnly: true,
		});
	}

	/** @param {Commando.CommandoMessage} message */
	async run(message) {
		// Link
		reaction_manager = this.client.modules.reaction_manager;

		const embed = new Discord.MessageEmbed();
		embed.setColor('#ffff00');
		embed.setAuthor('Quarantine Gaming: Experience');
		embed.setThumbnail('http://www.extensions.in.th/amitiae/2013/prefs/images/sound_icon.png');
		embed.setTitle('Audio Control Extension for Voice Channels');
		embed.setDescription('Mute or unmute all members on your current voice channel.');
		embed.addFields(
			{ name: 'Actions:', value: '🟠 - Mute', inline: true },
			{ name: '\u200b', value: '🟢 - Unmute', inline: true },
		);
		embed.setFooter('Apply selected actions by reacting below.');

		const reply = await message.reply(embed);
		const reactions = ['🟠', '🟢'];
		for (const reaction of reactions) {
			reaction_manager.addReaction(reply, reaction);
		}
		// Delete after 30 mins
		setTimeout(() => reply.delete().catch(e => void e), 1800000);
	}
};