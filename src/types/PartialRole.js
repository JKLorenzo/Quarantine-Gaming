/**
 * @typedef {Object} PartialRoleData
 * @property {String} id
 * @property {String} name
 * @property {String} lastUpdated
 */

/** A Role Object represented on the database. */
export default class ParitalRole {
  /**
   * @param {PartialRoleData} data The partial role data
   */
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.lastUpdated = data.lastUpdated;
  }
}
