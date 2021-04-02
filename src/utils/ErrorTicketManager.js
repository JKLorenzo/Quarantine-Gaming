const { ErrorTicket } = require('../types/Base.js');
module.exports = class ErrorTicketManager {
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