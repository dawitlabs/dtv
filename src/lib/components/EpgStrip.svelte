<script lang="ts">
type Program = {
	title: string;
	start: string;
	stop: string;
	description: string | null;
};

type Props = {
	channelId: string;
};

let { channelId }: Props = $props();

let programs = $state<Program[]>([]);
let loaded = $state(false);

function formatTime(iso: string): string {
	const d = new Date(iso);
	return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

let now = $state(Date.now());
$effect(() => {
	const interval = setInterval(() => { now = Date.now() }, 60000)
	return () => clearInterval(interval)
});

const current = $derived(
	programs.find(
		(p) =>
			new Date(p.start).getTime() <= now && new Date(p.stop).getTime() > now,
	) ?? null,
);

const upcoming = $derived(
	programs.filter((p) => new Date(p.start).getTime() > now).slice(0, 2),
);

$effect(() => {
	const id = channelId;
	loaded = false;
	programs = [];

	fetch(`/api/epg?channelId=${encodeURIComponent(id)}`)
		.then((r) => r.json())
		.then((data: { programs: Program[] }) => {
			programs = data.programs ?? [];
			loaded = true;
		})
		.catch(() => {
			loaded = true;
		});
});
</script>

{#if loaded && (current || upcoming.length > 0)}
	<div class="epg-strip">
		{#if current}
			<div class="program current">
				<span class="live-dot"></span>
				<span class="live-label">LIVE</span>
				<span class="title">{current.title}</span>
				<span class="time">{formatTime(current.start)} – {formatTime(current.stop)}</span>
			</div>
		{/if}
		{#each upcoming as prog (prog.start)}
			<div class="program upcoming">
				<span class="title dim">{prog.title}</span>
				<span class="time">{formatTime(prog.start)} – {formatTime(prog.stop)}</span>
			</div>
		{/each}
	</div>
{/if}

<style>
	.epg-strip {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-top: 8px;
	}

	.program {
		display: flex;
		align-items: center;
		gap: 7px;
		min-width: 0;
	}

	.live-label {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.12em;
		color: var(--color-live);
		flex-shrink: 0;
	}

	.title {
		font-size: 13px;
		font-weight: 600;
		color: var(--color-text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		flex: 1;
		min-width: 0;
	}

	.title.dim {
		color: var(--color-text-muted);
		font-weight: 400;
	}

	.time {
		font-size: 11px;
		color: var(--color-text-dim);
		flex-shrink: 0;
	}
</style>
