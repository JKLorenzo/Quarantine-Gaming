const util = require('util');
const discord = require('discord.js');
const { Command } = require('discord-akairo');
const tags = require('common-tags');

/**
 * @typedef {import('../../structures/Base.js').ExtendedMessage} ExtendedMessage
 */

const nl = '!!NL!!';
const nlPattern = new RegExp(nl, 'g');

function escapeRegex(str) {
	return str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
}

module.exports = class Eval extends Command {
	constructor() {
		super('eval', {
			aliases: ['eval'],
			category: 'Utility',
			description: 'Executes JavaScript code.',
			ownerOnly: true,
			args: [
				{
					id: 'script',
					type: 'string',
					prompt: {
						start: 'What code would you like to evaluate?',
						retry: 'You must enter a code that you want to evaulate.',
					},
				},
			],
		});

		this.lastResult = null;
		Object.defineProperty(this, '_sensitivePattern', { value: null, configurable: true });
	}

	/**
	 * @param {ExtendedMessage} msg
	 * @param {{script: String}} args
	 */
	exec(msg, args) {
		// Make a bunch of helpers
		/* eslint-disable no-unused-vars */
		const message = msg;
		const client = msg.client;
		const lastResult = this.lastResult;
		const doReply = val => {
			if(val instanceof Error) {
				msg.reply(`Callback error: \`${val}\``);
			}
			else {
				const result = this.makeResultMessages(val, process.hrtime(this.hrStart));
				if(Array.isArray(result)) {
					for(const item of result) msg.reply(item);
				}
				else {
					msg.reply(result);
				}
			}
		};
		/* eslint-enable no-unused-vars */

		// Remove any surrounding code blocks before evaluation
		if(args.script.startsWith('```') && args.script.endsWith('```')) {
			args.script = args.script.replace(/(^.*?\s)|(\n.*$)/g, '');
		}

		// Run the code and measure its execution time
		let hrDiff;
		try {
			const hrStart = process.hrtime();
			this.lastResult = eval(args.script);
			hrDiff = process.hrtime(hrStart);
		}
		catch(err) {
			return msg.reply(`Error while evaluating: \`${err}\``);
		}

		// Prepare for callback time and respond
		this.hrStart = process.hrtime();
		const result = this.makeResultMessages(this.lastResult, hrDiff, args.script);
		if(Array.isArray(result)) {
			return result.map(item => msg.reply(item));
		}
		else {
			return msg.reply(result);
		}
	}

	makeResultMessages(result, hrDiff, input = null) {
		const inspected = util.inspect(result, { depth: 0 })
			.replace(nlPattern, '\n')
			.replace(this.sensitivePattern, '--snip--');
		const split = inspected.split('\n');
		const last = inspected.length - 1;
		const prependPart = inspected[0] !== '{' && inspected[0] !== '[' && inspected[0] !== '\'' ? split[0] : inspected[0];
		const appendPart = inspected[last] !== '}' && inspected[last] !== ']' && inspected[last] !== '\'' ?
			split[split.length - 1] :
			inspected[last];
		const prepend = `\`\`\`javascript\n${prependPart}\n`;
		const append = `\n${appendPart}\n\`\`\``;
		if(input) {
			return discord.splitMessage(tags.stripIndents`
				*Executed in ${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}ms.*
				\`\`\`javascript
				${inspected}
				\`\`\`
			`, { maxLength: 1900, prepend, append });
		}
		else {
			return discord.splitMessage(tags.stripIndents`
				*Callback executed after ${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}ms.*
				\`\`\`javascript
				${inspected}
				\`\`\`
			`, { maxLength: 1900, prepend, append });
		}
	}

	get sensitivePattern() {
		if(!this._sensitivePattern) {
			const client = this.client;
			let pattern = '';
			if(client.token) pattern += escapeRegex(client.token);
			Object.defineProperty(this, '_sensitivePattern', { value: new RegExp(pattern, 'gi'), configurable: false });
		}
		return this._sensitivePattern;
	}
};