<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  let dragOver = false;
  let inputEl: HTMLInputElement;
  function handleFiles(files: FileList | null){
    if (!files || files.length === 0) return;
    dispatch('select', { file: files[0] });
  }
  function onDrop(e: DragEvent){
    e.preventDefault();
    dragOver = false;
    handleFiles(e.dataTransfer?.files ?? null);
  }
  function onInput(e: Event){
    const input = e.target as HTMLInputElement;
    handleFiles(input.files);
  }
</script>

<style>
.uploader{border:2px dashed var(--muted);padding:18px;border-radius:8px;text-align:center}
.uploader.drag{background:rgba(0,0,0,0.03)}
</style>

<div class="uploader {dragOver ? 'drag' : ''}" on:dragover|preventDefault={() => dragOver = true} on:dragleave={() => dragOver = false} on:drop={onDrop} role="button" tabindex="0" aria-label="File uploader drop zone">
  <p>Drag & drop a CSV / XLSX / JSON file here, or</p>
  <button on:click={() => inputEl.click()}>Choose file</button>
  <input bind:this={inputEl} type="file" accept=".csv,.xlsx,.xls,.json" on:change={onInput} style="display:none" />
</div>
