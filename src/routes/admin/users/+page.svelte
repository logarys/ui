<script lang="ts">
  import { onMount } from 'svelte';
  import { usersApi } from '$lib/container';
  import type { User } from '$services/api/users-api';
  import { currentUser } from '$services/auth/auth.store';
  import { toUiError, type UiErrorMessage } from '$services/api/api-error';
  import ErrorMessage from '$components/common/ErrorMessage.svelte';

  let users = $state<User[]>([]);
  let selectedUser = $state<User | null>(null);
  let name = $state('');
  let email = $state('');
  let password = $state('');
  let isAdmin = $state(false);
  let isEnabled = $state(true);
  let loading = $state(true);
  let saving = $state(false);
  let error = $state<UiErrorMessage | null>(null);
  let success = $state<string | null>(null);

  onMount(() => {
    if (!$currentUser?.isAdmin) {
      window.location.href = '/logs';
      return;
    }

    void loadUsers();
  });

  async function loadUsers(): Promise<void> {
    loading = true;
    error = null;

    try {
      users = await usersApi.list();
    } catch (e) {
      error = toUiError(e, 'Unable to load users');
    } finally {
      loading = false;
    }
  }

  function resetForm(): void {
    selectedUser = null;
    name = '';
    email = '';
    password = '';
    isAdmin = false;
    isEnabled = true;
  }

  function editUser(user: User): void {
    selectedUser = user;
    name = user.name;
    email = user.email;
    password = '';
    isAdmin = user.isAdmin;
    isEnabled = user.isEnabled;
    success = null;
    error = null;
  }

  async function saveUser(): Promise<void> {
    saving = true;
    success = null;
    error = null;

    try {
      if (selectedUser) {
        const saved = await usersApi.update(selectedUser.id, {
          name,
          email,
          isAdmin,
          isEnabled,
          ...(password ? { password } : {})
        });
        success = `User "${saved.email}" updated.`;
      } else {
        const saved = await usersApi.create({
          name,
          email,
          password,
          isAdmin,
          isEnabled
        });
        success = `User "${saved.email}" created.`;
      }

      resetForm();
      await loadUsers();
    } catch (e) {
      error = toUiError(e, selectedUser ? 'Unable to update user' : 'Unable to create user');
    } finally {
      saving = false;
    }
  }

  async function disableUser(user: User): Promise<void> {
    error = null;
    success = null;

    try {
      await usersApi.disable(user.id);
      success = `User "${user.email}" disabled.`;
      await loadUsers();
    } catch (e) {
      error = toUiError(e, 'Unable to disable user');
    }
  }
</script>

<section>
  <header class="page-header">
    <div>
      <h2 class="page-title">Users</h2>
      <p class="muted">Create, update and disable console users.</p>
    </div>
  </header>

  {#if error}
    <ErrorMessage {error} />
  {/if}

  {#if success}
    <div class="card success">{success}</div>
  {/if}

  <div class="grid">
    <form class="card form" onsubmit={(event) => { event.preventDefault(); void saveUser(); }}>
      <h3>{selectedUser ? 'Edit user' : 'Create user'}</h3>

      <label>
        Name
        <input class="input" bind:value={name} required />
      </label>

      <label>
        Email
        <input class="input" type="email" bind:value={email} required />
      </label>

      <label>
        Password
        <input class="input" type="password" bind:value={password} minlength="8" required={!selectedUser} placeholder={selectedUser ? 'Leave empty to keep current password' : ''} />
      </label>

      <label class="checkbox">
        <input type="checkbox" bind:checked={isAdmin} />
        Admin user
      </label>

      <label class="checkbox">
        <input type="checkbox" bind:checked={isEnabled} />
        Enabled
      </label>

      <div class="actions">
        <button class="btn" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save user'}</button>
        {#if selectedUser}
          <button class="btn secondary" type="button" onclick={resetForm}>Cancel</button>
        {/if}
      </div>
    </form>

    <div class="card table-wrapper">
      {#if loading}
        <p class="muted">Loading users...</p>
      {:else}
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Admin</th>
              <th>Enabled</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each users as user}
              <tr>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.isAdmin ? 'yes' : 'no'}</td>
                <td>{user.isEnabled ? 'yes' : 'no'}</td>
                <td class="row-actions">
                  <button class="btn secondary" type="button" onclick={() => editUser(user)}>Edit</button>
                  {#if user.isEnabled}
                    <button class="btn danger" type="button" onclick={() => void disableUser(user)}>Disable</button>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  </div>
</section>

<style>
  .page-header {
    margin-bottom: 1rem;
  }

  .grid {
    display: grid;
    grid-template-columns: minmax(320px, 420px) 1fr;
    gap: 1rem;
    align-items: start;
  }

  .form {
    display: grid;
    gap: 1rem;
  }

  h3 {
    margin: 0;
  }

  label {
    display: grid;
    gap: 0.4rem;
    color: var(--color-muted);
  }

  .checkbox {
    display: flex;
    align-items: center;
  }

  .actions,
  .row-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .success {
    margin-bottom: 1rem;
    color: var(--color-success);
  }

  .danger {
    background: var(--color-danger);
    color: white;
  }

  @media (max-width: 1100px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
