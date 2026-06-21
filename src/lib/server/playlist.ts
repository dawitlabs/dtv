import type { Channel } from '$lib/types.js'

export function xtreamToM3uUrl(host: string, username: string, password: string): string {
	let normalized = host.trim().replace(/\/$/, '')
	if (!/^https?:\/\//i.test(normalized)) normalized = 'https://' + normalized
	return `${normalized}/get.php?username=${username}&password=${password}&type=m3u_plus&output=ts`
}

export function parseM3U(text: string, _sourceName?: string): Channel[] {
	const lines = text.split('\n')
	const channels: Channel[] = []
	let pending: {
		tvgId: string
		tvgLogo: string
		groupTitle: string
		name: string
	} | null = null

	const ATTR_RE = /([a-zA-Z0-9_-]+)="([^"]*)"/g

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim()

		if (line.startsWith('#EXTINF:')) {
			const commaIdx = line.lastIndexOf(',')
			const name = commaIdx !== -1 ? line.slice(commaIdx + 1).trim() : ''

			let tvgId = ''
			let tvgLogo = ''
			let groupTitle = ''

			ATTR_RE.lastIndex = 0
			let m: RegExpExecArray | null
			while ((m = ATTR_RE.exec(line)) !== null) {
				const key = m[1].toLowerCase()
				const val = m[2]
				if (key === 'tvg-id') tvgId = val
				else if (key === 'tvg-logo') tvgLogo = val
				else if (key === 'group-title') groupTitle = val
			}

			pending = { tvgId, tvgLogo, groupTitle, name }
			continue
		}

		if (pending && !line.startsWith('#') && line.startsWith('http')) {
			const url = line

			let h = 0
			for (let j = 0; j < url.length; j++) h = (Math.imul(31, h) + url.charCodeAt(j)) | 0
			const id = 'custom:' + Math.abs(h).toString(36)

			const { tvgId, tvgLogo, groupTitle, name } = pending
			pending = null

			channels.push({
				id,
				name,
				country: '',
				countryFlag: '',
				categories: groupTitle ? [groupTitle.toLowerCase().trim()] : ['custom'],
				languages: [],
				logo: tvgLogo || null,
				streams: [{ url, quality: null, label: null }],
				guideIds: tvgId ? [tvgId.trim()] : [],
			})

			if (channels.length >= 5000) break
		} else if (!line.startsWith('#') && line !== '') {
			pending = null
		}
	}

	return channels
}
