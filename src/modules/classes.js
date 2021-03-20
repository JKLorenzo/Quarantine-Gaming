const functions = require('./functions.js');

/**
 * A notification object used by the database.
 */
module.exports.Notification = class {
	/**
     * Constructs a notification object.
     * @param {String} title The title of this notification.
     * @param {String} url The giveaway URL of this notification.
     * @param {String} author The author of this notification.
     * @param {String} permalink The permalink for the giveaway.
     * @param {{id?: String, description?: String, validity?: Number, score?: Number, flair?: String, createdAt?: Date}} partials The partials of this notification.
     */
	constructor(title, url, author, permalink, partials = {}) {
		this.title = title;
		this.url = url;
		this.author = author;
		this.permalink = permalink;
		this.id = partials.id;
		this.description = partials.description;
		this.validity = partials.validity;
		this.score = partials.score;
		this.flair = partials.flair;
		this.createdAt = partials.createdAt;
	}
};

/**
 * An error ticket object used by the Error Manager.
 */
class ErrorTicket {
	/**
     * Creates an Error Ticket for the Error Manager.
     * @param {String} location The location of this module.
     * @param {String} method The name of the method that throwed the error.
     * @param {String | Object} error The error message or object.
     * @param {String} base The base method of the method that throwed the error.
     * @returns Error Ticket
     */
	constructor(location, method, error, base) {
		this.location = location;
		this.name = base ? base + ' -> ' + method : method;
		this.error = error;
	}
}
module.exports.ErrorTicket = ErrorTicket;

/**
 * An error ticket manager used by the modules to create an Error Ticket.
 */
module.exports.ErrorTicketManager = class {
	/**
     * Constructs an object used to create error tickets.
     * @param {String} location The location of this module.
     */
	constructor(location) {
		this.location = location;
	}

	/**
     * Creates an Error Ticket for the Error Manager.
     * @param {String} method The name of the method that throwed the error.
     * @param {String | Object} error The error message or object.
     * @param {String} base The base method of the method that throwed the error.
     * @returns {ErrorTicket} Error Ticket
     */
	create(method, error, base = '') {
		return new ErrorTicket(this.location, method, error, base);
	}
};

module.exports.Manager = class {
	/**
	 * Creates a Manager class.
	 * @param {Number} timeout Timeout between function execution in ms.
	 */
	constructor(timeout = 0) {
		/**
		 * @readonly
		 * The timeout between function execution in ms.
		 */
		this.timeout = timeout;
		/**
		 * @readonly
		 * The total number of IDs this manager used.
		 */
		this.totalID = 0;
		/**
		 * @readonly
		 * The ID that is currently being executed.
		 */
		this.currentID = 0;
		/**
		 * @readonly
		 * The state of this manager.
		 */
		this.running = false;
		/**
		 * @private
		 * The array containing the functions to be executed by this manager.
		 * @type {Array<{function: Function, promise: {resolve: Function, reject: Function}}>}
		 */
		this.array = new Array();
	}

	/**
	 * @public
	 * Adds the function to the queue.
	 * @param {Function} the_function The function to be queued.
	 * @returns {Promise} The return object of the queued function.
	 */
	queue(the_function) {
		this.totalID++;
		let res, rej;
		const promise = new Promise((resolve, reject) => {
			res = resolve;
			rej = reject;
		});
		this.array.push({
			function: the_function,
			promise: {
				resolve: res,
				reject: rej,
			},
		});
		if (!this.running) this.run();
		return promise;
	}

	/**
	 * @private
	 * Executes all the items in the array.
	 */
	async run() {
		this.running = true;
		while (this.array.length > 0) {
			const data = this.array.shift();
			try {
				data.promise.resolve(await data.function());
			}
			catch(error) {
				data.promise.reject(error);
			}
			this.currentID++;
			if (this.timeout > 0) await functions.sleep(this.timeout);
		}
		this.running = false;
	}
};

/**
 * A Color Object.
 */
module.exports.Color = class {
	/**
     * Creates a Color Object.
     * @param {Number} Red From 0 to 255.
     * @param {Number} Green From 0 to 255.
     * @param {Number} Blue From 0 to 255.
     */
	constructor(Red = 0, Green = 0, Blue = 0) {
		this.Red = Red;
		this.Green = Green;
		this.Blue = Blue;
	}

	/**
     * Adds the values to this color then scales it accordingly.
     * @param {Number} R From 0 to 255.
     * @param {Number} G From 0 to 255.
     * @param {Number} B From 0 to 255.
     */
	add(R, G, B) {
		this.Red += R;
		this.Green += G;
		this.Blue += B;

		// Scale the colors until its acceptable
		while (this.R > 255 || this.G > 255 || this.B > 255) {
			if (this.Red > 0) this.Red--;
			if (this.Green > 0) this.Green--;
			if (this.Blue > 0) this.Blue--;
		}
	}

	/**
     * Converts this color to its Hex value.
     * @returns {String} Hex Value
     */
	toHex() {
		let red = this.Red.toString(16);
		let green = this.Green.toString(16);
		let blue = this.Blue.toString(16);
		if (red.length == 1) red = `0${red}`;
		if (green.length == 1) green = `0${green}`;
		if (blue.length == 1) blue = `0${blue}`;
		return `#${red}${green}${blue}`;
	}
};