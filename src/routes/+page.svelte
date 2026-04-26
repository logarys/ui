<section>
  <h2 class="page-title">Dashboard</h2>

  <div class="dashboard">
    <div class="card">
      <h3>Ingestion</h3>
      <p>Monitor incoming logs from HTTP, syslog, files or broker sources.</p>
    </div>

    <div class="card">
      <h3>Pipelines</h3>
      <p>Create and manage log processing pipelines.</p>
    </div>

    <div class="card">
      <h3>Storage</h3>
      <p>Inspect indexed records and query performance.</p>
    </div>
  </div>
</section>

<style>
  .dashboard {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
  }

  p {
    color: var(--color-muted);
  }

  @media (max-width: 900px) {
    .dashboard {
      grid-template-columns: 1fr;
    }
  }
</style>
