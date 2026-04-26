<script lang="ts">
  import type { PipelineInputType, PipelineSearchParams } from '$entities/pipeline-config';

  let { onSearch, disabled = false } = $props<{
    onSearch: (params: PipelineSearchParams) => Promise<void> | void;
    disabled?: boolean;
  }>();

  let query = $state('');
  let inputType = $state<PipelineInputType | ''>('');
  let enabled = $state<'true' | 'false' | ''>('');

  async function search(): Promise<void> {
    await onSearch({
      query: query.trim() || undefined,
      inputType,
      enabled
    });
  }

  async function reset(): Promise<void> {
    query = '';
    inputType = '';
    enabled = '';
    await search();
  }
</script>

<form class="card filters" onsubmit={(event) => { event.preventDefault(); void search(); }}>
  <input class="input" bind:value={query} placeholder="Search pipeline name" disabled={disabled} />

  <select class="input" bind:value={inputType} disabled={disabled}>
    <option value="">All inputs</option>
    <option value="http">HTTP</option>
    <option value="syslog">Syslog</option>
    <option value="file">File</option>
    <option value="nats">NATS</option>
  </select>

  <select class="input" bind:value={enabled} disabled={disabled}>
    <option value="">All status</option>
    <option value="true">Enabled</option>
    <option value="false">Disabled</option>
  </select>

  <button class="btn" type="submit" disabled={disabled}>Search</button>
  <button class="btn secondary" type="button" onclick={() => void reset()} disabled={disabled}>Reset</button>
</form>

<style>
  .filters {
    display: grid;
    grid-template-columns: minmax(240px, 1fr) 160px 160px auto auto;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .secondary {
    background: var(--color-panel-light);
    color: var(--color-text);
  }

  button:disabled,
  input:disabled,
  select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 1000px) {
    .filters {
      grid-template-columns: 1fr;
    }
  }
</style>
