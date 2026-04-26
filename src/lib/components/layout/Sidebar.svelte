<script lang="ts">
  import { currentUser } from '$services/auth/auth.store';
</script>

<nav class="sidebar">
  <h1>Logarys</h1>

  <a href="/">Dashboard</a>
  <a href="/logs">Logs</a>
  {#if $currentUser?.isAdmin}
    <a href="/pipelines">Pipelines</a>
    <a href="/admin/users">Users</a>
    <a href="/config">Config</a>
  {/if}
  <a href="/profile">Profile</a>
</nav>

<style>
  .sidebar {
    min-height: 100vh;
    padding: 1.25rem;
    background: #020617;
    border-right: 1px solid var(--color-border);
  }

  h1 {
    margin: 0 0 2rem;
    font-size: 1.4rem;
  }

  a {
    display: block;
    padding: 0.75rem 0.9rem;
    border-radius: var(--radius-md);
    color: var(--color-muted);
  }

  a:hover {
    background: var(--color-panel);
    color: var(--color-text);
  }

  @media (max-width: 900px) {
    .sidebar {
      min-height: auto;
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
    }

    h1 {
      display: none;
    }
  }
</style>
