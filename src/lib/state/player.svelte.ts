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

	sleepTimerEnd = $state(0);
	sleepTimerLeft = $derived(
		this.sleepTimerEnd > 0 ? Math.max(0, Math.ceil((this.sleepTimerEnd - Date.now()) / 60000)) : 0,
	);
	private _sleepTimeout: ReturnType<typeof setTimeout> | undefined = undefined;

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
		if (this._sleepTimeout) {
			clearTimeout(this._sleepTimeout);
			this._sleepTimeout = undefined;
			this.sleepTimerEnd = 0;
		}
	}

	setSleepTimer(minutes: number): void {
		if (this.sleepTimerEnd) {
			clearTimeout(this._sleepTimeout);
			this._sleepTimeout = undefined;
		}
		if (minutes <= 0) {
			this.sleepTimerEnd = 0;
			return;
		}
		this.sleepTimerEnd = Date.now() + minutes * 60 * 1000;
		this._sleepTimeout = setTimeout(() => {
			this.close();
			this.sleepTimerEnd = 0;
		}, minutes * 60 * 1000);
	}
}

export const player = new PlayerState();
