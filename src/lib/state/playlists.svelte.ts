import type { Channel } from '$lib/types.js';

const PLAYLISTS_KEY = 'dtv_playlists';

type Playlist = {
	id: string;
	name: string;
	url: string;
	channels: Channel[];
	addedAt: number;
};

export type { Playlist };

class PlaylistsState {
	items = $state<Playlist[]>([]);
	allChannels = $derived(this.items.flatMap((p) => p.channels));

	init(): void {
		try {
			const raw = localStorage.getItem(PLAYLISTS_KEY);
			if (raw) {
				this.items = JSON.parse(raw) as Playlist[];
			}
		} catch {
			this.items = [];
		}
	}

	add(playlist: Playlist): void {
		this.items = [...this.items, playlist];
		this.save();
	}

	remove(id: string): void {
		this.items = this.items.filter((p) => p.id !== id);
		this.save();
	}

	update(id: string, channels: Channel[]): void {
		this.items = this.items.map((p) => (p.id === id ? { ...p, channels } : p));
		this.save();
	}

	private save(): void {
		try {
			localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(this.items));
		} catch {}
	}
}

export const playlists = new PlaylistsState();
