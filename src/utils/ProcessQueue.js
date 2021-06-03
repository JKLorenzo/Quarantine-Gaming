// Function sleep(timeout = 0) {
// 	return new Promise(resolve => setTimeout(resolve, timeout));
// }

import { sleep } from './Base.js';

export default class ProcessQueue {
  /**
   * Creates a process queuer.
   * @param {number} timeout Timeout between function execution in ms.
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
    this.array = [];
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
        const this_promise = await Promise.race([data.function()]);
        data.promise.resolve(this_promise);
      } catch (error) {
        data.promise.reject(error);
      }
      this.currentID++;
      if (this.timeout > 0) await sleep(this.timeout);
    }
    this.running = false;
  }
}
