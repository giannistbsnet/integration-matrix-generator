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
ZEUS,T3.2,Mobile App
ZEUS,T3.3,Legacy ERP Connector
NIMBUS,T4.1,API Gateway
NIMBUS,T4.2,Partner Portal
NIMBUS,T4.3,User Directory`.trim();

const EXAMPLE_JSON = JSON.stringify([
  { partner: 'ACME', task: 'T1.1', component: 'Order Service' },
  { partner: 'ACME', task: 'T1.2', component: 'Inventory Service' },
  { partner: 'NOVA', task: 'T2.1', component: 'Analytics Engine' },
  { partner: 'NOVA', task: 'T2.2', component: 'Customer Portal' },
], null, 2);

const textarea = document.getElementById('input') as HTMLTextAreaElement;
const generateBtn = document.getElementById('generate') as HTMLButtonElement;
const loadExampleBtn = document.getElementById('load-example') as HTMLButtonElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const messageEl = document.getElementById('message') as HTMLDivElement;
const showCsvBtn = document.getElementById('show-csv') as HTMLButtonElement;
const showJsonBtn = document.getElementById('show-json') as HTMLButtonElement;

let exampleFormat: 'csv' | 'json' = 'csv';

function showMessage(text: string, type: 'error' | 'success'): void {
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
}

function clearMessage(): void {
  messageEl.textContent = '';
  messageEl.className = 'message hidden';
}

function setExampleFormat(format: 'csv' | 'json'): void {
  exampleFormat = format;
  showCsvBtn.classList.toggle('btn-active', format === 'csv');
  showJsonBtn.classList.toggle('btn-active', format === 'json');
}

loadExampleBtn.addEventListener('click', () => {
  textarea.value = exampleFormat === 'csv' ? EXAMPLE_CSV : EXAMPLE_JSON;
  clearMessage();
});

showCsvBtn.addEventListener('click', () => setExampleFormat('csv'));
showJsonBtn.addEventListener('click', () => setExampleFormat('json'));

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    textarea.value = (e.target?.result as string) ?? '';
    clearMessage();
  };
  reader.readAsText(file, 'utf-8');
  fileInput.value = '';
});

textarea.addEventListener('input', clearMessage);

generateBtn.addEventListener('click', async () => {
  clearMessage();
  const text = textarea.value;

  let components;
  try {
    components = parseComponents(text);
  } catch (err) {
    showMessage((err as Error).message, 'error');
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
    a.download = 'IntegrationMatrix.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showMessage(`Generated matrix for ${components.length} component${components.length !== 1 ? 's' : ''}.`, 'success');
  } catch (err) {
    showMessage('Failed to generate workbook: ' + (err as Error).message, 'error');
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = 'Generate XLSX';
  }
});

// Load example on startup
textarea.value = EXAMPLE_CSV;
