<script lang="ts">
  import '$lib/styles/general.css';
  import AppShell from '$components/layout/AppShell.svelte';

  let { children } = $props();
</script>

<AppShell>
  {@render children()}
</AppShell>
