import { ErrorTicket } from '../types/Base.js';

export default class ErrorTicketManager {
  /**
   * Constructs an object used to create error tickets.
   * @param {string} location The location of this module.
   */
  constructor(location) {
    this.location = location;
  }

  /**
   * Creates an Error Ticket for the Error Manager.
   * @param {string} method The name of the method that throwed the error.
   * @param {string | Object} error The error message or object.
   * @param {string} [base] The base method of the method that throwed the error.
   * @returns {ErrorTicket}
   */
  create(method, error, base = '') {
    return new ErrorTicket(this.location, method, error, base);
  }
}
