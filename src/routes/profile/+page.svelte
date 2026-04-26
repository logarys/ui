<script lang="ts">
  import { onMount } from 'svelte';
  import { usersApi } from '$lib/container';
  import { updateCurrentUser } from '$services/auth/auth.store';
  import { toUiError, type UiErrorMessage } from '$services/api/api-error';
  import ErrorMessage from '$components/common/ErrorMessage.svelte';

  let name = $state('');
  let email = $state('');
  let password = $state('');
  let loading = $state(true);
  let saving = $state(false);
  let success = $state<string | null>(null);
  let error = $state<UiErrorMessage | null>(null);

  onMount(() => {
    void loadProfile();
  });

  async function loadProfile(): Promise<void> {
    loading = true;
    error = null;

    try {
      const user = await usersApi.me();
      name = user.name;
      email = user.email;
      updateCurrentUser(user);
    } catch (e) {
      error = toUiError(e, 'Unable to load profile');
    } finally {
      loading = false;
    }
  }

  async function saveProfile(): Promise<void> {
    saving = true;
    success = null;
    error = null;

    try {
      const user = await usersApi.updateMe({
        name,
        email,
        ...(password ? { password } : {})
      });
      password = '';
      success = 'Profile updated.';
      updateCurrentUser(user);
    } catch (e) {
      error = toUiError(e, 'Unable to update profile');
    } finally {
      saving = false;
    }
  }
</script>

<section>
  <h2 class="page-title">Profile</h2>

  {#if error}
    <ErrorMessage {error} />
  {/if}

  {#if success}
    <div class="card success">{success}</div>
  {/if}

  {#if loading}
    <div class="card muted">Loading profile...</div>
  {:else}
    <form class="card form" onsubmit={(event) => { event.preventDefault(); void saveProfile(); }}>
      <label>
        Name
        <input class="input" bind:value={name} required />
      </label>

      <label>
        Email
        <input class="input" type="email" bind:value={email} required />
      </label>

      <label>
        New password
        <input class="input" type="password" bind:value={password} minlength="8" placeholder="Leave empty to keep current password" />
      </label>

      <button class="btn" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</button>
    </form>
  {/if}
</section>

<style>
  .form {
    max-width: 720px;
    display: grid;
    gap: 1rem;
  }

  label {
    display: grid;
    gap: 0.4rem;
    color: var(--color-muted);
  }

  .success {
    margin-bottom: 1rem;
    color: var(--color-success);
  }
</style>
