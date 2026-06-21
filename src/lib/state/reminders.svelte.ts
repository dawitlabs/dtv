const REMINDERS_KEY = 'dtv_reminders';

type Reminder = {
	id: string;
	channelId: string;
	channelName: string;
	programTitle: string;
	start: number;
};

export type { Reminder };

class RemindersState {
	items = $state<Reminder[]>([]);

	init(): void {
		try {
			const raw = localStorage.getItem(REMINDERS_KEY);
			if (raw) {
				const parsed = JSON.parse(raw) as Reminder[];
				this.items = parsed.filter((r) => r.start >= Date.now() - 60_000);
				this.save();
			}
		} catch {
			this.items = [];
		}
	}

	add(r: Omit<Reminder, 'id'>): void {
		this.items = [...this.items, { ...r, id: crypto.randomUUID() }];
		this.save();
	}

	remove(id: string): void {
		this.items = this.items.filter((r) => r.id !== id);
		this.save();
	}

	has(channelId: string, start: number): boolean {
		return this.items.some((r) => r.channelId === channelId && r.start === start);
	}

	private save(): void {
		try {
			localStorage.setItem(REMINDERS_KEY, JSON.stringify(this.items));
		} catch {}
	}
}

export const reminders = new RemindersState();
