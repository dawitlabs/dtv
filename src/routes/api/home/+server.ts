import { json } from '@sveltejs/kit';
import { getCatalog } from '$lib/server/catalog.js';
import { buildHome } from '$lib/server/home.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async () => {
	const { channels, meta } = await getCatalog();
	const home = buildHome(channels, meta);

	return json(home, {
		headers: { 'Cache-Control': 'public, s-maxage=21600' },
	});
};
