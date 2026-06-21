import type { CatalogMeta } from '$lib/server/catalog.js';
import type { Channel, HomeResponse, HomeRow } from '$lib/types.js';

const CATEGORY_ORDER = [
	'sports',
	'news',
	'movies',
	'entertainment',
	'music',
	'documentary',
	'kids',
	'general',
	'lifestyle',
	'science',
];

const HERO_POOL = [
	'bloomberg-television.us',
	'cnn.us',
	'bbc-news.gb',
	'euronews.fr',
	'nasa-tv.us',
	'dw-tv.de',
	'al-jazeera-english.qa',
	'espn.us',
	'skynews.gb',
	'france-24.fr',
	'arte.fr',
	'nhk-world-tv.jp',
];

function rankChannels(channels: Channel[]): Channel[] {
	return channels.slice().sort((a, b) => {
		const logoA = a.logo !== null ? 1 : 0;
		const logoB = b.logo !== null ? 1 : 0;
		if (logoB !== logoA) return logoB - logoA;

		if (b.streams.length !== a.streams.length)
			return b.streams.length - a.streams.length;

		const guideA = a.guideIds.length > 0 ? 1 : 0;
		const guideB = b.guideIds.length > 0 ? 1 : 0;
		if (guideB !== guideA) return guideB - guideA;

		return a.name.localeCompare(b.name);
	});
}

export function buildHome(
	channels: Channel[],
	meta: CatalogMeta,
): HomeResponse {
	const channelById = new Map<string, Channel>();
	for (const ch of channels) channelById.set(ch.id, ch);

	const categoryNameById = new Map<string, string>();
	for (const cat of meta.categories) categoryNameById.set(cat.id, cat.name);

	const rows: HomeRow[] = [];

	for (const catId of CATEGORY_ORDER) {
		if (!categoryNameById.has(catId)) continue;

		const filtered = channels.filter((ch) => ch.categories.includes(catId));
		if (filtered.length < 3) continue;

		const ranked = rankChannels(filtered).slice(0, 20);
		rows.push({
			id: catId,
			title: categoryNameById.get(catId)!,
			channels: ranked,
		});
	}

	const dayOfYear = Math.floor(Date.now() / 86400000) % 365;

	const heroPool = HERO_POOL.map((id) => channelById.get(id)).filter(
		(ch): ch is Channel => ch !== undefined && ch.streams.length > 0,
	);

	let hero: Channel | null = null;
	if (heroPool.length > 0) {
		hero = heroPool[dayOfYear % heroPool.length];
	} else {
		const newsRow = rows.find((r) => r.id === 'news');
		hero = newsRow?.channels[0] ?? rows[0]?.channels[0] ?? null;
	}

	return { hero, rows };
}
