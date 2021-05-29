import { searchImage } from '../utils/Base.js';

/**
 * @typedef {import('../structures/Base').Client} Client
 */

/**
 * Fetches an image online or from the database when it exists.
 * @param {Client} client
 * @param {String} title
 * @returns {{small?: String, large?: String}}
 */
export default async function fetchImage(client, title) {
	const images = client.database_manager.getImage(title) ?? {};
	if (!images) {
		const result = await Promise.all([
			searchImage(`${title} game logo`, {
				ratio: 1,
				minWidth: 100,
				minHeight: 100,
			}),
			searchImage(`${title} game background`, {
				ratio: 1.7,
				minWidth: 1000,
				minHeight: 1000,
			}),
		]);
		images.small = result[0];
		images.large = result[1];
		client.database_manager.updateImage(title, images);
	} else if (!images.small) {
		images.small = await searchImage(`${title} game logo`, {
			ratio: 1,
			minWidth: 100,
			minHeight: 100,
		});
		client.database_manager.updateImage(title, { small: images.small });
	} else if (!images.large) {
		images.large = await searchImage(`${title} game background`, {
			ratio: 1.7,
			minWidth: 1000,
			minHeight: 1000,
		});
		client.database_manager.updateImage(title, { large: images.large });
	}
	return images;
}