import type { RequestHandler } from './$types.js';
import { getCatalog } from '$lib/server/catalog.js';

export const GET: RequestHandler = async ({ url }) => {
	const channelId = url.searchParams.get('id');
	if (!channelId) return new Response('Missing id', { status: 400 });

	const { channels } = await getCatalog();
	const channel = channels.find((c) => c.id === channelId);

	const name = channel?.name ?? 'dtv';
	const category = channel?.categories[0] ?? 'live tv';

	const esc = (s: string) =>
		s
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0a0a0a"/>
  <rect x="60" y="60" width="160" height="160" rx="24" fill="#141414"/>
  <text x="140" y="165" font-family="system-ui, sans-serif" font-size="80" font-weight="900" fill="#f2f2f2" text-anchor="middle">${esc(name.slice(0, 2).toUpperCase())}</text>
  <text x="60" y="350" font-family="system-ui, sans-serif" font-size="72" font-weight="900" fill="#f2f2f2" letter-spacing="-2">${esc(name.length > 24 ? name.slice(0, 24) + '…' : name)}</text>
  <text x="60" y="420" font-family="system-ui, sans-serif" font-size="28" fill="#888" text-transform="uppercase">${esc(category.toUpperCase())} · LIVE ON DTV</text>
  <rect x="60" y="500" width="120" height="4" rx="2" fill="#f2f2f2" opacity="0.15"/>
  <text x="1140" y="590" font-family="system-ui, sans-serif" font-size="32" font-weight="900" fill="#f2f2f2" text-anchor="end" opacity="0.6">dtv</text>
</svg>`;

	return new Response(svg, {
		headers: {
			'Content-Type': 'image/svg+xml',
			'Cache-Control': 'public, s-maxage=86400',
		},
	});
};
