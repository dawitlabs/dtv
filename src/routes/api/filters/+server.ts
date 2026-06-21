import { json } from '@sveltejs/kit';
import { getCatalog } from '$lib/server/catalog.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const { channels, meta } = await getCatalog();

	const categoryCounts = new Map<string, number>();
	const countryCounts = new Map<string, number>();
	const languageCounts = new Map<string, number>();

	for (const ch of channels) {
		for (const cat of ch.categories) {
			categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
		}
		countryCounts.set(ch.country, (countryCounts.get(ch.country) ?? 0) + 1);
		for (const lang of ch.languages) {
			languageCounts.set(lang, (languageCounts.get(lang) ?? 0) + 1);
		}
	}

	const categories = meta.categories
		.filter((c) => categoryCounts.has(c.id))
		.map((c) => ({ id: c.id, name: c.name, count: categoryCounts.get(c.id)! }))
		.sort((a, b) => a.name.localeCompare(b.name));

	const countries = meta.countries
		.filter((c) => countryCounts.has(c.code))
		.map((c) => ({
			code: c.code,
			name: c.name,
			flag: c.flag,
			count: countryCounts.get(c.code)!,
		}))
		.sort((a, b) => a.name.localeCompare(b.name));

	const languages = meta.languages
		.filter((l) => languageCounts.has(l.code))
		.map((l) => ({
			code: l.code,
			name: l.name,
			count: languageCounts.get(l.code)!,
		}))
		.sort((a, b) => a.name.localeCompare(b.name));

	return json(
		{ categories, countries, languages },
		{
			headers: { 'Cache-Control': 'public, s-maxage=21600' },
		},
	);
};
