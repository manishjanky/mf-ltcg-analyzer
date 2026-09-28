<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let sampleRow: Record<string, any> = {};
  export let headerOptions: Array<{ value: string; label: string }> = [];
  $: options = headerOptions.length
    ? headerOptions
    : Object.keys(sampleRow || {}).map((key) => ({ value: key, label: key }));
  export let mapping = { date: '', schemeName: '', amount: '', units: '', type: '' };
  const dispatch = createEventDispatcher();
  function apply(){
    dispatch('apply', { mapping });
  }
</script>

<div class="modal-backdrop" aria-modal="true" role="dialog" aria-labelledby="mapping-title">
  <div class="modal-card">
    <div class="modal-header">
      <h3 id="mapping-title">Column mapping</h3>
      <button type="button" class="close-btn" aria-label="Close mapping modal" on:click={() => dispatch('cancel')}>×</button>
    </div>

    {#if options.length === 0}
      <p>No columns detected yet.</p>
    {:else}
      <div class="field-grid">
        <div>
          <label for="map-date">Date</label>
          <select id="map-date" bind:value={mapping.date}>
            <option value="">--select--</option>
            {#each options as opt}
              <option value={opt.value}>{opt.label}</option>
            {/each}
          </select>
        </div>
        <div>
          <label for="map-scheme">Scheme Name</label>
          <select id="map-scheme" bind:value={mapping.schemeName}>
            <option value="">--select--</option>
            {#each options as opt}
              <option value={opt.value}>{opt.label}</option>
            {/each}
          </select>
        </div>
        <div>
          <label for="map-amount">Amount</label>
          <select id="map-amount" bind:value={mapping.amount}>
            <option value="">--select--</option>
            {#each options as opt}
              <option value={opt.value}>{opt.label}</option>
            {/each}
          </select>
        </div>
        <div>
          <label for="map-units">Units</label>
          <select id="map-units" bind:value={mapping.units}>
            <option value="">--select--</option>
            {#each options as opt}
              <option value={opt.value}>{opt.label}</option>
            {/each}
          </select>
        </div>
      </div>
      <div class="actions">
        <button type="button" class="secondary" on:click={() => dispatch('cancel')}>Cancel</button>
        <button type="button" on:click={apply}>Apply Mapping</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.55);
    display: grid;
    place-items: center;
    z-index: 1000;
  }
  .modal-card {
    width: min(620px, 90vw);
    background: var(--bg);
    color: var(--text);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 18px 42px rgba(0, 0, 0, 0.2);
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .close-btn {
    width: 32px;
    height: 32px;
    border-radius: 999px;
    border: 0;
    background: transparent;
    color: var(--text);
    font-size: 24px;
    line-height: 1;
  }
  .field-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  label {
    display: block;
    font-weight: 600;
    margin-bottom: 6px;
  }
  select {
    width: 100%;
    padding: 8px 10px;
    border-radius: 6px;
    border: 1px solid var(--muted);
    background: var(--surface);
    color: var(--text);
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
  }
  .secondary {
    background: rgba(148, 163, 184, 0.18);
    color: var(--text);
  }
</style>
