<script lang="ts">
  import { authApi } from '$lib/container';
  import { saveAuth } from '$services/auth/auth.store';
  import { toUiError, type UiErrorMessage } from '$services/api/api-error';
  import ErrorMessage from '$components/common/ErrorMessage.svelte';

  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let error = $state<UiErrorMessage | null>(null);

  async function submit(): Promise<void> {
    loading = true;
    error = null;

    try {
      const response = await authApi.login(email, password);
      saveAuth(response.accessToken, response.user);
      window.location.href = response.user.isAdmin ? '/admin/users' : '/logs';
    } catch (e) {
      error = toUiError(e, 'Invalid credentials');
    } finally {
      loading = false;
    }
  }
</script>

<main class="login-page">
  <form class="card login-card" onsubmit={(event) => { event.preventDefault(); void submit(); }}>
    <h1><img id="logo" src="/logo/logo.svg" alt="logarys"> <div>Logarys</div></h1>
    <p class="muted">Sign in to the console manager.</p>

    {#if error}
      <ErrorMessage {error} />
    {/if}

    <label>
      Email
      <input class="input" type="email" bind:value={email} autocomplete="email" required />
    </label>

    <label>
      Password
      <input class="input" type="password" bind:value={password} autocomplete="current-password" required />
    </label>

    <button class="btn" type="submit" disabled={loading}>
      {loading ? 'Signing in...' : 'Login'}
    </button>
  </form>
</main>

<style>
  .login-page {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 1.5rem;
  }

  .login-card {
    width: min(100%, 420px);
    display: grid;
    gap: 1rem;
  }

  h1,
  p {
    margin: 0;
  }

  h1 {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    margin: 0 0 2rem;
    font-size: 2rem;

    div {
      margin: 0 25px;
    }
  }


  #logo {
    width: 3em;
    height: 3em;
  }

  label {
    display: grid;
    gap: 0.4rem;
    color: var(--color-muted);
  }
</style>
