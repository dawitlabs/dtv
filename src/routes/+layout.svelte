<script lang="ts">
import '../app.css';

let { children } = $props();
</script>

<svelte:head>
  <title>dtv</title>
  <meta name="description" content="Live TV from everywhere" />
  <meta name="theme-color" content="#0a0a0a" />
  <link rel="manifest" href="/manifest.webmanifest" />
</svelte:head>

{@render children()}
