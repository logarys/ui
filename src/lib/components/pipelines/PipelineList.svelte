<script lang="ts">
  import type { PipelineConfig } from '$entities/pipeline-config';

  let { pipelines = [], onEdit } = $props<{
    pipelines?: PipelineConfig[];
    onEdit?: (pipeline: PipelineConfig) => void;
  }>();

  function formatDate(date?: string): string {
    if (!date) {
      return '-';
    }

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(date));
  }

  function configValue(pipeline: PipelineConfig, key: string): string {
    const direct = pipeline[key];

    if (typeof direct === 'string' || typeof direct === 'number' || typeof direct === 'boolean') {
      return String(direct);
    }

    const config = pipeline.config;

    if (config && typeof config === 'object' && !Array.isArray(config)) {
      const value = config[key];

      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
      }
    }

    return '-';
  }

  function configSummary(pipeline: PipelineConfig): string {
    const config = pipeline.config;

    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      return '-';
    }

    const entries = Object.entries(config)
      .filter(([key]) => key !== 'source' && key !== 'format')
      .slice(0, 3)
      .map(([key, value]) => `${key}: ${formatValue(value)}`);

    return entries.length > 0 ? entries.join(', ') : '-';
  }

  function formatValue(value: unknown): string {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    return JSON.stringify(value);
  }
</script>

<div class="card table-wrapper">
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Input</th>
        <th>Source</th>
        <th>Format</th>
        <th>Status</th>
        <th>Config</th>
        <th>Updated</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#each pipelines as pipeline (pipeline.id ?? pipeline.name)}
        <tr>
          <td>
            <strong>{pipeline.name}</strong>
            {#if pipeline.description}
              <small>{pipeline.description}</small>
            {/if}
          </td>
          <td>{pipeline.inputType}</td>
          <td>{configValue(pipeline, 'source')}</td>
          <td>{configValue(pipeline, 'format')}</td>
          <td>
            <span class:enabled={pipeline.enabled}>
              {pipeline.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </td>
          <td class="config">{configSummary(pipeline)}</td>
          <td>{formatDate(pipeline.updatedAt ?? pipeline.createdAt)}</td>
          <td class="actions">
            <button class="btn secondary" type="button" onclick={() => onEdit?.(pipeline)}>Edit</button>
          </td>
        </tr>
      {:else}
        <tr>
          <td colspan="8" class="muted">No pipeline found.</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  span {
    color: var(--color-muted);
  }

  span.enabled {
    color: var(--color-success);
  }

  strong,
  small {
    display: block;
  }

  small,
  .config {
    color: var(--color-muted);
    font-size: 0.85rem;
  }

  .actions {
    text-align: right;
    white-space: nowrap;
  }

  .secondary {
    background: var(--color-panel-light);
    color: var(--color-text);
  }
</style>
