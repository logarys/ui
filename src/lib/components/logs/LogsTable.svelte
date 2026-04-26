<script lang="ts">
  import type { LogEntry, LogLevel } from '$entities/log-entry';

  let { logs = [] } = $props<{
    logs?: LogEntry[];
  }>();

  function formatContext(context?: Record<string, unknown>): string {
    if (!context) {
      return '-';
    }

    return JSON.stringify(context);
  }

  function levelClass(level: LogLevel): string {
    return `level level-${level}`;
  }
</script>

<div class="card table-wrapper">
  <table>
    <thead>
      <tr>
        <th>Timestamp</th>
        <th>Level</th>
        <th>Source</th>
        <th>Message</th>
        <th>Context</th>
      </tr>
    </thead>
    <tbody>
      {#each logs as log}
        <tr>
          <td>{log.timestamp}</td>
          <td><span class={levelClass(log.level)}>{log.level}</span></td>
          <td>{log.source ?? '-'}</td>
          <td>{log.message}</td>
          <td><code>{formatContext(log.context)}</code></td>
        </tr>
      {:else}
        <tr>
          <td colspan="5" class="muted">No log found.</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  code {
    white-space: nowrap;
    color: var(--color-muted);
  }

  .level {
    display: inline-block;
    min-width: 68px;
    text-align: center;
    padding: 0.2rem 0.45rem;
    border-radius: 999px;
    background: var(--color-panel-light);
    color: var(--color-muted);
    font-size: 0.8rem;
    text-transform: uppercase;
  }

  .level-info {
    color: var(--color-primary);
  }

  .level-warning {
    color: var(--color-warning);
  }

  .level-error,
  .level-critical {
    color: var(--color-danger);
  }
</style>
