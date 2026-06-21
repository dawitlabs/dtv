import { json } from '@sveltejs/kit';
import { getCatalog } from '$lib/server/catalog.js';
import type { RequestHandler } from './$types';

type RawProgram = {
	title: string;
	start: string;
	stop: string;
	description?: string | null;
};

type RawEpgFile = {
	programs?: RawProgram[];
};

export const GET: RequestHandler = async ({ url }) => {
	const channelId = url.searchParams.get('channelId');
	if (!channelId) return json({ programs: [] });

	const { channels } = await getCatalog();
	const channel = channels.find((c) => c.id === channelId);
	if (!channel || channel.guideIds.length === 0) {
		return json(
			{ programs: [] },
			{ headers: { 'Cache-Control': 'public, s-maxage=21600' } },
		);
	}

	const now = Date.now();
	const FETCH_OPTS = { next: { revalidate: 3600 * 6 } } as RequestInit;

	for (const siteId of channel.guideIds) {
		let data: RawEpgFile;
		try {
			const res = await fetch(
				`https://iptv-org.github.io/epg/guides/${siteId}.json`,
				FETCH_OPTS,
			);
			if (!res.ok) continue;
			data = (await res.json()) as RawEpgFile;
		} catch {
			continue;
		}

		const upcoming = (data.programs ?? [])
			.filter((p) => new Date(p.stop).getTime() > now)
			.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
			.slice(0, 3)
			.map((p) => ({
				title: p.title,
				start: p.start,
				stop: p.stop,
				description: p.description ?? null,
			}));

		if (upcoming.length > 0) {
			return json(
				{ programs: upcoming },
				{ headers: { 'Cache-Control': 'public, s-maxage=21600' } },
			);
		}
	}

	return json(
		{ programs: [] },
		{ headers: { 'Cache-Control': 'public, s-maxage=21600' } },
	);
};
