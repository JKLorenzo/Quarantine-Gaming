interface ErrorTicket {
  name: string;
  location: string;
  error: Error;
}

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
