<script lang="ts">
  import Sidebar from './Sidebar.svelte';
  import Topbar from './Topbar.svelte';

  let { children } = $props();
</script>

<div class="app-shell">
  <Sidebar />

  <div class="main">
    <Topbar />
    <main>
      {@render children()}
    </main>
  </div>
</div>

<style>
  .app-shell {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 260px 1fr;
  }

  .main {
    min-width: 0;
  }

  main {
    padding: 1.5rem;
  }

  @media (max-width: 900px) {
    .app-shell {
      grid-template-columns: 1fr;
    }
  }
</style>
