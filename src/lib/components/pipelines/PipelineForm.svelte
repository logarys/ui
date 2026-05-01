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
  let syntaxMessage = $state<string | null>(null);
  let syntaxOk = $state(false);
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

    const validationError = validateRuntimeConfig(parsedConfig, format.trim());

    if (validationError) {
      formError = validationError;
      syntaxMessage = validationError;
      syntaxOk = false;
      return;
    }

    parsedConfig = normalizeConfigBeforeSave(parsedConfig, format.trim(), source.trim());
    saving = true;

    try {
      await onSave(
        {
          id: technicalId.trim() || undefined,
          name: name.trim() || source.trim(),
          inputType,
          enabled,
          source: source.trim(),
          format: format.trim(),
          description: description.trim() || undefined,
          config: parsedConfig
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
    const config = buildRuntimeConfig(pipeline);
    const parser = isRecord(config.parser) ? config.parser : {};

    technicalId = String(pipeline.id ?? pipeline.source ?? '');
    name = String(pipeline.name ?? pipeline.id ?? pipeline.source ?? '');
    inputType = pipeline.inputType ?? 'http';
    enabled = Boolean(pipeline.enabled);
    source = String(pipeline.source ?? pipeline.defaults?.source ?? '');
    format = String(pipeline.format ?? parser.type ?? 'json');
    description = String(pipeline.description ?? '');
    configJson = JSON.stringify(config, null, 2);
    formError = null;
    syntaxMessage = null;
    syntaxOk = false;
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
    syntaxMessage = null;
    syntaxOk = false;
  }

  function cancelEdit(): void {
    resetForm();
    onCancel?.();
  }

  function applyTemplate(): void {
    const template = getTemplate(inputType, source || 'application-logs', format || 'json');
    configJson = JSON.stringify(template, null, 2);
    syntaxMessage = null;
    syntaxOk = false;
  }


  function checkSyntax(): boolean {
    formError = null;

    let parsedConfig: Record<string, unknown>;

    try {
      parsedConfig = parseConfigJson(configJson);
    } catch (error) {
      syntaxOk = false;
      syntaxMessage = error instanceof Error ? error.message : 'Invalid JSON configuration.';
      return false;
    }

    const validationError = validateRuntimeConfig(parsedConfig, format.trim());

    if (validationError) {
      syntaxOk = false;
      syntaxMessage = validationError;
      return false;
    }

    syntaxOk = true;
    syntaxMessage = 'Runtime pipeline JSON syntax is valid.';
    return true;
  }

  function clearSyntaxMessage(): void {
    syntaxMessage = null;
    syntaxOk = false;
  }

  function validateRuntimeConfig(config: Record<string, unknown>, selectedParserType: string): string | null {
    const allowedTopLevelKeys = new Set(['parser', 'defaults', 'publish', 'security', 'input']);
    const invalidTopLevelKey = Object.keys(config).find((key) => !allowedTopLevelKeys.has(key));

    if (invalidTopLevelKey) {
      return `Unsupported runtime config key: ${invalidTopLevelKey}. Use parser, defaults, publish, security or input.`;
    }

    if (config.parser !== undefined && !isRecord(config.parser)) {
      return 'parser must be a JSON object.';
    }

    if (config.defaults !== undefined && !isRecord(config.defaults)) {
      return 'defaults must be a JSON object.';
    }

    if (config.publish !== undefined && !isRecord(config.publish)) {
      return 'publish must be a JSON object.';
    }

    if (config.security !== undefined && !isRecord(config.security)) {
      return 'security must be a JSON object.';
    }

    const parser = isRecord(config.parser) ? config.parser : {};
    const parserType = String(parser.type ?? selectedParserType ?? '').trim();

    if (!parserType) {
      return 'parser.type is required.';
    }

    if (parserType === 'regex') {
      const pattern = parser.pattern ?? parser.regex;

      if (typeof pattern !== 'string' || pattern.trim() === '') {
        return 'parser.pattern is required for regex pipelines.';
      }

      try {
        new RegExp(pattern);
      } catch (error) {
        return `Invalid regex pattern: ${error instanceof Error ? error.message : String(error)}`;
      }
    }

    if (isRecord(config.publish)) {
      const subject = config.publish.subject;

      if (subject !== undefined && (typeof subject !== 'string' || subject.trim() === '')) {
        return 'publish.subject must be a non-empty string.';
      }
    }

    if (isRecord(config.security)) {
      const mode = config.security.mode;

      if (mode !== undefined && typeof mode !== 'string') {
        return 'security.mode must be a string.';
      }
    }

    return null;
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
    return String(pipeline.id ?? pipeline.source ?? pipeline.name);
  }

  function buildRuntimeConfig(pipeline: PipelineConfig): Record<string, unknown> {
    if (isRecord(pipeline.config) && Object.keys(pipeline.config).length > 0) {
      return pipeline.config;
    }

    const config: Record<string, unknown> = {};

    if (isRecord(pipeline.parser)) {
      config.parser = pipeline.parser;
    }

    if (isRecord(pipeline.defaults)) {
      config.defaults = pipeline.defaults;
    }

    if (isRecord(pipeline.publish)) {
      config.publish = pipeline.publish;
    }

    if (isRecord(pipeline.security)) {
      config.security = pipeline.security;
    }

    return config;
  }

  function normalizeConfigBeforeSave(
    config: Record<string, unknown>,
    parserType: string,
    pipelineSource: string
  ): Record<string, unknown> {
    const parser = isRecord(config.parser) ? { ...config.parser } : {};
    parser.type = String(parser.type ?? parserType);

    if (parser.regex && !parser.pattern) {
      parser.pattern = String(parser.regex);
      delete parser.regex;
    }

    return {
      ...config,
      parser,
      defaults: isRecord(config.defaults)
        ? config.defaults
        : { source: pipelineSource },
      publish: isRecord(config.publish)
        ? config.publish
        : { subject: `logs.${pipelineSource}.normalized` },
      security: isRecord(config.security)
        ? config.security
        : { mode: 'none' }
    };
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
      parser: {
        type: defaultFormat
      },
      defaults: {
        source: defaultSource
      },
      publish: {
        subject: `logs.${defaultSource}.normalized`
      },
      security: {
        mode: 'none'
      }
    };

    switch (type) {
      case 'syslog':
        return {
          ...base,
          input: {
            protocol: 'udp',
            port: 514,
            facility: 'local0'
          }
        };
      case 'file':
        return {
          ...base,
          input: {
            path: '/var/log/application.log',
            follow: true,
            fromBeginning: false
          }
        };
      case 'nats':
        return {
          ...base,
          input: {
            stream: 'LOGARYS',
            subject: 'logs.>'
          }
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
      Parser type
      <select class="input" bind:value={format} disabled={saving}>
        <option value="json">JSON</option>
        <option value="regex">Regex</option>
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
    Runtime pipeline JSON
    <textarea class="input mono" bind:value={configJson} rows="12" spellcheck="false" disabled={saving} oninput={clearSyntaxMessage}></textarea>
  </label>

  {#if syntaxMessage}
    <p class:syntax-ok={syntaxOk} class:error={!syntaxOk}>{syntaxMessage}</p>
  {/if}

  <div class="actions">
    <button class="btn secondary" type="button" onclick={applyTemplate} disabled={saving}>Apply {inputType.toUpperCase()} template</button>
    <button class="btn secondary" type="button" onclick={checkSyntax} disabled={saving}>Check syntax</button>
    <button class="btn" type="submit" disabled={saving || !source.trim() || !format.trim()}>
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

  .syntax-ok {
    color: var(--color-success);
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
