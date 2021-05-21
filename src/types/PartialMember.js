/** A Member Object represented on the database. */
export default class PartialMember {
	/**
     * Initializes this member.
     * @param {{id: String, name: String, tagname: String, inviter?: String, moderator?: String}} data
     */
	constructor(data = {}) {
		/**
		 * @readonly
		 * @type {String}
		 */
		this.id = data.id;
		/**
		 * @readonly
		 * @type {String}
		 */
		this.name = data.name;
		/**
		 * @readonly
		 * @type {String}
		 */
		this.tagname = data.tagname;
		/**
		 * @readonly
		 * @type {String}
		 */
		this.inviter = data.inviter;
		/**
		 * @readonly
		 * @type {String}
		 */
		this.moderator = data.moderator;
	}
}