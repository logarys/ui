<script lang="ts">
  import { environment } from '$lib/config/environment';
</script>

<section>
  <h2 class="page-title">Configuration</h2>

  <div class="card config">
    <div>
      <strong>API URL</strong>
      <span>{environment.apiUrl}</span>
    </div>

    <div>
      <strong>Production</strong>
      <span>{environment.production ? 'yes' : 'no'}</span>
    </div>

    <div>
      <strong>Version</strong>
      <span>{__APP_VERSION__}</span>
    </div>
  </div>
</section>

<style>
  .config {
    display: grid;
    gap: 1rem;
    max-width: 720px;
  }

  .config > div {
    display: grid;
    grid-template-columns: 180px 1fr;
    gap: 1rem;
  }

  span {
    color: var(--color-muted);
  }
</style>
