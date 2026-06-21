<script lang="ts">
import { onMount } from 'svelte'
import { goto } from '$app/navigation'
import type { Channel } from '$lib/types.js'
import { library } from '$lib/state/library.svelte.js'
import { catalog } from '$lib/state/catalog.svelte.js'

const HOUR_WIDTH = 200
const ROW_HEIGHT = 56
const LABEL_COL_WIDTH = 160

type Program = { title: string; start: string; stop: string; description: string | null }
type EpgData = Record<string, Program[]>

let now = $state(Date.now())
let nowInterval: ReturnType<typeof setInterval>

const windowStart = $derived(Math.floor(now / (30 * 60 * 1000)) * (30 * 60 * 1000))
const windowEnd = $derived(windowStart + 6 * 3600 * 1000)

let epgData = $state<EpgData>({})
let channels = $state<Channel[]>([])
let loading = $state(true)

function timeToX(ts: number): number {
	return ((ts - windowStart) / (windowEnd - windowStart)) * HOUR_WIDTH * 6
}

function programWidth(start: string, stop: string): number {
	const s = new Date(start).getTime()
	const e = new Date(stop).getTime()
	const clamped = Math.min(e, windowEnd) - Math.max(s, windowStart)
	return Math.max(4, (clamped / (windowEnd - windowStart)) * HOUR_WIDTH * 6)
}

function programLeft(start: string): number {
	const s = Math.max(new Date(start).getTime(), windowStart)
	return timeToX(s)
}

function nowX(): number {
	return timeToX(now)
}

function isCurrentProgram(start: string, stop: string): boolean {
	const s = new Date(start).getTime()
	const e = new Date(stop).getTime()
	return s <= now && e > now
}

function formatTime(iso: string): string {
	return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function getHourLabels(): { label: string; x: number }[] {
	const labels: { label: string; x: number }[] = []
	let t = windowStart
	while (t <= windowEnd) {
		labels.push({
			label: new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
			x: timeToX(t),
		})
		t += 3600 * 1000
	}
	return labels
}

async function loadEpg(chs: Channel[]) {
	const ids = chs.map((c) => c.id).join(',')
	try {
		const res = await fetch(`/api/epg?channelIds=${ids}&hours=6`)
		if (res.ok) {
			const data: EpgData = await res.json()
			epgData = { ...epgData, ...data }
		}
	} catch {
		// network error — epgData stays as-is
	}
}

function playChannel(ch: Channel) {
	goto(`/?watch=${ch.id}`)
}

onMount(() => {
	library.init()

	Promise.all([catalog.loadFilters(), catalog.search(true)]).then(async () => {
		const favIds = [...library.favorites]
		const favChannels = favIds
			.map((id) => catalog.channels.find((c) => c.id === id))
			.filter(Boolean) as Channel[]
		const rest = catalog.channels.filter((c) => !library.favorites.has(c.id)).slice(0, 100)
		channels = [...favChannels, ...rest]
		loading = false
		await loadEpg(channels.slice(0, 30))
	})

	nowInterval = setInterval(() => {
		now = Date.now()
	}, 60000)

	return () => clearInterval(nowInterval)
})

const totalGridWidth = $derived(HOUR_WIDTH * 6)
</script>

<div style="min-height:100vh; background:var(--color-background); color:var(--color-text); font-family:var(--font-sans);">

	<!-- Header -->
	<header class="glass-header" style="position:sticky; top:0; z-index:40; padding:12px 20px; display:flex; align-items:center; gap:16px;">
		<a
			href="/"
			style="display:flex; align-items:center; gap:6px; color:var(--color-text-muted); text-decoration:none; font-size:13px; font-weight:600; letter-spacing:0.04em; transition:color 0.15s;"
			aria-label="Back to home"
		>
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
				<path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
			dtv
		</a>
		<h1 style="font-size:1rem; font-weight:900; letter-spacing:-0.03em; color:var(--color-text); margin:0;">TV Guide</h1>
		<span style="margin-left:auto; font-size:12px; color:var(--color-text-dim); font-variant-numeric:tabular-nums;">
			{new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
		</span>
	</header>

	{#if loading}
		<!-- Skeleton -->
		<div style="padding:24px 0;">
			<!-- Time header skeleton -->
			<div style="display:flex; margin-bottom:2px; padding-left:{LABEL_COL_WIDTH}px;">
				{#each Array(7) as _, i}
					<div style="width:{HOUR_WIDTH}px; height:32px; background:var(--color-surface); border-radius:4px; margin-right:2px; opacity:{1 - i * 0.12};"></div>
				{/each}
			</div>
			<!-- Row skeletons -->
			{#each Array(12) as _, i}
				<div style="display:flex; align-items:center; height:{ROW_HEIGHT}px; border-bottom:1px solid var(--color-border); opacity:{1 - i * 0.07};">
					<div style="width:{LABEL_COL_WIDTH}px; flex-shrink:0; padding:0 12px; display:flex; align-items:center; gap:8px;">
						<div style="width:28px; height:28px; border-radius:4px; background:var(--color-surface-raised);"></div>
						<div style="height:12px; flex:1; border-radius:3px; background:var(--color-surface-raised);"></div>
					</div>
					<div style="flex:1; height:36px; border-radius:4px; background:var(--color-surface); margin:0 8px;"></div>
				</div>
			{/each}
		</div>

	{:else}
		<!-- Guide grid -->
		<div style="overflow-x:auto; position:relative;">
			<div style="min-width:{LABEL_COL_WIDTH + totalGridWidth}px;">

				<!-- Time axis header -->
				<div
					style="position:sticky; top:57px; z-index:30; display:flex; border-bottom:1px solid var(--color-border); background:var(--color-background);"
					class="glass-header"
				>
					<!-- Corner cell -->
					<div
						style="width:{LABEL_COL_WIDTH}px; flex-shrink:0; height:36px; border-right:1px solid var(--color-border); background:var(--color-background);"
					></div>
					<!-- Hour labels -->
					<div style="position:relative; width:{totalGridWidth}px; height:36px; flex-shrink:0;">
						{#each getHourLabels() as { label, x }}
							<span
								style="position:absolute; left:{x}px; top:50%; transform:translateY(-50%); font-size:11px; font-weight:600; color:var(--color-text-dim); letter-spacing:0.05em; white-space:nowrap; padding-left:6px;"
							>{label}</span>
						{/each}
						<!-- Now marker in header -->
						{#if nowX() >= 0 && nowX() <= totalGridWidth}
							<div
								style="position:absolute; left:{nowX()}px; top:0; bottom:0; width:2px; background:var(--color-live); opacity:0.7;"
							></div>
						{/if}
					</div>
				</div>

				<!-- Channel rows -->
				{#each channels as channel (channel.id)}
					{@const programs = epgData[channel.id] ?? null}
					<div
						style="display:flex; border-bottom:1px solid var(--color-border); height:{ROW_HEIGHT}px;"
					>
						<!-- Channel label — sticky left -->
						<button
							onclick={() => playChannel(channel)}
							style="
								position:sticky; left:0; z-index:20;
								width:{LABEL_COL_WIDTH}px; flex-shrink:0;
								height:{ROW_HEIGHT}px;
								display:flex; align-items:center; gap:8px;
								padding:0 12px;
								border:none; border-right:1px solid var(--color-border);
								background:var(--color-background);
								cursor:pointer;
								text-align:left;
								transition:background 0.15s;
							"
							aria-label="Play {channel.name}"
						>
							{#if channel.logo}
								<img
									src={channel.logo}
									alt=""
									style="width:28px; height:28px; object-fit:contain; border-radius:3px; flex-shrink:0; opacity:0.85;"
									loading="lazy"
								/>
							{:else}
								<span
									style="width:28px; height:28px; border-radius:3px; background:var(--color-surface-raised); flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:900; color:var(--color-text-muted);"
								>{channel.name.slice(0, 2).toUpperCase()}</span>
							{/if}
							<span
								style="font-size:12px; font-weight:700; color:var(--color-text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:{LABEL_COL_WIDTH - 56}px; line-height:1.2;"
							>
								{channel.countryFlag} {channel.name}
							</span>
						</button>

						<!-- Programs track -->
						<div style="position:relative; width:{totalGridWidth}px; flex-shrink:0; height:{ROW_HEIGHT}px; overflow:hidden;">

							<!-- Now line -->
							{#if nowX() >= 0 && nowX() <= totalGridWidth}
								<div
									style="position:absolute; left:{nowX()}px; top:0; bottom:0; width:2px; background:var(--color-live); z-index:10; opacity:0.5;"
								></div>
							{/if}

							<!-- Past overlay -->
							{#if nowX() > 0}
								<div
									style="position:absolute; left:0; top:0; bottom:0; width:{Math.min(nowX(), totalGridWidth)}px; background:rgba(0,0,0,0.25); z-index:1; pointer-events:none;"
								></div>
							{/if}

							{#if programs === null}
								<!-- Not yet fetched — dim dash -->
								<span style="position:absolute; left:12px; top:50%; transform:translateY(-50%); font-size:12px; color:var(--color-text-dim);">—</span>

							{:else if programs.length === 0}
								<!-- No EPG data -->
								<span style="position:absolute; left:12px; top:50%; transform:translateY(-50%); font-size:12px; color:var(--color-text-dim);">—</span>

							{:else}
								{#each programs as prog}
									{@const isCurrent = isCurrentProgram(prog.start, prog.stop)}
									{@const left = programLeft(prog.start)}
									{@const width = programWidth(prog.start, prog.stop)}
									<div
										title="{prog.title} · {formatTime(prog.start)} – {formatTime(prog.stop)}{prog.description ? '\n' + prog.description : ''}"
										style="
											position:absolute;
											left:{left}px;
											width:{width - 2}px;
											top:6px; bottom:6px;
											border-radius:5px;
											border:1px solid {isCurrent ? 'oklch(0.30 0 0)' : 'var(--color-border)'};
											background:{isCurrent ? 'var(--color-surface-raised)' : 'var(--color-surface)'};
											padding:0 8px;
											display:flex; flex-direction:column; justify-content:center;
											overflow:hidden;
											cursor:default;
											z-index:2;
											transition:border-color 0.15s;
										"
									>
										{#if width > 40}
											<span
												style="
													font-size:11px;
													font-weight:{isCurrent ? '700' : '500'};
													color:{isCurrent ? 'var(--color-text)' : 'var(--color-text-muted)'};
													white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
													line-height:1.3;
												"
											>{prog.title}</span>
											{#if width > 100}
												<span
													style="font-size:10px; color:var(--color-text-dim); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; line-height:1.2; margin-top:1px;"
												>{formatTime(prog.start)} – {formatTime(prog.stop)}</span>
											{/if}
										{/if}
									</div>
								{/each}
							{/if}
						</div>
					</div>
				{/each}

				<!-- Empty state -->
				{#if channels.length === 0}
					<div style="padding:64px 24px; text-align:center; color:var(--color-text-dim); font-size:14px;">
						No channels available
					</div>
				{/if}

			</div>
		</div>
	{/if}

</div>
