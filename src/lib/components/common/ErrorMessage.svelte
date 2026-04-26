<script lang="ts">
  import type { UiErrorMessage } from '$services/api/api-error';

  let { error } = $props<{
    error: UiErrorMessage;
  }>();
</script>

<div class="card error-card" role="alert" aria-live="polite">
  <div class="field">
    <span class="label">Message</span>
    <strong>{error.message}</strong>
  </div>

  {#if error.detail}
    <div class="field">
      <span class="label">Detail</span>
      <span>{error.detail}</span>
    </div>
  {/if}

  {#if error.query}
    <div class="field">
      <span class="label">Query</span>
      <code>{error.query}</code>
    </div>
  {/if}
</div>

<style>
  .error-card {
    display: grid;
    gap: 0.65rem;
    margin-bottom: 1rem;
    color: var(--color-danger);
  }

  .field {
    display: grid;
    gap: 0.25rem;
  }

  .label {
    color: var(--color-muted);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  strong,
  span,
  code {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  code {
    color: var(--color-text);
  }
</style>
