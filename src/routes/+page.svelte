<script lang="ts">
  import '../app.css';
  import { transactions, theme, schemesLtcg } from '$lib/stores/transactions';
  import { parseCSV, parseJSON, parseXLSX } from '$lib/services/parser';
  import { allocateFIFO } from '$lib/services/ltcg-engine';
  import SchemeConfirm from '$lib/components/SchemeConfirm.svelte';
  import FileUploader from '$lib/components/FileUploader.svelte';
  import SummaryTable from '$lib/components/SummaryTable.svelte';
  import MappingEditor from '$lib/components/MappingEditor.svelte';
  import { exportCSV, exportXLSX } from '$lib/utils/export';
  import { onMount } from 'svelte';
  let file: File | null = null;
  let text = '';
  let results = [];
  let schemeQuals: Record<string, number> = {};
  let showConfirm = false;
  let showMapping = false;
  let showLotDetails = false;
  let selectedSchemeDetails: any = null;
  let sampleRow: Record<string, any> = {};
  let headerOptions: Array<{ value: string; label: string }> = [];
  let mapping = {
    date: '',
    schemeName: '',
    amount: '',
    units: '',
    type: ''
  };
  function handleFileChange(e: Event){
    const input = e.target as HTMLInputElement;
    const f = input.files && input.files[0];
    if (!f) return;
    file = f;
  }

  async function loadFile(){
    if (!file) return;
    const name = file.name.toLowerCase();
    let parsed: any[] = [];
    if (name.endsWith('.csv')){
      const t = await file.text();
      parsed = await parseCSV(t);
    } else if (name.endsWith('.json')){
      const t = await file.text();
      parsed = await parseJSON(t);
    } else if (name.endsWith('.xlsx') || name.endsWith('.xls')){
      const buf = await file.arrayBuffer();
      parsed = await parseXLSX(buf);
    }
    transactions.set(parsed);
    // prepare scheme defaults
    const schemesSet = new Set(parsed.map((t:any)=>t.schemeName));
    schemeQuals = {};
    schemesSet.forEach(s=> schemeQuals[s]=365);
    // prepare mapping editor using first raw row
    const firstTransaction = parsed[0] as any;
    sampleRow = firstTransaction?.raw ?? firstTransaction ?? {};
    headerOptions = firstTransaction?.headerMeta ?? Object.keys(sampleRow).map((key) => ({ value: key, label: key }));
    if (!Object.keys(sampleRow).length) {
      showMapping = false;
      return;
    }
    if (!mapping.date && !mapping.schemeName && !mapping.amount && !mapping.units) {
      const dateKey = headerOptions.find((option) => /date/i.test(option.label))?.value || headerOptions[0]?.value || 'A1';
      const schemeKey = headerOptions.find((option) => /scheme/i.test(option.label))?.value || headerOptions[1]?.value || 'A1';
      const amountKey = headerOptions.find((option) => /amount/i.test(option.label))?.value || headerOptions[2]?.value || 'A1';
      const unitsKey = headerOptions.find((option) => /unit/i.test(option.label))?.value || headerOptions[3]?.value || 'A1';
      const typeKey = headerOptions.find((option) => /type/i.test(option.label))?.value || headerOptions[4]?.value || 'A1';
      mapping = {
        date: dateKey,
        schemeName: schemeKey,
        amount: amountKey,
        units: unitsKey,
        type: typeKey
      };
    }
    showMapping = true;
  }

  let txs: any[] = [];
  transactions.subscribe(v=> txs = v || []);

  function compute(){
    const asOf = new Date();
    const mapped = (txs || []).map(t=> ({date:t.date, schemeName:t.schemeName, units:t.units, amount:t.amount}));
    const entries = allocateFIFO(mapped, schemeQuals, asOf);
    results = entries;
  }

  function exportResultsCSV(){
    if (!results || results.length === 0) return;
    exportCSV(results.map(r=> ({ Scheme: r.schemeName, TotalUnits: r.totalUnits, QualifiedUnits: r.qualifiedUnits, NonQualified: r.nonQualifiedUnits })), 'ltcg-summary.csv');
  }
  function exportResultsXLSX(){
    if (!results || results.length === 0) return;
    exportXLSX(results.map(r=> ({ Scheme: r.schemeName, TotalUnits: r.totalUnits, QualifiedUnits: r.qualifiedUnits, NonQualified: r.nonQualifiedUnits })), 'ltcg-summary.xlsx');
  }

  function formatDateForDisplay(value: string | Date) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  function formatUnits(value: number) {
    return Number(value || 0).toFixed(5);
  }

  function openSchemeDetails(row: any) {
    const asOf = new Date();
    const detailRows = (row.lots || []).map((lot: any) => {
      const diffDays = Math.max(0, Math.floor((asOf.getTime() - new Date(lot.purchaseDate).getTime()) / (1000 * 60 * 60 * 24)));
      return {
        purchaseDate: formatDateForDisplay(lot.purchaseDate),
        units: formatUnits(lot.units),
        daysHeld: diffDays,
        status: diffDays >= (schemeQuals[lot.schemeName] ?? 365) ? 'Qualified' : 'Not qualified'
      };
    });

    selectedSchemeDetails = {
      schemeName: row.schemeName,
      qualifyingDays: schemeQuals[row.schemeName] ?? 365,
      lots: detailRows
    };
    showLotDetails = true;
  }

  onMount(()=>{
    compute();
  });

  async function handleMappingApply(e: any){
    const payload = e.detail.mapping;
    const headerLookup = Object.fromEntries(
      (headerOptions || []).map((option) => [option.value, option.label.replace(/\s*\([^)]*\)\s*$/, '').trim()])
    );

    mapping = {
      date: headerLookup[payload.date] || payload.date,
      schemeName: headerLookup[payload.schemeName] || payload.schemeName,
      amount: headerLookup[payload.amount] || payload.amount,
      units: headerLookup[payload.units] || payload.units,
      type: headerLookup[payload.type] || payload.type,
    };

    showMapping = false;
    const parser = await import('$lib/services/parser');
    const rawRows = (txs || []);
    const normalized = parser.normalizeRows(rawRows, mapping);
    transactions.set(normalized);
    const schemesSet = new Set(normalized.map((t:any)=>t.schemeName));
    schemeQuals = {};
    schemesSet.forEach((s:any)=> schemeQuals[s]=365);
    showConfirm = true;
    compute();
  }
</script>

{#if showMapping}
  <MappingEditor {sampleRow} {headerOptions} mapping={mapping} on:apply={handleMappingApply} on:cancel={() => showMapping = false} />
{/if}

{#if showConfirm}
  <SchemeConfirm
    schemes={Object.keys(schemeQuals)}
    values={schemeQuals}
    on:apply={(e)=>{ schemeQuals = e.detail.values; showConfirm=false; compute(); }}
    on:cancel={() => showConfirm = false}
  />
{/if}

{#if showLotDetails && selectedSchemeDetails}
  <div class="modal-backdrop" aria-modal="true" role="dialog" aria-labelledby="details-title">
    <div class="modal-card details-card">
      <div class="modal-header">
        <h3 id="details-title">{selectedSchemeDetails.schemeName}</h3>
        <button type="button" class="close-btn" aria-label="Close details modal" on:click={() => showLotDetails = false}>×</button>
      </div>

      <p class="detail-subtitle">Qualifying period: {selectedSchemeDetails.qualifyingDays} days</p>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Purchase Date</th>
              <th>Units</th>
              <th>Days Held</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {#each selectedSchemeDetails.lots as lot}
              <tr>
                <td>{lot.purchaseDate}</td>
                <td>{lot.units}</td>
                <td>{lot.daysHeld}</td>
                <td class:qualified={lot.status === 'Qualified'} class:non-qualified={lot.status !== 'Qualified'}>{lot.status}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <div class="actions">
        <button type="button" on:click={() => showLotDetails = false}>Close</button>
      </div>
    </div>
  </div>
{/if}

<div class="container">
  <h1>MutualFund LTCG Analyzer</h1>
  <div class="card">
    <label aria-label="Upload transactions">Upload CSV / XLSX / JSON</label>
    <FileUploader on:select={(e)=>{ file = e.detail.file; loadFile(); }} />
    <div style="margin-top:8px">
      <button on:click={compute}>Compute LTCG</button>
    </div>
  </div>

  <div class="card" style="margin-top:12px">
    <h2>Results</h2>
    {#if results.length === 0}
      <p>No results yet.</p>
    {:else}
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h3>Summary</h3>
        <div>
          <button on:click={exportResultsCSV} style="margin-right:8px">Export CSV</button>
          <button on:click={exportResultsXLSX}>Export XLSX</button>
        </div>
      </div>
      <SummaryTable rows={results} on:details={(e)=> openSchemeDetails(e.detail.row)} />
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
    width: min(760px, 92vw);
    background: var(--bg);
    color: var(--text);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 18px 42px rgba(0, 0, 0, 0.2);
  }

  .details-card {
    max-height: 82vh;
    overflow: auto;
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

  .detail-subtitle {
    margin: 0 0 12px;
    color: var(--muted);
  }

  .table-wrap {
    width: 100%;
    overflow-x: auto;
    border: 1px solid var(--muted);
    border-radius: 10px;
    background: var(--surface);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 560px;
  }

  th,
  td {
    padding: 10px 12px;
    border-bottom: 1px solid var(--muted);
    text-align: left;
  }

  th {
    background: rgba(59, 130, 246, 0.08);
    font-size: 0.8rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--muted);
  }

  tbody tr:nth-child(even) {
    background: rgba(148, 163, 184, 0.04);
  }

  .qualified {
    color: var(--success, #0f9d58);
    font-weight: 600;
  }

  .non-qualified {
    color: var(--warning, #d97706);
    font-weight: 600;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
</style>
