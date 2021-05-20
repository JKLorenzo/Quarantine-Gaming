const DatabaseManager = require('./DatabaseManager.js');
const ChannelManager = require('./ChannelManager.js');
const ErrorManager = require('./ErrorManager.js');
const InteractionManager = require('./InteractionManager.js');
const GatewayManager = require('./GatewayManager');
const MessageManager = require('./MessageManager.js');
const ReactionManager = require('./ReactionManager.js');
const RoleManager = require('./RoleManager.js');
const SpeechManager = require('./SpeechManager.js');
const FreeGameManager = require('./FreeGameManager.js');
const GameManager = require('./GameManager.js');
const DedicatedChannelManager = require('./DedicatedChannelManager.js');

module.exports = {
	ChannelManager,
	DatabaseManager,
	ErrorManager,
	InteractionManager,
	GatewayManager,
	MessageManager,
	ReactionManager,
	RoleManager,
	SpeechManager,
	FreeGameManager,
	GameManager,
	DedicatedChannelManager,
};