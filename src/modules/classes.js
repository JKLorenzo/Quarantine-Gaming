const functions = require('./functions.js');

/**
 * A notification object used by the database.
 */
module.exports.Notification = class {
    /**
     * Constructs a notification object.
     * @param {String | null} id The message ID of this notification.
     * @param {String} title The title of this notification.
     * @param {String} url The giveaway URL of this notification.
     * @param {String} author The author of this notification.
     * @param {String} permalink The permalink for the giveaway.
     * @param {{description?: String, validity?: Number, score?: Number, flair?: String, createdAt?: Date}} partials The partials of this notification.
     */
    constructor(id = null, title, url, author, permalink, partials = {}) {
        this.id = id;
        this.title = title;
        this.url = url;
        this.author = author;
        this.permalink = permalink;
        this.description = partials.description;
        this.validity = partials.validity;
        this.score = partials.score;
        this.flair = partials.flair;
        this.createdAt = partials.createdAt;
    }
}

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
}

/**
 * Creates a Process Queue.
 * @param {number} timeout Time in miliseconds.
 *  @returns Process Queue
 */
module.exports.ProcessQueue = class {
    constructor(timeout = 0) {
        this.timeout = timeout;
        this.processID = 0;
        this.currentID = 0;
    }

    /**
     * Start queueing.
     * @returns {Promise<null>}
     */
    queue() {
        const ID = this.processID++;
        return new Promise(async resolve => {
            while (ID != this.currentID) await functions.sleep(2500);
            resolve();
        });
    }

    /**
     * Finish queue turn.
     */
    finish() {
        setTimeout(() => {
            this.currentID++;;
        }, this.timeout);
    }
}