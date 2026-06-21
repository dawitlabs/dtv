import type { Channel } from '$lib/types.js';

const FAVORITES_KEY = 'dtv_favorites';
const RECENTS_KEY = 'dtv_recents';
const RECENTS_CAP = 30;

class LibraryState {
	favorites = $state<Set<string>>(new Set());
	recents = $state<Channel[]>([]);

	init(): void {
		try {
			const rawFavorites = localStorage.getItem(FAVORITES_KEY);
			if (rawFavorites) {
				this.favorites = new Set(JSON.parse(rawFavorites) as string[]);
			}
		} catch {
			this.favorites = new Set();
		}

		try {
			const rawRecents = localStorage.getItem(RECENTS_KEY);
			if (rawRecents) {
				this.recents = JSON.parse(rawRecents) as Channel[];
			}
		} catch {
			this.recents = [];
		}
	}

	toggleFavorite(id: string): void {
		const next = new Set(this.favorites);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		this.favorites = next;
		this.save();
	}

	isFavorite(id: string): boolean {
		return this.favorites.has(id);
	}

	addRecent(channel: Channel): void {
		const filtered = this.recents.filter((c) => c.id !== channel.id);
		this.recents = [channel, ...filtered].slice(0, RECENTS_CAP);
		this.save();
	}

	private save(): void {
		try {
			localStorage.setItem(FAVORITES_KEY, JSON.stringify([...this.favorites]));
			localStorage.setItem(RECENTS_KEY, JSON.stringify(this.recents));
		} catch {
		}
	}
}

export const library = new LibraryState();
