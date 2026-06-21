import { writable } from 'svelte/store'

export type Locale = 'en' | 'am'

const dict: Record<string, Record<Locale, string>> = {
  'nav.home': { en: 'Home', am: 'ቤት' },
  'nav.guide': { en: 'Guide', am: 'መመሪያ' },
  'nav.browse': { en: 'Browse', am: 'ፈልግ' },
  'nav.settings': { en: 'Settings', am: 'ቅንብሮች' },
  'search.placeholder': { en: 'Search channels…', am: 'ቻናሎችን ፈልግ…' },
  'filter.all': { en: 'All', am: 'ሁሉ' },
  'filter.countries': { en: 'All countries', am: 'ሁሉም ሀገሮች' },
  'filter.languages': { en: 'All languages', am: 'ሁሉም ቋንቋዎች' },
  'filter.myChannels': { en: 'My channels', am: 'የእኔ ቻናሎች' },
  'empty.noChannels': { en: 'No channels found', am: 'ምንም ቻናሎች አልተገኙም' },
  'empty.adjustFilters': { en: 'Try adjusting your search or filters', am: 'ፍለጋዎን ወይም ማጣሪያዎን ይቀይሩ' },
  'player.live': { en: 'LIVE', am: 'ቀጥታ' },
  'player.install': { en: 'INSTALL', am: 'ጫን' },
  'settings.appearance': { en: 'Appearance', am: 'መልክ' },
  'settings.theme': { en: 'Theme', am: 'ገጽታ' },
  'settings.theme.dark': { en: 'Dark', am: 'ጨለማ' },
  'settings.theme.dim': { en: 'Dim', am: 'ደብዛዛ' },
  'settings.theme.light': { en: 'Light', am: 'ብሩህ' },
  'settings.playback': { en: 'Playback', am: 'ማጫወት' },
  'settings.autoplayNext': { en: 'Autoplay next channel', am: 'ቀጣዩን ቻናል አሂድ' },
  'settings.dataSaver': { en: 'Data saver (prefer lower quality)', am: 'ዳታ ቆጣቢ' },
  'settings.defaultQuality': { en: 'Default quality', am: 'ነባሪ ጥራት' },
  'settings.quality.auto': { en: 'Auto (best available)', am: 'ራስሰር' },
  'settings.quality.hd': { en: 'HD', am: 'HD' },
  'settings.quality.sd': { en: 'SD (data saver)', am: 'SD (ዳታ ቆጣቢ)' },
  'settings.region': { en: 'Region', am: 'ክልል' },
  'settings.defaultCountry': { en: 'Default country', am: 'ነባሪ ሀገር' },
  'settings.playlists': { en: 'My Playlists', am: 'የእኔ ዝርዝሮች' },
  'settings.addPlaylist': { en: 'Add playlist', am: 'ዝርዝር ጨምር' },
  'settings.data': { en: 'Data', am: 'ዳታ' },
  'settings.clearFavorites': { en: 'Clear favorites', am: 'ተወዳጆችን አጽዳ' },
  'settings.clearRecents': { en: 'Clear recently watched', am: 'ቅርብ ጊዜ የታዩትን አጽዳ' },
  'settings.clearPlaylists': { en: 'Clear all playlists', am: 'ሁሉም ዝርዝሮችን አጽዳ' },
  'settings.language': { en: 'Language', am: 'ቋንቋ' },
  'settings.about': { en: 'About', am: 'ስለ' },
  'guide.title': { en: 'TV Guide', am: 'የቴሌቪዥን መመሪያ' },
  'guide.nowLine': { en: 'Now', am: 'አሁን' },
  'guide.noSchedule': { en: 'No schedule available', am: 'ሰሌዳ የለም' },
  'guide.watch': { en: 'Watch', am: 'ተመልከት' },
  'browse.title': { en: 'Browse', am: 'ፈልግ' },
  'browse.categories': { en: 'Categories', am: 'ምድቦች' },
  'browse.countries': { en: 'Countries', am: 'ሀገሮች' },
  'reminders.remind': { en: 'Remind me', am: ' አስታውሰኝ' },
  'reminders.set': { en: 'Reminder set', am: 'ማሳወቂያ ተቀናብሯል' },
  'share.share': { en: 'Share', am: 'አጋራ' },
  'share.copied': { en: 'Copied!', am: 'ተቀድቷል!' },
  'multi.title': { en: 'Multi-view', am: 'ብዙ ዕይታ' },
  'multi.addChannel': { en: 'Add channel', am: 'ቻናል ጨምር' },
  'channel.favorite': { en: 'Favorite', am: 'ተወዳጅ' },
  'channel.unfavorite': { en: 'Remove from favorites', am: 'ከተወዳጆች አስወግድ' },
  'channel.channels': { en: 'channels', am: 'ቻናሎች' },
}

export const locale = writable<Locale>('en')

export function t(key: string, loc?: Locale): string {
  const entry = dict[key]
  if (!entry) return key
  return entry[loc ?? 'en'] ?? entry['en'] ?? key
}

export function getLocaleCookie(cookieHeader: string | null): Locale {
  const match = cookieHeader?.match(/dtv_locale=([^;]+)/)
  const val = match?.[1]
  return val === 'am' ? 'am' : 'en'
}

export function setLocaleCookie(loc: Locale): void {
  document.cookie = `dtv_locale=${loc}; path=/; max-age=31536000`
}
