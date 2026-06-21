<script lang="ts">
type Props = {
	message: string;
	sub?: string | null;
};

let { message, sub = null }: Props = $props();
</script>

<div class="empty">
	<p class="message">{message}</p>
	{#if sub}
		<p class="sub">{sub}</p>
	{/if}
</div>

<style>
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 80px 24px;
		gap: 10px;
		text-align: center;
	}

	.message {
		font-size: clamp(1.25rem, 3vw, 1.75rem);
		font-weight: 900;
		letter-spacing: -0.02em;
		color: var(--color-text-dim);
		line-height: 1.2;
		margin: 0;
	}

	.sub {
		font-size: 14px;
		color: var(--color-text-muted);
		line-height: 1.5;
		margin: 0;
		max-width: 320px;
	}
</style>
