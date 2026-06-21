<script lang="ts">
import { onMount } from 'svelte';
import { library } from '$lib/state/library.svelte.js';
import { playlists } from '$lib/state/playlists.svelte.js';
import { settings } from '$lib/state/settings.svelte.js';

let m3uUrl = $state('');
let m3uLoading = $state(false);
let m3uError = $state('');

let xtreamOpen = $state(false);
let xtreamHost = $state('');
let xtreamUser = $state('');
let xtreamPass = $state('');
let xtreamLoading = $state(false);
let xtreamError = $state('');

async function addM3u() {
	const url = m3uUrl.trim();
	if (!url) return;
	m3uLoading = true;
	m3uError = '';
	try {
		const res = await fetch('/api/playlist', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ url }),
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({ error: 'Request failed' }));
			m3uError = (err as { error?: string }).error ?? 'Request failed';
			return;
		}
		const result = await res.json() as { name: string; channels: import('$lib/types.js').Channel[] };
		playlists.add({
			id: crypto.randomUUID(),
			name: result.name,
			url,
			channels: result.channels,
			addedAt: Date.now(),
		});
		m3uUrl = '';
	} catch {
		m3uError = 'Network error. Check the URL and try again.';
	} finally {
		m3uLoading = false;
	}
}

async function addXtream() {
	const host = xtreamHost.trim();
	const username = xtreamUser.trim();
	const password = xtreamPass.trim();
	if (!host || !username || !password) return;
	xtreamLoading = true;
	xtreamError = '';
	try {
		const res = await fetch('/api/playlist', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ host, username, password }),
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({ error: 'Request failed' }));
			xtreamError = (err as { error?: string }).error ?? 'Request failed';
			return;
		}
		const result = await res.json() as { name: string; channels: import('$lib/types.js').Channel[] };
		playlists.add({
			id: crypto.randomUUID(),
			name: result.name,
			url: host,
			channels: result.channels,
			addedAt: Date.now(),
		});
		xtreamHost = '';
		xtreamUser = '';
		xtreamPass = '';
		xtreamOpen = false;
	} catch {
		xtreamError = 'Network error. Check your credentials and try again.';
	} finally {
		xtreamLoading = false;
	}
}

function clearData() {
	library.favorites = new Set();
	library.recents = [];
	localStorage.removeItem('dtv_favorites');
	localStorage.removeItem('dtv_recents');
}

function clearPlaylists() {
	playlists.items = [];
	localStorage.removeItem('dtv_playlists');
}

onMount(() => {
	settings.init();
	library.init();
	playlists.init();
});
</script>

<div class="bg-mesh" style="min-height: 100vh;">
	<header class="glass-header sticky top-0 z-30" style="padding: 12px 16px;">
		<div style="max-width: 600px; margin: 0 auto; display: flex; align-items: center; gap: 16px;">
			<a
				href="/"
				style="color: var(--color-text-muted); text-decoration: none; font-size: 13px; font-weight: 600; letter-spacing: 0.04em; display: flex; align-items: center; gap: 6px; transition: color 0.15s;"
				onmouseenter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
				onmouseleave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
			>
				← dtv
			</a>
			<h1 style="margin: 0; font-size: clamp(1.1rem, 3vw, 1.4rem); font-weight: 900; letter-spacing: -0.03em; color: var(--color-text);">
				Settings
			</h1>
		</div>
	</header>

	<div style="max-width: 600px; margin: 0 auto; padding: 40px 16px 80px;">

		<!-- APPEARANCE -->
		<section style="margin-bottom: 48px;">
			<h2 style="margin: 0 0 20px; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-text-dim);">
				Appearance
			</h2>

			<div style="margin-bottom: 24px;">
				<p style="margin: 0 0 10px; font-size: 13px; color: var(--color-text-muted); font-weight: 600;">Theme</p>
				<div style="display: flex; gap: 8px;">
					{#each (['dark', 'dim', 'light'] as const) as theme}
						<button
							onclick={() => settings.update({ theme })}
							style="padding: 7px 18px; border-radius: 6px; border: 1px solid {settings.settings.theme === theme ? 'var(--color-text-muted)' : 'var(--color-border)'}; background: {settings.settings.theme === theme ? 'var(--color-surface-raised)' : 'transparent'}; color: {settings.settings.theme === theme ? 'var(--color-text)' : 'var(--color-text-muted)'}; font-family: var(--font-sans); font-size: 13px; font-weight: {settings.settings.theme === theme ? '700' : '500'}; cursor: pointer; transition: border-color 0.15s, color 0.15s, background 0.15s; text-transform: capitalize;"
						>
							{theme === 'dark' ? 'Dark' : theme === 'dim' ? 'Dim' : 'Light'}
						</button>
					{/each}
				</div>
			</div>

			<div>
				<p style="margin: 0 0 10px; font-size: 13px; color: var(--color-text-muted); font-weight: 600;">Language</p>
				<div style="display: flex; gap: 8px;">
					{#each ([{ value: 'en', label: 'English' }, { value: 'am', label: 'አማርኛ' }] as const) as opt}
						<button
							onclick={() => settings.update({ locale: opt.value })}
							style="padding: 7px 18px; border-radius: 6px; border: 1px solid {settings.settings.locale === opt.value ? 'var(--color-text-muted)' : 'var(--color-border)'}; background: {settings.settings.locale === opt.value ? 'var(--color-surface-raised)' : 'transparent'}; color: {settings.settings.locale === opt.value ? 'var(--color-text)' : 'var(--color-text-muted)'}; font-family: var(--font-sans); font-size: 13px; font-weight: {settings.settings.locale === opt.value ? '700' : '500'}; cursor: pointer; transition: border-color 0.15s, color 0.15s, background 0.15s;"
						>
							{opt.label}
						</button>
					{/each}
				</div>
			</div>
		</section>

		<!-- PLAYBACK -->
		<section style="margin-bottom: 48px;">
			<h2 style="margin: 0 0 20px; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-text-dim);">
				Playback
			</h2>

			<label style="display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--color-border); cursor: pointer;">
				<div>
					<p style="margin: 0; font-size: 14px; font-weight: 600; color: var(--color-text);">Autoplay next channel</p>
					<p style="margin: 4px 0 0; font-size: 12px; color: var(--color-text-dim);">Automatically advance to the next channel when one ends</p>
				</div>
				<input
					type="checkbox"
					checked={settings.settings.autoplayNext}
					onchange={(e) => settings.update({ autoplayNext: e.currentTarget.checked })}
					style="width: 18px; height: 18px; accent-color: var(--color-text); cursor: pointer; flex-shrink: 0; margin-left: 16px;"
				/>
			</label>

			<label style="display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--color-border); cursor: pointer;">
				<div>
					<p style="margin: 0; font-size: 14px; font-weight: 600; color: var(--color-text);">Data saver</p>
					<p style="margin: 4px 0 0; font-size: 12px; color: var(--color-text-dim);">Prefer lower quality streams to reduce data usage</p>
				</div>
				<input
					type="checkbox"
					checked={settings.settings.dataSaver}
					onchange={(e) => settings.update({ dataSaver: e.currentTarget.checked })}
					style="width: 18px; height: 18px; accent-color: var(--color-text); cursor: pointer; flex-shrink: 0; margin-left: 16px;"
				/>
			</label>

			<div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 0;">
				<div>
					<p style="margin: 0; font-size: 14px; font-weight: 600; color: var(--color-text);">Default quality</p>
					<p style="margin: 4px 0 0; font-size: 12px; color: var(--color-text-dim);">Preferred stream quality when multiple are available</p>
				</div>
				<select
					value={settings.settings.defaultQuality}
					onchange={(e) => settings.update({ defaultQuality: e.currentTarget.value as 'auto' | 'hd' | 'sd' })}
					style="background: var(--color-surface-raised); color: var(--color-text); border: 1px solid var(--color-border); border-radius: 6px; padding: 7px 12px; font-family: var(--font-sans); font-size: 13px; font-weight: 600; cursor: pointer; flex-shrink: 0; margin-left: 16px;"
				>
					<option value="auto">Auto</option>
					<option value="hd">HD</option>
					<option value="sd">SD</option>
				</select>
			</div>
		</section>

		<!-- PLAYLISTS -->
		<section style="margin-bottom: 48px;">
			<h2 style="margin: 0 0 20px; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-text-dim);">
				My Playlists
			</h2>

			{#if playlists.items.length === 0}
				<p style="margin: 0 0 24px; font-size: 13px; color: var(--color-text-dim); line-height: 1.6;">
					Paste your own provider's M3U or Xtream URL to add channels.
				</p>
			{:else}
				<div style="margin-bottom: 24px; display: flex; flex-direction: column; gap: 1px; border: 1px solid var(--color-border); border-radius: 8px; overflow: hidden;">
					{#each playlists.items as pl (pl.id)}
						<div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: var(--color-surface);">
							<div>
								<p style="margin: 0; font-size: 14px; font-weight: 700; color: var(--color-text);">{pl.name}</p>
								<p style="margin: 3px 0 0; font-size: 12px; color: var(--color-text-dim);">{pl.channels.length} channels</p>
							</div>
							<button
								onclick={() => playlists.remove(pl.id)}
								style="padding: 5px 12px; border-radius: 5px; border: 1px solid var(--color-border); background: transparent; color: var(--color-text-muted); font-family: var(--font-sans); font-size: 12px; font-weight: 600; cursor: pointer; transition: color 0.15s, border-color 0.15s;"
								onmouseenter={(e) => { e.currentTarget.style.color = 'var(--color-live)'; e.currentTarget.style.borderColor = 'var(--color-live)'; }}
								onmouseleave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
							>
								Remove
							</button>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Add M3U form -->
			<div style="margin-bottom: 16px;">
				<p style="margin: 0 0 10px; font-size: 13px; font-weight: 600; color: var(--color-text-muted);">Add M3U playlist</p>
				<form
					onsubmit={(e) => { e.preventDefault(); addM3u(); }}
					style="display: flex; gap: 8px;"
				>
					<input
						type="url"
						bind:value={m3uUrl}
						placeholder="https://example.com/playlist.m3u"
						disabled={m3uLoading}
						style="flex: 1; background: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-border); border-radius: 6px; padding: 9px 12px; font-family: var(--font-sans); font-size: 13px; outline: none; transition: border-color 0.15s;"
						onfocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-text-muted)')}
						onblur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
					/>
					<button
						type="submit"
						disabled={m3uLoading || !m3uUrl.trim()}
						style="padding: 9px 18px; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-surface-raised); color: var(--color-text); font-family: var(--font-sans); font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; opacity: {m3uLoading || !m3uUrl.trim() ? '0.4' : '1'}; transition: opacity 0.15s;"
					>
						{m3uLoading ? 'Adding…' : 'Add'}
					</button>
				</form>
				{#if m3uError}
					<p style="margin: 8px 0 0; font-size: 12px; color: var(--color-live);">{m3uError}</p>
				{/if}
			</div>

			<!-- Add Xtream (collapsible) -->
			<div>
				<button
					onclick={() => (xtreamOpen = !xtreamOpen)}
					style="display: flex; align-items: center; gap: 6px; background: none; border: none; padding: 0; font-family: var(--font-sans); font-size: 13px; font-weight: 600; color: var(--color-text-muted); cursor: pointer; transition: color 0.15s;"
					onmouseenter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
					onmouseleave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
				>
					<span style="display: inline-block; transition: transform 0.2s; transform: rotate({xtreamOpen ? '90deg' : '0deg'});">›</span>
					Add Xtream
				</button>

				{#if xtreamOpen}
					<form
						onsubmit={(e) => { e.preventDefault(); addXtream(); }}
						style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px; padding: 16px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-surface);"
					>
						<input
							type="text"
							bind:value={xtreamHost}
							placeholder="Host (http://provider.com)"
							disabled={xtreamLoading}
							style="background: var(--color-surface-raised); color: var(--color-text); border: 1px solid var(--color-border); border-radius: 6px; padding: 9px 12px; font-family: var(--font-sans); font-size: 13px; outline: none; transition: border-color 0.15s;"
							onfocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-text-muted)')}
							onblur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
						/>
						<input
							type="text"
							bind:value={xtreamUser}
							placeholder="Username"
							disabled={xtreamLoading}
							style="background: var(--color-surface-raised); color: var(--color-text); border: 1px solid var(--color-border); border-radius: 6px; padding: 9px 12px; font-family: var(--font-sans); font-size: 13px; outline: none; transition: border-color 0.15s;"
							onfocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-text-muted)')}
							onblur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
						/>
						<input
							type="password"
							bind:value={xtreamPass}
							placeholder="Password"
							disabled={xtreamLoading}
							style="background: var(--color-surface-raised); color: var(--color-text); border: 1px solid var(--color-border); border-radius: 6px; padding: 9px 12px; font-family: var(--font-sans); font-size: 13px; outline: none; transition: border-color 0.15s;"
							onfocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-text-muted)')}
							onblur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
						/>
						{#if xtreamError}
							<p style="margin: 0; font-size: 12px; color: var(--color-live);">{xtreamError}</p>
						{/if}
						<button
							type="submit"
							disabled={xtreamLoading || !xtreamHost.trim() || !xtreamUser.trim() || !xtreamPass.trim()}
							style="align-self: flex-start; padding: 9px 18px; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-surface-raised); color: var(--color-text); font-family: var(--font-sans); font-size: 13px; font-weight: 700; cursor: pointer; opacity: {xtreamLoading || !xtreamHost.trim() || !xtreamUser.trim() || !xtreamPass.trim() ? '0.4' : '1'}; transition: opacity 0.15s;"
						>
							{xtreamLoading ? 'Connecting…' : 'Connect'}
						</button>
					</form>
				{/if}
			</div>
		</section>

		<!-- REGION -->
		<section style="margin-bottom: 48px;">
			<h2 style="margin: 0 0 20px; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-text-dim);">
				Region
			</h2>
			<div>
				<p style="margin: 0 0 10px; font-size: 13px; font-weight: 600; color: var(--color-text-muted);">Default country</p>
				<input
					type="text"
					value={settings.settings.defaultCountry}
					placeholder="US, ET, GB…"
					maxlength={2}
					oninput={(e) => settings.update({ defaultCountry: e.currentTarget.value.toUpperCase() })}
					style="width: 100px; background: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-border); border-radius: 6px; padding: 9px 12px; font-family: var(--font-sans); font-size: 13px; letter-spacing: 0.05em; outline: none; transition: border-color 0.15s; text-transform: uppercase;"
					onfocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-text-muted)')}
					onblur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
				/>
			</div>
		</section>

		<!-- DATA -->
		<section style="margin-bottom: 48px;">
			<h2 style="margin: 0 0 20px; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-text-dim);">
				Data
			</h2>
			<div style="display: flex; flex-direction: column; gap: 12px;">
				<div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--color-border);">
					<div>
						<p style="margin: 0; font-size: 14px; font-weight: 600; color: var(--color-text);">Clear favorites &amp; history</p>
						<p style="margin: 4px 0 0; font-size: 12px; color: var(--color-text-dim);">Removes all favorited channels and recently watched history</p>
					</div>
					<button
						onclick={clearData}
						style="padding: 7px 14px; border-radius: 6px; border: 1px solid var(--color-border); background: transparent; color: var(--color-text-muted); font-family: var(--font-sans); font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; margin-left: 16px; flex-shrink: 0; transition: color 0.15s, border-color 0.15s;"
						onmouseenter={(e) => { e.currentTarget.style.color = 'var(--color-live)'; e.currentTarget.style.borderColor = 'var(--color-live)'; }}
						onmouseleave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
					>
						Clear
					</button>
				</div>
				<div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 0;">
					<div>
						<p style="margin: 0; font-size: 14px; font-weight: 600; color: var(--color-text);">Clear playlists</p>
						<p style="margin: 4px 0 0; font-size: 12px; color: var(--color-text-dim);">Removes all custom M3U and Xtream playlists</p>
					</div>
					<button
						onclick={clearPlaylists}
						style="padding: 7px 14px; border-radius: 6px; border: 1px solid var(--color-border); background: transparent; color: var(--color-text-muted); font-family: var(--font-sans); font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; margin-left: 16px; flex-shrink: 0; transition: color 0.15s, border-color 0.15s;"
						onmouseenter={(e) => { e.currentTarget.style.color = 'var(--color-live)'; e.currentTarget.style.borderColor = 'var(--color-live)'; }}
						onmouseleave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
					>
						Clear
					</button>
				</div>
			</div>
		</section>

		<!-- ABOUT -->
		<section>
			<h2 style="margin: 0 0 20px; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-text-dim);">
				About
			</h2>
			<div style="display: flex; flex-direction: column; gap: 10px;">
				<div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--color-border);">
					<span style="font-size: 13px; color: var(--color-text-muted);">Version</span>
					<span style="font-size: 13px; font-weight: 700; color: var(--color-text);">1.0.0</span>
				</div>
				<div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--color-border);">
					<span style="font-size: 13px; color: var(--color-text-muted);">Channel data</span>
					<span style="font-size: 13px; font-weight: 600; color: var(--color-text);">iptv-org</span>
				</div>
				<div style="padding: 10px 0;">
					<p style="margin: 0; font-size: 12px; color: var(--color-text-dim); line-height: 1.6;">
						Streams are publicly available HTTPS-only streams sourced from the iptv-org community database. No piracy is facilitated.
					</p>
				</div>
			</div>
		</section>

	</div>
</div>
