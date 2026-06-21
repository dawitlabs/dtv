export type Channel = {
	id: string;
	name: string;
	country: string;
	countryFlag: string;
	categories: string[];
	languages: string[];
	logo: string | null;
	streams: { url: string; quality: string | null; label: string | null }[];
	guideIds: string[];
};

export type CatalogMeta = {
	categories: { id: string; name: string }[];
	countries: { code: string; name: string; flag: string }[];
	languages: { code: string; name: string }[];
};

type RawStream = {
	channel: string | null;
	feed: string | null;
	title: string;
	url: string;
	quality: string | null;
	label: string | null;
	user_agent: string | null;
	referrer: string | null;
};

type RawChannel = {
	id: string;
	name: string;
	alt_names: string[];
	network: string | null;
	owners: string[];
	country: string;
	categories: string[];
	is_nsfw: boolean;
	launched: string | null;
	closed: string | null;
	replaced_by: string | null;
	website: string | null;
	logo?: string | null;
};

type RawCategory = { id: string; name: string; description: string };
type RawCountry = {
	code: string;
	name: string;
	languages: string[];
	flag: string;
};
type RawLanguage = { code: string; name: string; native_name: string };
type RawGuide = {
	channel: string;
	site: string;
	site_id: string;
	site_name: string;
	lang: string;
	logo: string | null;
};

const QUALITY_ORDER = ['1080p', '720p', '480p', '360p', '240p'];
const TTL = 6 * 60 * 60 * 1000;
const FETCH_OPTS = { next: { revalidate: 3600 * 6 } } as RequestInit;

let cache: { data: Channel[]; meta: CatalogMeta; ts: number } | null = null;

async function fetchJson<T>(url: string): Promise<T> {
	const res = await fetch(url, FETCH_OPTS);
	if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`);
	return res.json() as Promise<T>;
}

function qualityRank(q: string | null): number {
	if (q === null) return QUALITY_ORDER.length;
	const idx = QUALITY_ORDER.indexOf(q);
	return idx === -1 ? QUALITY_ORDER.length : idx;
}

export async function getCatalog(): Promise<{
	channels: Channel[];
	meta: CatalogMeta;
}> {
	if (cache && Date.now() - cache.ts < TTL) {
		return { channels: cache.data, meta: cache.meta };
	}

	const [streams, rawChannels, categories, countries, languages, guides] =
		await Promise.all([
			fetchJson<RawStream[]>('https://iptv-org.github.io/api/streams.json'),
			fetchJson<RawChannel[]>('https://iptv-org.github.io/api/channels.json'),
			fetchJson<RawCategory[]>(
				'https://iptv-org.github.io/api/categories.json',
			),
			fetchJson<RawCountry[]>('https://iptv-org.github.io/api/countries.json'),
			fetchJson<RawLanguage[]>('https://iptv-org.github.io/api/languages.json'),
			fetchJson<RawGuide[]>('https://iptv-org.github.io/api/guides.json'),
		]);

	const channelMap = new Map<string, RawChannel>();
	for (const ch of rawChannels) channelMap.set(ch.id, ch);

	const countryMeta = new Map<string, { flag: string; languages: string[] }>();
	for (const c of countries)
		countryMeta.set(c.code, { flag: c.flag, languages: c.languages });

	const guideMap = new Map<string, string[]>();
	for (const g of guides) {
		const existing = guideMap.get(g.channel);
		if (existing) {
			existing.push(g.site_id);
		} else {
			guideMap.set(g.channel, [g.site_id]);
		}
	}

	const grouped = new Map<string, RawStream[]>();
	for (const stream of streams) {
		if (!stream.url.startsWith('https://')) continue;
		if (stream.user_agent !== null || stream.referrer !== null) continue;
		if (!stream.channel) continue;

		const ch = channelMap.get(stream.channel);
		if (!ch) continue;
		if (ch.is_nsfw) continue;
		if (ch.closed !== null) continue;

		const existing = grouped.get(stream.channel);
		if (existing) {
			existing.push(stream);
		} else {
			grouped.set(stream.channel, [stream]);
		}
	}

	const channels: Channel[] = [];
	for (const [channelId, channelStreams] of grouped) {
		const ch = channelMap.get(channelId);
		if (!ch) continue;

		const meta = countryMeta.get(ch.country);

		const sorted = channelStreams
			.slice()
			.sort((a, b) => qualityRank(a.quality) - qualityRank(b.quality));

		channels.push({
			id: ch.id,
			name: ch.name,
			country: ch.country,
			countryFlag: meta?.flag ?? '',
			categories: ch.categories,
			languages: meta?.languages ?? [],
			logo: ch.logo ?? null,
			streams: sorted.map((s) => ({
				url: s.url,
				quality: s.quality,
				label: s.label,
			})),
			guideIds: guideMap.get(channelId) ?? [],
		});
	}

	const meta: CatalogMeta = {
		categories: categories.map((c) => ({ id: c.id, name: c.name })),
		countries: countries.map((c) => ({
			code: c.code,
			name: c.name,
			flag: c.flag,
		})),
		languages: languages.map((l) => ({ code: l.code, name: l.name })),
	};

	cache = { data: channels, meta, ts: Date.now() };
	return { channels, meta };
}
