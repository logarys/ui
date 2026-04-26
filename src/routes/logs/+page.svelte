<script lang="ts">
  import { onMount } from 'svelte';
  import { logsApi, pipelineApi } from '$lib/container';
  import type { LogEntry, LogSearchParams } from '$entities/log-entry';
  import type { PipelineConfig } from '$entities/pipeline-config';
  import LogFilters from '$components/logs/LogFilters.svelte';
  import LogsTable from '$components/logs/LogsTable.svelte';
  import ErrorMessage from '$components/common/ErrorMessage.svelte';
  import { toUiError, type UiErrorMessage } from '$services/api/api-error';

  let logs = $state<LogEntry[]>([]);
  let pipelines = $state<PipelineConfig[]>([]);
  let loading = $state(true);
  let loadingPipelines = $state(true);
  let error = $state<UiErrorMessage | null>(null);
  let currentSearch = $state<LogSearchParams>({ limit: 100 });

  onMount(() => {
    void loadPipelines();
    void searchLogs(currentSearch);
  });

  async function loadPipelines(): Promise<void> {
    loadingPipelines = true;

    try {
      pipelines = await pipelineApi.list();
    } catch {
      pipelines = [];
    } finally {
      loadingPipelines = false;
    }
  }

  async function searchLogs(filters: LogSearchParams): Promise<void> {
    loading = true;
    error = null;
    currentSearch = filters;

    try {
      logs = await logsApi.search(filters);
    } catch (e) {
      error = toUiError(e, 'Unable to load logs');
    } finally {
      loading = false;
    }
  }
</script>

<section>
  <header class="page-header">
    <div>
      <h2 class="page-title">Logs</h2>
      <p class="muted">Search logs by text, pipeline and level.</p>
    </div>
  </header>

  <LogFilters
    onSearch={searchLogs}
    {pipelines}
    disabled={loading || loadingPipelines}
  />

  {#if error}
    <ErrorMessage {error} />
  {/if}

  {#if loading}
    <div class="card muted">Loading logs...</div>
  {:else}
    <LogsTable {logs} />
  {/if}
</section>

<style>
  .page-header {
    margin-bottom: 1rem;
  }
</style>
