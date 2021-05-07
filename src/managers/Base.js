const DatabaseManager = require('./DatabaseManager.js');
const ChannelManager = require('./ChannelManager.js');
const ErrorManager = require('./ErrorManager.js');
const InviteManager = require('./InviteManager');
const MessageManager = require('./MessageManager.js');
const ReactionManager = require('./ReactionManager.js');
const RoleManager = require('./RoleManager.js');
const SpeechManager = require('./SpeechManager.js');
const FreeGameManager = require('./FreeGameManager.js');
const DedicatedChannelManager = require('./DedicatedChannelManager.js');

module.exports = {
	ChannelManager,
	DatabaseManager,
	ErrorManager,
	InviteManager,
	MessageManager,
	ReactionManager,
	RoleManager,
	SpeechManager,
	FreeGameManager,
	DedicatedChannelManager,
};