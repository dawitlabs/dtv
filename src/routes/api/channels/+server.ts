import { json } from '@sveltejs/kit';
import { getCatalog } from '$lib/server/catalog.js';
import type { RequestHandler } from './$types';

const PAGE_SIZE = 200;

export const GET: RequestHandler = async ({ url }) => {
	const { channels } = await getCatalog();

	const watch = url.searchParams.get('watch');
	if (watch) {
		const channel = channels.find((c) => c.id === watch) ?? null;
		return json(
			{ channel },
			{
				headers: { 'Cache-Control': 'public, s-maxage=21600' },
			},
		);
	}

	const q = url.searchParams.get('q')?.toLowerCase() ?? null;
	const country = url.searchParams.get('country');
	const category = url.searchParams.get('category');
	const language = url.searchParams.get('language');
	const page = Math.max(0, Number(url.searchParams.get('page') ?? '0'));

	let filtered = channels;

	if (q) filtered = filtered.filter((c) => c.name.toLowerCase().includes(q));
	if (country) filtered = filtered.filter((c) => c.country === country);
	if (category)
		filtered = filtered.filter((c) => c.categories.includes(category));
	if (language)
		filtered = filtered.filter((c) => c.languages.includes(language));

	const total = filtered.length;
	const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

	return json(
		{ channels: paged, total, page },
		{
			headers: { 'Cache-Control': 'public, s-maxage=21600' },
		},
	);
};
