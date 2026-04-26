<script lang="ts">
  import type { LogLevel, LogSearchParams } from '$entities/log-entry';
  import type { PipelineConfig } from '$entities/pipeline-config';

  let { onSearch, pipelines = [], disabled = false } = $props<{
    onSearch: (filters: LogSearchParams) => Promise<void> | void;
    pipelines?: PipelineConfig[];
    disabled?: boolean;
  }>();

  let query = $state('');
  let pipelineId = $state('');
  let level = $state<LogLevel | ''>('');
  let limit = $state(100);

  async function search(): Promise<void> {
    await onSearch({
      query: query.trim() || undefined,
      pipelineId: pipelineId || undefined,
      level,
      limit
    });
  }

  async function reset(): Promise<void> {
    query = '';
    pipelineId = '';
    level = '';
    limit = 100;
    await search();
  }
</script>

<form class="card filters" onsubmit={(event) => { event.preventDefault(); void search(); }}>
  <input class="input" bind:value={query} placeholder="Search message or source" disabled={disabled} />

  <select class="input" bind:value={pipelineId} disabled={disabled}>
    <option value="">All pipelines</option>
    {#each pipelines as pipeline (pipeline.id ?? pipeline.name)}
      {#if pipeline.id}
        <option value={pipeline.id}>{pipeline.name}</option>
      {/if}
    {/each}
  </select>

  <select class="input" bind:value={level} disabled={disabled}>
    <option value="">All levels</option>
    <option value="debug">Debug</option>
    <option value="info">Info</option>
    <option value="warning">Warning</option>
    <option value="error">Error</option>
    <option value="critical">Critical</option>
  </select>

  <input class="input" type="number" min="1" max="1000" bind:value={limit} disabled={disabled} />

  <button class="btn" type="submit" disabled={disabled}>Search</button>
  <button class="btn secondary" type="button" onclick={() => void reset()} disabled={disabled}>Reset</button>
</form>

<style>
  .filters {
    display: grid;
    grid-template-columns: minmax(240px, 1fr) 200px 160px 110px auto auto;
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

  @media (max-width: 1100px) {
    .filters {
      grid-template-columns: 1fr;
    }
  }
</style>
