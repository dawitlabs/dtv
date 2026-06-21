<script lang="ts">
import '../app.css'
import { onMount } from 'svelte'
import { page } from '$app/stores'
import { locale } from '$lib/i18n.js'
import { settings } from '$lib/state/settings.svelte.js'
import { player } from '$lib/state/player.svelte.js'
import { library } from '$lib/state/library.svelte.js'

let { children } = $props()

const pathname = $derived($page.url.pathname)

$effect(() => {
	document.documentElement.setAttribute('data-theme', settings.settings.theme)
})
$effect(() => {
	locale.set(settings.settings.locale)
})

onMount(() => {
	settings.init()
	library.init()
})

const navItems = [
	{
		href: '/',
		label: 'Home',
		icon: `<path d="M3 9.5L12 3l9 6.5V21H15v-7H9v7H3z" stroke-linejoin="round"/>`,
	},
	{
		href: '/guide',
		label: 'Guide',
		icon: `<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>`,
	},
	{
		href: '/browse',
		label: 'Browse',
		icon: `<circle cx="12" cy="12" r="9"/><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/>`,
	},
	{
		href: '/settings',
		label: 'Settings',
		icon: `<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2" fill="currentColor" stroke="none"/><circle cx="16" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="8" cy="18" r="2" fill="currentColor" stroke="none"/>`,
	},
]

function isActive(href: string): boolean {
	return href === '/' ? pathname === '/' : pathname.startsWith(href)
}
</script>

<svelte:head>
	<title>dtv</title>
	<meta name="description" content="Live TV from everywhere" />
	<meta name="theme-color" content="#0a0a0a" />
	<link rel="manifest" href="/manifest.webmanifest" />
</svelte:head>

<div class="shell">
	<!-- ── Desktop sidebar ── -->
	<nav class="sidebar" aria-label="Main navigation">
		<a href="/" class="sidebar-wordmark" aria-label="dtv home">dtv</a>

		<ul class="sidebar-nav">
			{#each navItems as item}
				<li>
					<a
						href={item.href}
						class="sidebar-item"
						class:active={isActive(item.href)}
						aria-current={isActive(item.href) ? 'page' : undefined}
					>
						<svg
							width="20" height="20" viewBox="0 0 24 24"
							fill="none" stroke="currentColor" stroke-width="1.75"
							stroke-linecap="round" stroke-linejoin="round"
							aria-hidden="true"
						>
							{@html item.icon}
						</svg>
						<span>{item.label}</span>
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	<!-- ── Main content ── -->
	<main class="content">
		{@render children()}
	</main>

	<!-- ── Mobile bottom deck ── -->
	<nav class="bottom-nav" aria-label="Main navigation">
		{#each navItems as item}
			<a
				href={item.href}
				class="bottom-item"
				class:active={isActive(item.href)}
				aria-current={isActive(item.href) ? 'page' : undefined}
			>
				<svg
					width="22" height="22" viewBox="0 0 24 24"
					fill="none" stroke="currentColor" stroke-width="1.75"
					stroke-linecap="round" stroke-linejoin="round"
					aria-hidden="true"
				>
					{@html item.icon}
				</svg>
				<span class="bottom-label">{item.label}</span>
			</a>
		{/each}
	</nav>
</div>

<!-- ── Mini-player (non-home pages) ── -->
{#if player.current && !isActive('/')}
	<div class="mini-player" role="region" aria-label="Mini player">
		<div class="mini-player-info">
			<div class="mini-player-name">{player.current.name}</div>
			<div class="mini-player-flag">{player.current.countryFlag} {player.current.categories[0] ?? ''}</div>
		</div>
		<a href="/?watch={player.current.id}" class="mini-open">OPEN</a>
		<button onclick={() => player.close()} class="mini-close" aria-label="Close player">×</button>
	</div>
{/if}

<style>
	/* ── Shell layout ── */
	.shell {
		display: flex;
		min-height: 100dvh;
	}

	.content {
		flex: 1;
		min-width: 0;
	}

	/* ── Desktop sidebar ── */
	.sidebar {
		display: flex;
		flex-direction: column;
		position: fixed;
		inset: 0 auto 0 0;
		width: 200px;
		background: var(--color-surface);
		border-right: 1px solid var(--color-border);
		z-index: 30;
		padding: 28px 0 24px;
	}

	.sidebar-wordmark {
		display: block;
		font-size: 1.75rem;
		font-weight: 900;
		letter-spacing: -0.05em;
		color: var(--color-text);
		text-decoration: none;
		padding: 0 24px 32px;
		line-height: 1;
	}

	.sidebar-nav {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.sidebar-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 11px 24px;
		font-size: 0.875rem;
		font-weight: 600;
		letter-spacing: 0.01em;
		color: var(--color-text-muted);
		text-decoration: none;
		border-left: 2px solid transparent;
		transition: color 0.12s, border-color 0.12s;
	}

	.sidebar-item:hover {
		color: var(--color-text);
	}

	.sidebar-item.active {
		color: var(--color-text);
		border-left-color: var(--color-text);
	}

	/* ── Mobile bottom nav ── */
	.bottom-nav {
		display: none;
	}

	/* ── Mini-player ── */
	.mini-player {
		position: fixed;
		bottom: calc(64px + env(safe-area-inset-bottom) + 12px);
		right: 16px;
		z-index: 40;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 14px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 10px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		max-width: 260px;
	}

	.mini-player-info {
		flex: 1;
		min-width: 0;
	}

	.mini-player-name {
		font-size: 12px;
		font-weight: 700;
		color: var(--color-text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.mini-player-flag {
		font-size: 11px;
		color: var(--color-text-dim);
		margin-top: 1px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.mini-open {
		flex-shrink: 0;
		padding: 4px 10px;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		text-decoration: none;
		transition: color 0.12s, border-color 0.12s;
	}

	.mini-open:hover {
		color: var(--color-text);
		border-color: var(--color-text-muted);
	}

	.mini-close {
		flex-shrink: 0;
		padding: 0 4px;
		background: none;
		border: none;
		color: var(--color-text-dim);
		font-size: 18px;
		line-height: 1;
		cursor: pointer;
		transition: color 0.12s;
	}

	.mini-close:hover {
		color: var(--color-text);
	}

	/* ── Responsive breakpoint ── */
	@media (min-width: 768px) {
		.content {
			padding-left: 200px;
		}
	}

	@media (max-width: 767px) {
		.sidebar {
			display: none;
		}

		.content {
			padding-bottom: calc(64px + env(safe-area-inset-bottom));
		}

		.bottom-nav {
			display: flex;
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			z-index: 30;
			height: calc(64px + env(safe-area-inset-bottom));
			padding-bottom: env(safe-area-inset-bottom);
			background: rgba(6, 6, 6, 0.88);
			backdrop-filter: blur(16px);
			-webkit-backdrop-filter: blur(16px);
			border-top: 1px solid var(--color-border);
		}

		.bottom-item {
			flex: 1;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 4px;
			color: var(--color-text-muted);
			text-decoration: none;
			transition: color 0.12s;
		}

		.bottom-item.active {
			color: var(--color-text);
		}

		.bottom-item:active {
			opacity: 0.7;
		}

		.bottom-label {
			font-size: 10px;
			font-weight: 600;
			letter-spacing: 0.04em;
		}

		.mini-player {
			bottom: calc(64px + env(safe-area-inset-bottom) + 12px);
			right: 12px;
			max-width: calc(100vw - 24px);
		}
	}
</style>
