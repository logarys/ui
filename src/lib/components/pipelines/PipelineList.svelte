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

  function displayName(pipeline: PipelineConfig): string {
    return String(pipeline.name ?? pipeline.id ?? pipeline.source ?? '-');
  }

  function displayInput(pipeline: PipelineConfig): string {
    const input = pipeline.inputType ?? pipeline.input ?? 'http';
    return String(input).toUpperCase();
  }

  function displaySource(pipeline: PipelineConfig): string {
    return String(pipeline.source ?? pipeline.defaults?.source ?? '-');
  }

  function displayFormat(pipeline: PipelineConfig): string {
    const parserType = String(pipeline.format ?? pipeline.parser?.type ?? '-');
    return parserType === '-' ? parserType : parserType.toUpperCase();
  }

  function configSummary(pipeline: PipelineConfig): string {
    const parts: string[] = [];

    if (pipeline.parser?.type) {
      parts.push(`parser: ${pipeline.parser.type}`);
    }

    if (pipeline.parser?.pattern) {
      parts.push(`pattern: ${shorten(String(pipeline.parser.pattern), 42)}`);
    }

    if (pipeline.mapping && Object.keys(pipeline.mapping).length > 0) {
      parts.push(`mapping: ${shorten(JSON.stringify(pipeline.mapping), 42)}`);
    }

    if (pipeline.publish?.subject) {
      parts.push(`subject: ${pipeline.publish.subject}`);
    }

    if (pipeline.security?.mode) {
      parts.push(`security: ${pipeline.security.mode}`);
    }

    if (parts.length > 0) {
      return parts.slice(0, 3).join(', ');
    }

    const config = pipeline.config;

    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      return '-';
    }

    const entries = Object.entries(config)
      .slice(0, 3)
      .map(([key, value]) => `${key}: ${formatValue(value)}`);

    return entries.length > 0 ? entries.join(', ') : '-';
  }

  function shorten(value: string, length: number): string {
    return value.length > length ? `${value.slice(0, length)}…` : value;
  }

  function formatValue(value: unknown): string {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    return shorten(JSON.stringify(value), 60);
  }
</script>

<div class="card table-wrapper">
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Input</th>
        <th>Source</th>
        <th>Parser</th>
        <th>Status</th>
        <th>Runtime config</th>
        <th>Updated</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#each pipelines as pipeline (pipeline.id ?? pipeline.source ?? pipeline.name)}
        <tr>
          <td>
            <strong>{displayName(pipeline)}</strong>
            {#if pipeline.description}
              <small>{pipeline.description}</small>
            {/if}
          </td>
          <td>{displayInput(pipeline)}</td>
          <td>{displaySource(pipeline)}</td>
          <td>{displayFormat(pipeline)}</td>
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

  .config {
    max-width: 32rem;
    overflow-wrap: anywhere;
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
