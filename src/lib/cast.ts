let castInitialized = false
let castAvailable = false

export function isCastAvailable(): boolean {
	return castAvailable
}

export function initCast(onAvailable: () => void): void {
	if (castInitialized) return
	castInitialized = true

	;(window as unknown as Record<string, unknown>)['__onGCastApiAvailable'] = (isAvailable: boolean) => {
		if (!isAvailable) return
		try {
			cast.framework.CastContext.getInstance().setOptions({
				receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
				autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
			})
			castAvailable = true
			onAvailable()
		} catch {
			// Cast SDK failed (no device, unsupported browser, etc.)
		}
	}

	const s = document.createElement('script')
	s.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1'
	s.async = true
	document.head.appendChild(s)
}

export async function castStream(url: string, title: string): Promise<void> {
	const session = cast.framework.CastContext.getInstance().getCurrentSession()
	if (!session) throw new Error('no cast session')
	const mediaInfo = new chrome.cast.media.MediaInfo(url, 'application/x-mpegurl')
	mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata()
	;(mediaInfo.metadata as Record<string, unknown>).title = title
	const req = new chrome.cast.media.LoadRequest(mediaInfo)
	await session.loadMedia(req)
}

export function stopCast(): void {
	cast.framework.CastContext.getInstance().getCurrentSession()?.endSession(true)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const chrome: any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const cast: any
