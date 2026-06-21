import { getCatalog } from '$lib/server/catalog.js';
import { buildHome } from '$lib/server/home.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	const { channels, meta } = await getCatalog();
	const home = buildHome(channels, meta);
	return { home };
};
