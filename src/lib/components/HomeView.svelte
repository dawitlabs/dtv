<script lang="ts">
import CategoryRow from '$lib/components/CategoryRow.svelte';
import HeroSpotlight from '$lib/components/HeroSpotlight.svelte';
import type { Channel, HomeResponse } from '$lib/types.js';

type Props = {
	home: HomeResponse;
	favorites: Set<string>;
	onplay: (channel: Channel, queue: Channel[]) => void;
	onfavorite: (id: string) => void;
	onseeall: (categoryId: string) => void;
};

let { home, favorites, onplay, onfavorite, onseeall }: Props = $props();
</script>

{#if home.hero}
	<HeroSpotlight
		channel={home.hero}
		onplay={(ch) =>
			onplay(ch, home.rows.find((r) => r.channels.includes(ch))?.channels ?? [ch])}
	/>
{/if}

{#each home.rows as row (row.id)}
	<CategoryRow
		title={row.title}
		channels={row.channels}
		{favorites}
		onplay={(ch, q) => onplay(ch, q)}
		{onfavorite}
		onseeall={() => onseeall(row.id)}
	/>
{/each}
