export type WakeLockHandle = { release: () => void };

export async function acquireWakeLock(): Promise<WakeLockHandle | null> {
	if (!('wakeLock' in navigator)) return null;
	try {
		const sentinel = await (navigator as Navigator & { wakeLock: { request(t: string): Promise<{ release(): Promise<void> }> } }).wakeLock.request('screen');
		return { release: () => sentinel.release().catch(() => {}) };
	} catch {
		return null;
	}
}

export function vibrate(ms: number | number[]) {
	navigator.vibrate?.(ms);
}

export async function lockLandscape(): Promise<void> {
	try {
		await screen.orientation?.lock?.('landscape');
	} catch {
		// not supported on all browsers/iOS
	}
}

export function unlockOrientation(): void {
	try {
		screen.orientation?.unlock?.();
	} catch {}
}

export async function requestFullscreen(el: HTMLElement): Promise<void> {
	if (document.fullscreenElement) {
		await document.exitFullscreen().catch(() => {});
		return;
	}
	if (el.requestFullscreen) {
		await el.requestFullscreen().catch(() => {});
	} else if ((el as HTMLElement & { webkitRequestFullscreen?(): void }).webkitRequestFullscreen) {
		(el as HTMLElement & { webkitRequestFullscreen(): void }).webkitRequestFullscreen();
	}
}

export function isFullscreen(): boolean {
	return !!document.fullscreenElement || !!(document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement;
}

export function isMobile(): boolean {
	return window.matchMedia('(pointer: coarse)').matches;
}
