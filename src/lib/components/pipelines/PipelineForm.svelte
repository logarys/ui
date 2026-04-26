<script lang="ts">
  import type {
    PipelineConfig,
    PipelineInputType,
    PipelineSavePayload
  } from '$entities/pipeline-config';

  let { selectedPipeline = null, onSave, onCancel } = $props<{
    selectedPipeline?: PipelineConfig | null;
    onSave: (pipeline: PipelineSavePayload, existingPipeline: PipelineConfig | null) => Promise<void> | void;
    onCancel?: () => void;
  }>();

  let technicalId = $state('');
  let name = $state('');
  let inputType = $state<PipelineInputType>('http');
  let enabled = $state(true);
  let source = $state('');
  let format = $state('json');
  let description = $state('');
  let configJson = $state('{}');
  let saving = $state(false);
  let formError = $state<string | null>(null);

  let lastLoadedKey = $state<string | null>(null);

  let isEditing = $derived(Boolean(selectedPipeline));

  $effect(() => {
    const key = selectedPipeline ? pipelineKey(selectedPipeline) : null;

    if (key === lastLoadedKey) {
      return;
    }

    lastLoadedKey = key;

    if (selectedPipeline) {
      loadPipeline(selectedPipeline);
    } else {
      resetForm();
    }
  });

  async function submit(): Promise<void> {
    formError = null;

    if (!name.trim()) {
      formError = 'Pipeline name is required.';
      return;
    }

    if (!source.trim()) {
      formError = 'Source is required.';
      return;
    }

    if (!format.trim()) {
      formError = 'Format is required.';
      return;
    }

    let parsedConfig: Record<string, unknown>;

    try {
      parsedConfig = parseConfigJson(configJson);
    } catch (error) {
      formError = error instanceof Error ? error.message : 'Invalid JSON configuration.';
      return;
    }

    saving = true;

    try {
      await onSave(
        {
          id: technicalId.trim() || undefined,
          name: name.trim(),
          inputType,
          enabled,
          source: source.trim(),
          format: format.trim(),
          description: description.trim() || undefined,
          config: {
            ...parsedConfig,
            source: source.trim(),
            format: format.trim()
          }
        },
        selectedPipeline
      );

      if (!selectedPipeline) {
        resetForm();
      }
    } catch (error) {
      formError = error instanceof Error ? error.message : 'Unable to save pipeline.';
    } finally {
      saving = false;
    }
  }

  function loadPipeline(pipeline: PipelineConfig): void {
    const config = isRecord(pipeline.config) ? pipeline.config : {};

    technicalId = String(pipeline.id ?? '');
    name = pipeline.name ?? '';
    inputType = pipeline.inputType ?? 'http';
    enabled = Boolean(pipeline.enabled);
    source = String(pipeline.source ?? config.source ?? '');
    format = String(pipeline.format ?? config.format ?? 'json');
    description = String(pipeline.description ?? '');
    configJson = JSON.stringify(config, null, 2);
    formError = null;
  }

  function resetForm(): void {
    technicalId = '';
    name = '';
    inputType = 'http';
    enabled = true;
    source = '';
    format = 'json';
    description = '';
    configJson = '{}';
    formError = null;
  }

  function cancelEdit(): void {
    resetForm();
    onCancel?.();
  }

  function applyTemplate(): void {
    const template = getTemplate(inputType, source || 'application-logs', format || 'json');
    configJson = JSON.stringify(template, null, 2);
  }

  function parseConfigJson(value: string): Record<string, unknown> {
    const trimmed = value.trim();

    if (!trimmed) {
      return {};
    }

    const parsed = JSON.parse(trimmed) as unknown;

    if (!isRecord(parsed)) {
      throw new Error('Configuration must be a JSON object.');
    }

    return parsed;
  }

  function pipelineKey(pipeline: PipelineConfig): string {
    return String(pipeline.id ?? pipeline.name);
  }

  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  function getTemplate(
    type: PipelineInputType,
    defaultSource: string,
    defaultFormat: string
  ): Record<string, unknown> {
    const base = {
      source: defaultSource,
      format: defaultFormat
    };

    switch (type) {
      case 'http':
        return {
          ...base,
          method: 'POST',
          path: '/logs',
          headers: {},
          bodyField: 'message'
        };
      case 'syslog':
        return {
          ...base,
          protocol: 'udp',
          port: 514,
          facility: 'local0'
        };
      case 'file':
        return {
          ...base,
          path: '/var/log/application.log',
          follow: true,
          fromBeginning: false
        };
      case 'nats':
        return {
          ...base,
          stream: 'LOGARYS',
          subject: 'logs.>'
        };
      default:
        return base;
    }
  }
</script>

<form class="card" onsubmit={(event) => { event.preventDefault(); void submit(); }}>
  <div class="form-header">
    <div>
      <h3>{isEditing ? 'Edit pipeline' : 'Create pipeline'}</h3>
      <p class="muted">Fill every pipeline configuration parameter before saving.</p>
    </div>

    {#if isEditing}
      <button class="btn secondary" type="button" onclick={cancelEdit} disabled={saving}>Cancel</button>
    {/if}
  </div>

  {#if formError}
    <p class="error">{formError}</p>
  {/if}

  <div class="fields two-columns">
    <label>
      Technical id
      <input class="input" bind:value={technicalId} placeholder="logarys-test-pipeline" disabled={saving || isEditing} />
    </label>

    <label>
      Name
      <input class="input" bind:value={name} placeholder="Application HTTP logs" disabled={saving} />
    </label>

    <label>
      Input type
      <select class="input" bind:value={inputType} disabled={saving}>
        <option value="http">HTTP</option>
        <option value="syslog">Syslog</option>
        <option value="file">File</option>
        <option value="nats">NATS</option>
      </select>
    </label>

    <label>
      Source
      <input class="input" bind:value={source} placeholder="application-api" disabled={saving} />
    </label>

    <label>
      Format
      <select class="input" bind:value={format} disabled={saving}>
        <option value="json">JSON</option>
        <option value="text">Text</option>
        <option value="syslog">Syslog</option>
        <option value="nginx">Nginx</option>
        <option value="apache">Apache</option>
      </select>
    </label>

    <label class="checkbox">
      <input type="checkbox" bind:checked={enabled} disabled={saving} />
      Enabled
    </label>
  </div>

  <label>
    Description
    <textarea class="input" bind:value={description} rows="3" placeholder="What this pipeline ingests" disabled={saving}></textarea>
  </label>

  <label>
    Configuration JSON
    <textarea class="input mono" bind:value={configJson} rows="12" spellcheck="false" disabled={saving}></textarea>
  </label>

  <div class="actions">
    <button class="btn secondary" type="button" onclick={applyTemplate} disabled={saving}>Apply {inputType.toUpperCase()} template</button>
    <button class="btn" type="submit" disabled={saving || !name.trim() || !source.trim() || !format.trim()}>
      {saving ? 'Saving...' : isEditing ? 'Save changes' : 'Create pipeline'}
    </button>
  </div>
</form>

<style>
  form {
    display: grid;
    gap: 1rem;
  }

  .form-header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
  }

  h3,
  p {
    margin: 0;
  }

  .fields {
    display: grid;
    gap: 1rem;
  }

  .two-columns {
    grid-template-columns: 1fr 1fr;
  }

  label {
    display: grid;
    gap: 0.4rem;
    color: var(--color-muted);
  }

  textarea {
    resize: vertical;
  }

  .mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
    font-size: 0.9rem;
  }

  .checkbox {
    display: flex;
    align-items: center;
    align-self: end;
    min-height: 42px;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .secondary {
    background: var(--color-panel-light);
    color: var(--color-text);
  }

  .error {
    color: var(--color-danger);
  }

  button:disabled,
  input:disabled,
  select:disabled,
  textarea:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 900px) {
    .two-columns {
      grid-template-columns: 1fr;
    }

    .actions {
      justify-content: stretch;
    }

    .actions button {
      width: 100%;
    }
  }
</style>
