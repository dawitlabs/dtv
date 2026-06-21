import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { parseM3U, xtreamToM3uUrl } from '$lib/server/playlist.js';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();

	let url: string;
	let name: string;

	if (body.host && body.username && body.password) {
		url = xtreamToM3uUrl(body.host, body.username, body.password);
		name = body.host.replace(/^https?:\/\//, '').split('/')[0];
	} else if (typeof body.url === 'string' && body.url.startsWith('http')) {
		url = body.url;
		name = url.split('/').pop()?.split('?')[0] ?? 'Playlist';
	} else {
		return json({ error: 'Invalid request' }, { status: 400 });
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 15000);

	let text: string;
	try {
		const res = await fetch(url, { signal: controller.signal });
		clearTimeout(timeout);
		if (!res.ok) return json({ error: `Fetch failed: ${res.status}` }, { status: 502 });
		text = await res.text();
	} catch {
		clearTimeout(timeout);
		return json({ error: 'Failed to fetch playlist' }, { status: 502 });
	}

	const channels = parseM3U(text, name);
	return json({ name, channels, count: channels.length });
};
