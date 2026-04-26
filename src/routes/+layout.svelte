<script lang="ts">
  import '$lib/styles/general.css';
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import AppShell from '$components/layout/AppShell.svelte';
  import { currentUser, getToken } from '$services/auth/auth.store';

  let { children } = $props();
  let ready = $state(false);
  let isLoginRoute = $derived(page.url.pathname === '/login');

  onMount(() => {
    ready = true;

    if (!getToken() && !isLoginRoute) {
      window.location.href = '/login';
      return;
    }

    if (getToken() && isLoginRoute && $currentUser) {
      window.location.href = '/';
    }
  });
</script>

{#if !browser || !ready}
  <main class="boot-screen">Loading...</main>
{:else if isLoginRoute}
  {@render children()}
{:else}
  <AppShell>
    {@render children()}
  </AppShell>
{/if}

<style>
  .boot-screen {
    min-height: 100vh;
    display: grid;
    place-items: center;
    color: var(--color-muted);
  }
</style>
