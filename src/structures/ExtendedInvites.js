// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');
class ExtendedInvites extends Discord.Invite {
	constructor(client, data) {
		super(client, data);
	}

	async init() {
		// asdasd
	}

	async changed() {
		return false;
	}
}

module.exports = ExtendedInvites;