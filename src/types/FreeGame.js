/**
 * @typedef {Object} FreeGameData
 * @property {string} title
 * @property {string} url
 * @property {string} author
 * @property {string} description
 * @property {number} validity
 * @property {string} score
 * @property {string} flair
 * @property {string} permalink
 * @property {string} [id]
 */

export default class FreeGame {
  /**
   * @param {FreeGameData} data The free game data
   */
  constructor(data) {
    this.title = data.title;
    this.url = data.url;
    this.author = data.author;
    this.description = data.description;
    this.validity = data.validity;
    this.score = data.score;
    this.flair = data.flair;
    this.permalink = data.permalink;
    this.id = data.id;
  }
}
