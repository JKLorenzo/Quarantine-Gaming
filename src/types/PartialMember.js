/**
 * @typedef {Object} PartialMemberData
 * @property {String} id
 * @property {String} name
 * @property {String} tagname
 * @property {String} [inviter]
 * @property {String} [moderator]
 */

/** A Member Object represented on the database. */
export default class PartialMember {
  /**
   * @param {PartialMemberData} data The partial member data
   */
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.tagname = data.tagname;
    this.inviter = data.inviter;
    this.moderator = data.moderator;
  }
}
