const SETTINGS_KEY = 'dtv_settings';

type Settings = {
	theme: 'dark' | 'dim' | 'light';
	defaultCountry: string;
	autoplayNext: boolean;
	dataSaver: boolean;
	reduceMotion: boolean;
	defaultQuality: 'auto' | 'sd' | 'hd';
	locale: 'en' | 'am';
};

export type { Settings };

const DEFAULTS: Settings = {
	theme: 'dark',
	defaultCountry: '',
	autoplayNext: true,
	dataSaver: false,
	reduceMotion: false,
	defaultQuality: 'auto',
	locale: 'en',
};

class SettingsState {
	settings = $state<Settings>(DEFAULTS);

	init(): void {
		try {
			const raw = localStorage.getItem(SETTINGS_KEY);
			if (raw) {
				this.settings = { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
			}
		} catch {
			this.settings = { ...DEFAULTS };
		}
	}

	update(patch: Partial<Settings>): void {
		this.settings = { ...this.settings, ...patch };
		this.save();
	}

	private save(): void {
		try {
			localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
		} catch {}
	}
}

export const settings = new SettingsState();
