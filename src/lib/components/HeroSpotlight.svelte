<script lang="ts">
import type { Channel } from '$lib/types.js';

type Props = {
	channel: Channel;
	onplay: (channel: Channel) => void;
};

let { channel, onplay }: Props = $props();

const initials = $derived(
	channel.name
		.split(/\s+/)
		.slice(0, 2)
		.map((w) => w[0])
		.join('')
		.toUpperCase(),
);

const primaryCategory = $derived(channel.categories[0] ?? null);
</script>

<div class="hero">
	{#if channel.logo}
		<img
			class="hero-bg"
			src={channel.logo}
			alt=""
			aria-hidden="true"
		/>
	{:else}
		<div class="hero-bg bg-mesh"></div>
	{/if}

	<div class="hero-overlay"></div>

	<div class="hero-content">
		{#if channel.logo}
			<img
				class="hero-logo"
				src={channel.logo}
				alt={channel.name}
				onerror={(e) => {
					(e.currentTarget as HTMLImageElement).style.display = 'none';
				}}
			/>
		{:else}
			<div class="hero-initials" aria-hidden="true">{initials}</div>
		{/if}

		<h1 class="hero-name">{channel.name}</h1>

		<div class="hero-meta">
			{#if primaryCategory}
				<span class="quality-badge">{primaryCategory}</span>
			{/if}
			{#if channel.countryFlag}
				<span class="hero-flag">{channel.countryFlag}</span>
			{/if}
		</div>

		<button class="hero-watch" onclick={() => onplay(channel)}>
			Watch now
		</button>
	</div>
</div>

<style>
	.hero {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 6;
		overflow: hidden;
		background: var(--color-surface);
	}

	.hero-bg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: blur(24px) brightness(0.3);
		transform: scale(1.1);
	}

	.hero-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			to right,
			oklch(0.06 0 0 / 0.95) 0%,
			oklch(0.06 0 0 / 0.6) 60%,
			transparent 100%
		);
	}

	.hero-content {
		position: absolute;
		bottom: 0;
		left: 0;
		padding: clamp(24px, 5vw, 48px);
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	.hero-logo {
		width: clamp(48px, 8vw, 80px);
		height: auto;
		object-fit: contain;
		margin-bottom: 12px;
	}

	.hero-initials {
		font-size: clamp(2.5rem, 8vw, 5rem);
		font-weight: 900;
		letter-spacing: -0.04em;
		color: oklch(0.25 0 0);
		line-height: 1;
		margin-bottom: 12px;
		font-family: var(--font-sans);
	}

	.hero-name {
		font-size: clamp(2rem, 6vw, 4rem);
		font-weight: 900;
		color: var(--color-text);
		letter-spacing: -0.04em;
		line-height: 1.05;
		margin: 0 0 8px;
		font-family: var(--font-sans);
	}

	.hero-meta {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 0;
	}

	.quality-badge {
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-text-dim);
	}

	.hero-flag {
		font-size: 14px;
	}

	.hero-watch {
		margin-top: 12px;
		background: var(--color-text);
		color: var(--color-background);
		border: none;
		padding: 10px 24px;
		border-radius: 6px;
		font-weight: 700;
		font-size: 13px;
		letter-spacing: 0.04em;
		cursor: pointer;
		font-family: var(--font-sans);
		transition: opacity 0.15s;
	}

	.hero-watch:hover {
		opacity: 0.88;
	}

	@media (max-width: 600px) {
		.hero {
			aspect-ratio: 16 / 9;
		}

		.hero-name {
			font-size: clamp(1.5rem, 8vw, 2.5rem);
		}
	}
</style>
