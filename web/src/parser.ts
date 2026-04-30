import type { Component } from './types';

export function parseComponents(text: string): Component[] {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Input is empty.');

  if (trimmed.startsWith('[')) {
    return parseJson(trimmed);
  }
  return parseCsv(trimmed);
}

function parseCsv(text: string): Component[] {
  const lines = text.split('\n').map(l => l.trimEnd()).filter(l => l.trim());
  if (lines.length < 2) {
    throw new Error('CSV must have a header row and at least one data row.');
  }

  const headers = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase());

  if (!headers.includes('component')) {
    throw new Error("Input must include a 'component' field.");
  }

  const partnerIdx = headers.indexOf('partner');
  const taskIdx = headers.indexOf('task');
  const componentIdx = headers.indexOf('component');

  const components: Component[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const component = (values[componentIdx] ?? '').trim();
    if (!component) {
      throw new Error(`Component is required at row ${i + 1}.`);
    }
    components.push({
      partner: partnerIdx >= 0 ? (values[partnerIdx] ?? '').trim() : '',
      task: taskIdx >= 0 ? (values[taskIdx] ?? '').trim() : '',
      component,
    });
  }

  if (!components.length) throw new Error('Input must contain at least one component.');
  return components;
}

function parseJson(text: string): Component[] {
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch (e) {
    throw new Error('Invalid JSON: ' + (e as Error).message);
  }

  if (!Array.isArray(payload)) {
    throw new Error('JSON input must be a list of component objects.');
  }

  const components: Component[] = [];
  for (let i = 0; i < payload.length; i++) {
    const item = payload[i];
    if (!item || typeof item !== 'object') {
      throw new Error(`JSON item ${i + 1} must be an object.`);
    }
    const normalized: Record<string, string> = {};
    for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
      normalized[k.trim().toLowerCase()] = String(v ?? '').trim();
    }

    const component = normalized['component'] ?? '';
    if (!component) {
      throw new Error(`Component is required at item ${i + 1}.`);
    }
    components.push({
      partner: normalized['partner'] ?? '',
      task: normalized['task'] ?? '',
      component,
    });
  }

  if (!components.length) throw new Error('Input must contain at least one component.');
  return components;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
