export default class ErrorTicket {
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