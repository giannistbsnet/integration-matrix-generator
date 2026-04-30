import './style.css';
import { parseComponents } from './parser';
import { generateWorkbook } from './generator';

const EXAMPLE_CSV = `partner,task,component
ACME,T1.1,Order Service
ACME,T1.2,Inventory Service
ACME,T1.3,Shipment Processor
ACME,T1.4,Billing Gateway
NOVA,T2.1,Analytics Engine
NOVA,T2.2,Customer Portal
NOVA,T2.3,Data Warehouse
NOVA,T2.4,Notification Service
ZEUS,T3.1,Workflow Orchestrator
ZEUS,T3.2,Mobile App`.trim();

const EXAMPLE_JSON = JSON.stringify([
  { partner: 'ACME', task: 'T1.1', component: 'Order Service' },
  { partner: 'ACME', task: 'T1.2', component: 'Inventory Service' },
  { partner: 'NOVA', task: 'T2.1', component: 'Analytics Engine' },
  { partner: 'NOVA', task: 'T2.2', component: 'Customer Portal' },
], null, 2);

const textarea    = document.getElementById('input')       as HTMLTextAreaElement;
const generateBtn = document.getElementById('generate')    as HTMLButtonElement;
const loadExample = document.getElementById('load-example') as HTMLButtonElement;
const fileInput   = document.getElementById('file-input')  as HTMLInputElement;
const showCsvBtn  = document.getElementById('show-csv')    as HTMLButtonElement;
const showJsonBtn = document.getElementById('show-json')   as HTMLButtonElement;
const lineNums    = document.getElementById('line-nums')   as HTMLDivElement;
const inputStats  = document.getElementById('input-stats') as HTMLSpanElement;
const statusBar   = document.getElementById('status-bar')  as HTMLDivElement;
const outputSize  = document.getElementById('output-size') as HTMLSpanElement;
const modKey      = document.getElementById('mod-key')     as HTMLElement;

// Set platform modifier key label
modKey.textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';

let exampleFormat: 'csv' | 'json' = 'csv';

// ─── Line numbers ─────────────────────────────────────────────────────────────

function updateLineNums(): void {
  const lines = textarea.value.split('\n').length;
  lineNums.innerHTML = Array.from({ length: lines }, (_, i) => `<span>${i + 1}</span>`).join('');
}

function syncScroll(): void {
  lineNums.scrollTop = textarea.scrollTop;
}

textarea.addEventListener('input', () => { updateLineNums(); syncScroll(); onInput(); });
textarea.addEventListener('scroll', syncScroll);

// ─── Live validation ──────────────────────────────────────────────────────────

function estimateSize(count: number): string {
  // Rough heuristic: ~4 KB base + ~0.8 KB per component
  const kb = Math.round(4 + count * 0.8);
  return kb < 1024 ? `~${kb} KB` : `~${(kb / 1024).toFixed(1)} MB`;
}

function onInput(): void {
  const text = textarea.value.trim();

  if (!text) {
    statusBar.innerHTML = '';
    inputStats.textContent = '';
    outputSize.textContent = '';
    return;
  }

  try {
    const components = parseComponents(textarea.value);
    const partners = new Set(components.map(c => c.partner).filter(Boolean));
    const partnerLabel = partners.size > 0
      ? ` · ${partners.size} partner${partners.size !== 1 ? 's' : ''}`
      : '';

    inputStats.textContent = `${components.length} row${components.length !== 1 ? 's' : ''}${partnerLabel}`;
    statusBar.innerHTML = `<span class="status-dot ok"></span><span class="status-text ok">Valid ${textarea.value.trimStart().startsWith('[') ? 'JSON' : 'CSV'}</span>`;
    outputSize.textContent = `${components.length} × ${components.length} cells · ${estimateSize(components.length)}`;
  } catch (err) {
    inputStats.textContent = '';
    outputSize.textContent = '';
    statusBar.innerHTML = `<span class="status-dot err"></span><span class="status-text err">${(err as Error).message}</span>`;
  }
}

// ─── Format toggle ────────────────────────────────────────────────────────────

function setFormat(format: 'csv' | 'json'): void {
  exampleFormat = format;
  showCsvBtn.classList.toggle('active', format === 'csv');
  showJsonBtn.classList.toggle('active', format === 'json');
}

showCsvBtn.addEventListener('click', () => setFormat('csv'));
showJsonBtn.addEventListener('click', () => setFormat('json'));

// ─── Load example ─────────────────────────────────────────────────────────────

loadExample.addEventListener('click', () => {
  textarea.value = exampleFormat === 'csv' ? EXAMPLE_CSV : EXAMPLE_JSON;
  updateLineNums();
  onInput();
});

// ─── File upload ──────────────────────────────────────────────────────────────

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    textarea.value = (e.target?.result as string) ?? '';
    updateLineNums();
    onInput();
  };
  reader.readAsText(file, 'utf-8');
  fileInput.value = '';
});

// ─── Generate ─────────────────────────────────────────────────────────────────

async function generate(): Promise<void> {
  let components;
  try {
    components = parseComponents(textarea.value);
  } catch (err) {
    statusBar.innerHTML = `<span class="status-dot err"></span><span class="status-text err">${(err as Error).message}</span>`;
    return;
  }

  generateBtn.disabled = true;
  generateBtn.textContent = 'Generating…';

  try {
    const buffer = await generateWorkbook(components);
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'integration-matrix.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    statusBar.innerHTML = `<span class="status-dot err"></span><span class="status-text err">Failed: ${(err as Error).message}</span>`;
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = 'Generate XLSX →';
  }
}

generateBtn.addEventListener('click', generate);

// Cmd/Ctrl+Enter shortcut
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    generate();
  }
});

// ─── Init ─────────────────────────────────────────────────────────────────────

textarea.value = EXAMPLE_CSV;
updateLineNums();
onInput();
