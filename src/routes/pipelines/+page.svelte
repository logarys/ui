<script lang="ts">
  import { onMount } from 'svelte';
  import { pipelineApi } from '$lib/container';
  import type {
    PipelineConfig,
    PipelineSavePayload,
    PipelineSearchParams
  } from '$entities/pipeline-config';
  import PipelineForm from '$components/pipelines/PipelineForm.svelte';
  import PipelineList from '$components/pipelines/PipelineList.svelte';
  import PipelineSearch from '$components/pipelines/PipelineSearch.svelte';
  import ErrorMessage from '$components/common/ErrorMessage.svelte';
  import { toUiError, type UiErrorMessage } from '$services/api/api-error';

  let pipelines = $state<PipelineConfig[]>([]);
  let selectedPipeline = $state<PipelineConfig | null>(null);
  let error = $state<UiErrorMessage | null>(null);
  let success = $state<string | null>(null);
  let loading = $state(true);
  let currentSearch = $state<PipelineSearchParams>({});

  onMount(() => {
    void searchPipelines({});
  });

  async function searchPipelines(params: PipelineSearchParams = currentSearch): Promise<void> {
    loading = true;
    error = null;
    success = null;
    currentSearch = params;

    try {
      pipelines = await pipelineApi.search(params);
    } catch (e) {
      error = toUiError(e, 'Unable to load pipelines');
    } finally {
      loading = false;
    }
  }

  async function savePipeline(
    payload: PipelineSavePayload,
    existingPipeline: PipelineConfig | null
  ): Promise<void> {
    error = null;
    success = null;

    try {
      if (existingPipeline) {
        const id = getPipelineIdentifier(existingPipeline);
        const saved = await pipelineApi.update(id, payload);
        success = `Pipeline "${saved.name}" updated.`;
        selectedPipeline = null;
      } else {
        const saved = await pipelineApi.create(payload);
        success = `Pipeline "${saved.name}" created.`;
      }

      await searchPipelines(currentSearch);
    } catch (e) {
      error = toUiError(e, existingPipeline ? 'Unable to update pipeline' : 'Unable to create pipeline');
    }
  }

  async function editPipeline(pipeline: PipelineConfig): Promise<void> {
    error = null;
    success = null;

    try {
      selectedPipeline = await pipelineApi.get(getPipelineIdentifier(pipeline));
    } catch {
      selectedPipeline = pipeline;
    }
  }

  function cancelEdit(): void {
    selectedPipeline = null;
  }

  function getPipelineIdentifier(pipeline: PipelineConfig): string {
    return String(pipeline.id ?? pipeline.name);
  }
</script>

<section>
  <header class="page-header">
    <div>
      <h2 class="page-title">Pipelines</h2>
      <p class="muted">Create, edit and search ingestion pipeline configurations.</p>
    </div>
  </header>

  {#if error}
    <ErrorMessage {error} />
  {/if}

  {#if success}
    <div class="card success">{success}</div>
  {/if}

  <PipelineSearch onSearch={searchPipelines} disabled={loading} />

  <div class="grid">
    <PipelineForm selectedPipeline={selectedPipeline} onSave={savePipeline} onCancel={cancelEdit} />

    <div>
      {#if loading}
        <div class="card muted">Loading pipelines...</div>
      {:else}
        <PipelineList {pipelines} onEdit={(pipeline) => void editPipeline(pipeline)} />
      {/if}
    </div>
  </div>
</section>

<style>
  .grid {
    display: grid;
    grid-template-columns: minmax(420px, 520px) 1fr;
    gap: 1rem;
    align-items: start;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .success {
    margin-bottom: 1rem;
    color: var(--color-success);
  }

  @media (max-width: 1200px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
