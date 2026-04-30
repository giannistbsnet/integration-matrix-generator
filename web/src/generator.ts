import ExcelJS from 'exceljs';
import type { Component } from './types';

const DESCRIPTIONS_SHEET = 'Descriptions';
const MATRIX_SHEET = 'Integration Matrix';

export const DIRECTION_OPTIONS = ['↔', '↗', '↙'];
export const INTERFACE_OPTIONS = [
  'REST API',
  'GraphQL',
  'gRPC',
  'Kafka',
  'MQTT',
  'WebSocket',
  'SPARQL endpoint',
  'NGSI-LD',
  'Eclipse Dataspace Connector (EDC)',
  'AAS / Eclipse BaSyx',
  'File / Batch',
  'Other',
];

// ARGB hex colors (FF prefix = fully opaque)
const HEADER_FILL = 'FFD8D8D8';
const COMPONENT_FILL = 'FFD9E0FB';
const SUBHEADER_FILL = 'FFFDBF11';
const BLACK_FILL = 'FF000000';
const MIRROR_FILL = 'FFF0F0F0';
const TEXT_DARK = 'FF000000';
const TEXT_BLUE = 'FF262668';
const TEXT_GRAY = 'FF434343';

const THIN_GRAY: ExcelJS.BorderStyle = 'thin';
const THIN_GRAY_COLOR = 'FFB7B7B7';
const THIN_BLACK_COLOR = 'FF000000';

// Matrix grid starts at row 3, column D (1-indexed)
const START_ROW = 3;
const START_COL = 4;

function colLetter(n: number): string {
  let s = '';
  while (n > 0) {
    n--;
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26);
  }
  return s;
}

function solidFill(argb: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

function thinBorder(color: string): ExcelJS.Border {
  return { style: THIN_GRAY, color: { argb: color } };
}

export async function generateWorkbook(components: Component[]): Promise<ArrayBuffer> {
  if (!components.length) throw new Error('At least one component is required.');

  const workbook = new ExcelJS.Workbook();
  const matrix = workbook.addWorksheet(MATRIX_SHEET);
  const descriptions = workbook.addWorksheet(DESCRIPTIONS_SHEET);

  buildDescriptionsSheet(descriptions, components);
  buildMatrixSheet(matrix, components);

  return await workbook.xlsx.writeBuffer() as ArrayBuffer;
}

// ─── Descriptions sheet ───────────────────────────────────────────────────────

function buildDescriptionsSheet(sheet: ExcelJS.Worksheet, components: Component[]): void {
  sheet.addTable({
    name: 'Descriptions',
    ref: 'A1',
    headerRow: true,
    totalsRow: false,
    style: {
      theme: 'TableStyleMedium2',
      showFirstColumn: false,
      showLastColumn: false,
      showRowStripes: true,
      showColumnStripes: false,
    },
    columns: [
      { name: 'Partner', filterButton: true },
      { name: 'Task', filterButton: true },
      { name: 'Component', filterButton: true },
      { name: 'Description of Component', filterButton: true },
      { name: 'Description of Interface', filterButton: true },
    ],
    rows: components.map(c => [c.partner, c.task, c.component, '', '']),
  });

  sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

  sheet.getColumn('A').width = 14.5;
  sheet.getColumn('B').width = 11.5;
  sheet.getColumn('C').width = 35.13;
  sheet.getColumn('D').width = 37.13;
  sheet.getColumn('E').width = 25.88;
  sheet.getRow(1).height = 22.5;

  const headerFont: Partial<ExcelJS.Font> = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  const bodyFont: Partial<ExcelJS.Font> = { name: 'Arial', size: 10, color: { argb: TEXT_DARK } };

  for (let col = 1; col <= 5; col++) {
    const cell = sheet.getCell(1, col);
    cell.font = headerFont;
    cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  }

  for (let i = 0; i < components.length; i++) {
    const row = sheet.getRow(i + 2);
    row.height = 45;
    for (let col = 1; col <= 5; col++) {
      const cell = row.getCell(col);
      cell.font = bodyFont;
      cell.alignment = { vertical: 'middle', wrapText: col >= 4 };
    }
  }

  sheet.getCell('E1').note =
    '1. What protocol/technology do you expose?\n\n' +
    '2. What data do you send/receive and in what format?\n\n' +
    '3. What does a consumer need to connect to you?';
}

// ─── Matrix sheet ─────────────────────────────────────────────────────────────

function buildMatrixSheet(sheet: ExcelJS.Worksheet, components: Component[]): void {
  const count = components.length;
  const lastCol = START_COL + count * 2 - 1;
  const lastRow = START_ROW + count - 1;

  sheet.views = [{ state: 'frozen', xSplit: 3, ySplit: 2 }];
  sheet.getRow(1).height = 22.5;
  sheet.getRow(2).height = 30.75;
  for (let r = START_ROW; r <= lastRow; r++) {
    sheet.getRow(r).height = 27.75;
  }

  setMatrixDimensions(sheet, lastCol);
  writeMatrixHeaders(sheet, components);
  writeMatrixRows(sheet, components);
  writeMatrixCells(sheet, count);
  addMatrixValidations(sheet, count);
}

function setMatrixDimensions(sheet: ExcelJS.Worksheet, lastCol: number): void {
  sheet.getColumn('A').width = 13.38;
  sheet.getColumn('B').width = 8.38;
  sheet.getColumn('C').width = 36.63;
  for (let col = START_COL; col <= lastCol; col++) {
    sheet.getColumn(colLetter(col)).width = (col - START_COL) % 2 === 0 ? 11.63 : 13.0;
  }
}

function writeMatrixHeaders(sheet: ExcelJS.Worksheet, components: Component[]): void {
  const baseHeaders = ['Partner', 'Task', 'Component'];
  for (let i = 0; i < baseHeaders.length; i++) {
    const col = i + 1;
    sheet.mergeCells(1, col, 2, col);
    const cell = sheet.getCell(1, col);
    cell.value = baseHeaders[i];
    cell.fill = solidFill(HEADER_FILL);
    cell.font = { name: 'Arial', size: 13, bold: true, color: { argb: TEXT_DARK } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: thinBorder(THIN_BLACK_COLOR),
      bottom: thinBorder(THIN_BLACK_COLOR),
      left: thinBorder(THIN_BLACK_COLOR),
      right: thinBorder(THIN_BLACK_COLOR),
    };
  }

  for (let index = 0; index < components.length; index++) {
    const directionCol = START_COL + index * 2;
    const interfaceCol = directionCol + 1;

    sheet.mergeCells(1, directionCol, 1, interfaceCol);
    const header = sheet.getCell(1, directionCol);
    header.value = components[index].component;
    header.fill = solidFill(COMPONENT_FILL);
    header.font = { name: 'Arial', size: 12, color: { argb: TEXT_DARK } };
    header.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    header.border = {
      top: thinBorder(THIN_BLACK_COLOR),
      right: thinBorder(THIN_BLACK_COLOR),
    };

    const subLabels: [number, string][] = [
      [directionCol, 'Data Flow Direction'],
      [interfaceCol, 'Interface'],
    ];
    for (const [col, label] of subLabels) {
      const sub = sheet.getCell(2, col);
      sub.value = label;
      sub.fill = solidFill(SUBHEADER_FILL);
      sub.font = { name: 'Arial', size: 12, bold: true, color: { argb: TEXT_BLUE } };
      sub.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      sub.border = {
        bottom: thinBorder(THIN_BLACK_COLOR),
        ...(col === interfaceCol ? { right: thinBorder(THIN_BLACK_COLOR) } : {}),
      };
    }
  }
}

function writeMatrixRows(sheet: ExcelJS.Worksheet, components: Component[]): void {
  for (let index = 0; index < components.length; index++) {
    const row = START_ROW + index;
    const values = [components[index].partner, components[index].task, components[index].component];
    for (let col = 1; col <= 3; col++) {
      const cell = sheet.getCell(row, col);
      cell.value = values[col - 1];
      cell.fill = solidFill(col < 3 ? HEADER_FILL : COMPONENT_FILL);
      cell.font = {
        name: col < 3 ? 'Roboto' : 'Arial',
        size: 11,
        bold: col < 3,
        color: { argb: col < 3 ? TEXT_GRAY : TEXT_DARK },
      };
      cell.alignment = {
        horizontal: col < 3 ? 'center' : undefined,
        vertical: 'middle',
        wrapText: col === 3,
      };
      cell.border = {
        ...(col === 1 ? { left: thinBorder(THIN_BLACK_COLOR) } : {}),
        ...(col === 3 ? { right: thinBorder(THIN_BLACK_COLOR) } : {}),
      };
    }
  }
}

function writeMatrixCells(sheet: ExcelJS.Worksheet, count: number): void {
  for (let rowIndex = 0; rowIndex < count; rowIndex++) {
    const row = START_ROW + rowIndex;
    for (let colIndex = 0; colIndex < count; colIndex++) {
      const directionCol = START_COL + colIndex * 2;
      const interfaceCol = directionCol + 1;
      const dirCell = sheet.getCell(row, directionCol);
      const intCell = sheet.getCell(row, interfaceCol);

      if (rowIndex === colIndex) {
        styleMatrixPair(dirCell, intCell, BLACK_FILL);
        continue;
      }

      if (rowIndex < colIndex) {
        // Upper triangle: formula mirrors lower triangle
        const mirrorRow = START_ROW + colIndex;
        const mirrorDirCol = START_COL + rowIndex * 2;
        const mirrorIntCol = mirrorDirCol + 1;
        const dirRef = `${colLetter(mirrorDirCol)}${mirrorRow}`;
        const intRef = `${colLetter(mirrorIntCol)}${mirrorRow}`;
        dirCell.value = {
          formula: `IF(${dirRef}="","",IF(${dirRef}="↗","↙",IF(${dirRef}="↙","↗",${dirRef})))`,
        };
        intCell.value = { formula: `IF(${intRef}="","",${intRef})` };
        styleMatrixPair(dirCell, intCell, MIRROR_FILL);
      } else {
        // Lower triangle: editable
        styleMatrixPair(dirCell, intCell, null);
      }
    }
  }
}

function styleMatrixPair(
  dirCell: ExcelJS.Cell,
  intCell: ExcelJS.Cell,
  fill: string | null,
): void {
  for (const cell of [dirCell, intCell]) {
    const isDir = cell === dirCell;
    cell.font = { name: 'Arial', size: isDir ? 16 : 11, color: { argb: TEXT_DARK } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: thinBorder(THIN_GRAY_COLOR),
      ...(isDir ? {} : { right: thinBorder(THIN_BLACK_COLOR) }),
    };
    if (fill) cell.fill = solidFill(fill);
  }
}

function addMatrixValidations(sheet: ExcelJS.Worksheet, count: number): void {
  const dirValidation: ExcelJS.DataValidation = {
    type: 'list',
    allowBlank: true,
    formulae: [`"${DIRECTION_OPTIONS.join(',')}"`],
    showErrorMessage: false,
  };
  const intValidation: ExcelJS.DataValidation = {
    type: 'list',
    allowBlank: true,
    formulae: [`"${INTERFACE_OPTIONS.join(',')}"`],
    showErrorMessage: false,
  };

  for (let rowIndex = 0; rowIndex < count; rowIndex++) {
    const row = START_ROW + rowIndex;
    for (let colIndex = 0; colIndex < count; colIndex++) {
      if (rowIndex === colIndex) continue;
      const directionCol = START_COL + colIndex * 2;
      const interfaceCol = directionCol + 1;
      sheet.getCell(row, directionCol).dataValidation = dirValidation;
      sheet.getCell(row, interfaceCol).dataValidation = intValidation;
    }
  }
}
