type HlsInstance = import('hls.js').default
type HlsConstructor = typeof import('hls.js').default

let HlsCtor: HlsConstructor | null = null

async function ensureHls(): Promise<HlsConstructor> {
	if (!HlsCtor) HlsCtor = (await import('hls.js')).default
	return HlsCtor
}

export type HlsHandle = {
	hls: HlsInstance | null
	destroy(): void
}

export async function attachHls(
	videoEl: HTMLVideoElement,
	url: string,
	onPlaying: () => void,
	onError: () => void,
): Promise<HlsHandle> {
	if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
		videoEl.src = url
		videoEl.play().catch(() => {})
		videoEl.addEventListener(
			'error',
			() => onError(),
			{ once: true },
		)
		return {
			hls: null,
			destroy() {
				videoEl.src = ''
				videoEl.load()
			},
		}
	}

	const H = await ensureHls()

	if (!H.isSupported()) {
		onError()
		return { hls: null, destroy() {} }
	}

	const h = new H({ enableWorker: true, lowLatencyMode: true })
	h.loadSource(url)
	h.attachMedia(videoEl)

	h.on(H.Events.MANIFEST_PARSED, () => {
		videoEl.play().catch(() => {})
		onPlaying()
	})

	h.on(H.Events.ERROR, (_evt: unknown, data: { fatal: boolean }) => {
		if (data.fatal) onError()
	})

	return {
		hls: h,
		destroy() {
			h.destroy()
		},
	}
}
