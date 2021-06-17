import { ErrorTicket } from '../structures/Interfaces.js';

export default class ErrorTicketManager {
  location: string;

  constructor(location: string) {
    this.location = location;
  }

  create(method: string, error: Error, base?: string): ErrorTicket {
    return {
      name: base ? `${base} -> ${method}` : method,
      location: this.location,
      error: error,
    };
  }
}
