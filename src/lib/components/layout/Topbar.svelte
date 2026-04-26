<script lang="ts">
  import { currentUser, logout } from '$services/auth/auth.store';

  function signOut(): void {
    logout();
    window.location.href = '/login';
  }
</script>

<header class="topbar">
  <div>
    <strong>Log console</strong>
    <span>Realtime logs and pipeline management</span>
  </div>

  <div class="user-area">
    {#if $currentUser}
      <span>{$currentUser.name} · {$currentUser.isAdmin ? 'admin' : 'user'}</span>
      <button class="btn secondary" type="button" onclick={signOut}>Logout</button>
    {/if}
  </div>
</header>

<style>
  .topbar {
    height: 64px;
    padding: 0 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-panel);
  }

  div {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  span {
    color: var(--color-muted);
    font-size: 0.9rem;
  }

  .user-area {
    align-items: flex-end;
  }

  .user-area .btn {
    padding: 0.45rem 0.75rem;
  }
</style>
