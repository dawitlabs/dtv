import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		VitePWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'dtv',
				short_name: 'dtv',
				description: 'Live TV from everywhere',
				theme_color: '#0a0a0a',
				background_color: '#0a0a0a',
				display: 'standalone',
				icons: [
					{ src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
					{ src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
					{ src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
					{ src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
					{ src: '/icon-180.png', sizes: '180x180', type: 'image/png', purpose: 'any' }
				],
				shortcuts: [
					{ name: 'Sports', short_name: 'Sports', url: '/?category=sports', description: 'Live sports channels' },
					{ name: 'News', short_name: 'News', url: '/?category=news', description: 'Live news channels' },
					{ name: 'TV Guide', short_name: 'Guide', url: '/guide', description: 'TV program guide' },
					{ name: 'Multi-view', short_name: 'Multi', url: '/multi', description: 'Watch multiple channels' }
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,woff2}'],
				runtimeCaching: [
					{
						// Navigation (HTML pages) — network-first; offline page on failure
						urlPattern: ({ request }) => request.mode === 'navigate',
						handler: 'NetworkFirst',
						options: {
							cacheName: 'pages-cache',
							networkTimeoutSeconds: 5,
							plugins: [
								{
									handlerDidError: async () =>
										Response.redirect('/offline', 302),
								},
							],
						},
					},
					{
						urlPattern: /^\/api\//,
						handler: 'NetworkFirst',
						options: { cacheName: 'api-cache', expiration: { maxAgeSeconds: 3600 * 6 } }
					}
				]
			}
		})
	]
});
