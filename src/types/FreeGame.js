module.exports = class FreeGame {
	/** @param {{title: String, url: String, author: String, description: String, validity: Number, score: Number, flair: String, permalink: String, id?: String}} data */
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
};