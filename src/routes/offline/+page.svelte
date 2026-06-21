<div class="offline">
	<span class="wordmark">dtv</span>
	<p class="status">You're offline</p>
	<p class="detail">Connect to a network to watch live TV.</p>
	<button class="retry" onclick={() => window.location.reload()}>Try again</button>
</div>

<style>
	.offline {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		background: var(--color-background);
		padding: 24px;
		text-align: center;
	}

	.wordmark {
		font-size: clamp(3rem, 10vw, 6rem);
		font-weight: 900;
		letter-spacing: -0.04em;
		color: var(--color-text);
		font-family: var(--font-sans);
		line-height: 1;
		margin-bottom: 16px;
	}

	.status {
		font-size: 15px;
		font-weight: 600;
		color: var(--color-text-muted);
		margin: 0;
		font-family: var(--font-sans);
	}

	.detail {
		font-size: 13px;
		color: var(--color-text-dim);
		margin: 0 0 24px;
		font-family: var(--font-sans);
	}

	.retry {
		background: none;
		border: 1px solid var(--color-border);
		color: var(--color-text-muted);
		padding: 9px 20px;
		border-radius: 6px;
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0.04em;
		cursor: pointer;
		font-family: var(--font-sans);
		transition: color 0.15s, border-color 0.15s;
	}

	.retry:hover {
		color: var(--color-text);
		border-color: oklch(0.35 0 0);
	}
</style>
