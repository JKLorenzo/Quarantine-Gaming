/* eslint-disable @typescript-eslint/ban-types */
import { sleep } from './Functions.js';

interface FunctionQueue {
  function: Function;
  promise: {
    resolve: Function;
    reject: Function;
  };
}

export default class ProcessQueue {
  public timeout: number;
  public totalID: number;
  public currentID: number;
  public running: boolean;
  public array: FunctionQueue[];

  constructor(timeout = 0) {
    this.timeout = timeout;
    this.totalID = 0;
    this.currentID = 0;
    this.running = false;
    this.array = [];
  }

  queue(this_function: Function): Promise<unknown> {
    this.totalID++;
    const promise = new Promise((res, rej) => {
      this.array.push({
        function: this_function,
        promise: {
          resolve: res,
          reject: rej,
        },
      });
    });

    if (!this.running) this.run();
    return promise;
  }

  private async run() {
    this.running = true;
    while (this.array.length > 0) {
      const data = this.array.shift();
      try {
        const this_promise = await Promise.race([data?.function()]);
        data?.promise.resolve(this_promise);
      } catch (error) {
        data?.promise.reject(error);
      }
      this.currentID++;
      if (this.timeout > 0) await sleep(this.timeout);
    }
    this.running = false;
  }
}
