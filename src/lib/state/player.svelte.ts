import type { Channel } from '$lib/types.js';
import { catalog } from './catalog.svelte.js';

type QueueSource =
	| 'catalog'
	| 'row'
	| 'favorites'
	| 'recents'
	| 'search'
	| 'deeplink';

class PlayerState {
	queue = $state<Channel[]>([]);
	index = $state(-1);
	source = $state<QueueSource>('deeplink');

	liveQueue = $derived(
		this.source === 'catalog' ? catalog.channels : this.queue,
	);
	current = $derived(this.liveQueue[this.index] ?? null);
	hasNext = $derived(this.index >= 0 && this.index < this.liveQueue.length - 1);
	hasPrev = $derived(this.index > 0);

	open(ch: Channel, queue: Channel[], source: QueueSource): void {
		this.source = source;
		if (source === 'catalog') {
			this.queue = [];
			const found = catalog.channels.findIndex((c) => c.id === ch.id);
			this.index = found === -1 ? 0 : found;
		} else {
			this.queue = queue;
			const found = queue.findIndex((c) => c.id === ch.id);
			this.index = found === -1 ? 0 : found;
		}
	}

	openSingle(ch: Channel, source: QueueSource = 'deeplink'): void {
		this.source = source;
		this.queue = [ch];
		this.index = 0;
	}

	next(): Channel | null {
		const q = this.liveQueue;
		if (this.index < q.length - 1) {
			this.index++;
			if (
				this.source === 'catalog' &&
				this.index >= q.length - 5 &&
				catalog.hasMore
			) {
				catalog.loadMore();
			}
			return this.current;
		}
		return null;
	}

	prev(): Channel | null {
		if (this.index > 0) {
			this.index--;
			return this.current;
		}
		return null;
	}

	close(): void {
		this.queue = [];
		this.index = -1;
	}
}

export const player = new PlayerState();
