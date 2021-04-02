module.exports = class FreeGame {
	/** @param {{title: String, url: String, author: String, permalink: String, id?: String}} data */
	constructor(data) {
		this.title = data.title;
		this.url = data.url;
		this.author = data.author;
		this.permalink = data.permalink;
		this.id = data.id;
	}
};