<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let schemes: string[] = [];
  export let values: Record<string, number> = {};
  const dispatch = createEventDispatcher();
  function apply(){
    dispatch('apply', { values });
  }
</script>

<div class="modal-backdrop" aria-modal="true" role="dialog" aria-labelledby="scheme-title">
  <div class="modal-card">
    <div class="modal-header">
      <h3 id="scheme-title">Confirm LTCG qualifying period per scheme</h3>
      <button type="button" class="close-btn" aria-label="Close scheme confirmation modal" on:click={() => dispatch('cancel')}>×</button>
    </div>

    <div class="scheme-list">
      {#each schemes as s}
        <div class="scheme-row">
          <label for={s}>{s}</label>
          <div class="input-wrap">
            <input id={s} type="number" min="0" bind:value={values[s]} aria-label={`Qualifying days for ${s}`} />
            <span>days</span>
          </div>
        </div>
      {/each}
    </div>

    <div class="actions">
      <button type="button" class="secondary" on:click={() => dispatch('cancel')}>Cancel</button>
      <button type="button" on:click={apply}>Apply</button>
    </div>
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
  .scheme-list {
    display: grid;
    gap: 10px;
  }
  .scheme-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .input-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 180px;
  }
  input {
    width: 120px;
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
