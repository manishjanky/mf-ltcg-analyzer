<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let rows: any[] = [];
  const dispatch = createEventDispatcher();

  function formatUnits(value: number) {
    return Number(value || 0).toFixed(5);
  }

  function openDetails(row: any) {
    dispatch('details', { row });
  }
</script>

<div class="table-wrap">
  <table aria-live="polite">
    <thead>
      <tr>
        <th>Scheme</th>
        <th>Total Units</th>
        <th>LTCG Qualified Units</th>
        <th>LTCG Non-qualified Units</th>
        <th>Details</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as r}
        <tr>
          <td class="scheme-name">{r.schemeName}</td>
          <td>{formatUnits(r.totalUnits)}</td>
          <td class="qualified">{formatUnits(r.qualifiedUnits)}</td>
          <td class="non-qualified">{formatUnits(r.nonQualifiedUnits)}</td>
          <td>
            <button type="button" class="details-btn" on:click={() => openDetails(r)}>View</button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .table-wrap {
    width: 100%;
    overflow-x: auto;
    border-radius: 12px;
    border: 1px solid var(--muted);
    background: var(--surface);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 720px;
    background: var(--surface);
    color: var(--text);
  }

  thead tr {
    background: rgba(59, 130, 246, 0.08);
  }

  th,
  td {
    padding: 12px 14px;
    border-bottom: 1px solid var(--muted);
    text-align: left;
    vertical-align: middle;
  }

  th {
    font-size: 0.8rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--muted);
    font-weight: 700;
  }

  tbody tr:nth-child(even) {
    background: rgba(148, 163, 184, 0.04);
  }

  tbody tr:hover {
    background: rgba(59, 130, 246, 0.04);
  }

  .scheme-name {
    font-weight: 600;
  }

  .qualified {
    color: var(--success, #0f9d58);
    font-weight: 600;
  }

  .non-qualified {
    color: var(--warning, #d97706);
    font-weight: 600;
  }

  .details-btn {
    padding: 7px 12px;
    border: 1px solid rgba(59, 130, 246, 0.35);
    border-radius: 8px;
    background: rgba(59, 130, 246, 0.08);
    color: var(--text);
    cursor: pointer;
    font-weight: 600;
  }
</style>
