# Integration Matrix Generator

![Python](https://img.shields.io/badge/python-3.10%2B-3776AB?logo=python&logoColor=white)
![openpyxl](https://img.shields.io/badge/openpyxl-3.1.x-2E7D32)
![Excel](https://img.shields.io/badge/output-XLSX-217346?logo=microsoftexcel&logoColor=white)
![CLI](https://img.shields.io/badge/interface-CLI-4B5563)
![TypeScript](https://img.shields.io/badge/frontend-TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/bundler-Vite-646CFF?logo=vite&logoColor=white)
![Tests](https://img.shields.io/badge/tests-unittest-6B7280)

Generate an Excel integration matrix from a CSV or JSON list of components — via the **browser-based web app** or the **Python CLI**.

The workbook contains:

- `Descriptions`: one row per component, with blank placeholder columns for component and interface descriptions.
- `Integration Matrix`: one row and one two-column header group per component, with dropdowns for integration direction and interface type.

## Preview

![Generated integration matrix workbook](screenshots/integration-matrix-screenshot.png)

Users fill in only the lower-left half of the matrix. The upper-right half is automatically completed from the matching counterpart cell: directions are flipped where needed (`↗` becomes `↙`, and `↙` becomes `↗`), bidirectional flows stay as `↔`, interfaces are copied, and empty counterpart cells remain blank.

---

## Web App (GitHub Pages)

The frontend is a static Vite + TypeScript app that generates the XLSX entirely in the browser using [ExcelJS](https://github.com/exceljs/exceljs). No backend required.

### Local development

```bash
cd web
npm install
npm run dev
```

### Build

```bash
cd web
npm run build
# Output: web/dist/
```

### GitHub Pages deployment

Push to `main` — the included GitHub Actions workflow (`.github/workflows/deploy.yml`) builds the app and deploys `web/dist/` to GitHub Pages automatically.

Before the first deploy, enable GitHub Pages in your repo settings:
**Settings → Pages → Source → GitHub Actions**.

---

## Python CLI

### Install

For quick use:

```bash
./scripts/generate-workbook --input examples/components.csv --output IntegrationMatrix.generated.xlsx
```

The script creates a local `.venv` in this project and installs pinned dependencies there.

If you prefer a normal editable Python install:

```bash
python3 -m pip install -e .
generate-integration-matrix --input examples/components.csv --output IntegrationMatrix.generated.xlsx
```

This command is also available after installation:

```bash
integration-matrix generate --input examples/components.csv --output IntegrationMatrix.generated.xlsx
```

You can also run the package without installing the console script if dependencies are already available:

```bash
PYTHONPATH=src python3 -m integration_matrix generate --input examples/components.csv --output IntegrationMatrix.generated.xlsx
```

---

## Input Format

CSV input:

```csv
partner,task,component
ACME,T1.1,Order Service
ACME,T1.2,Inventory Service
```

JSON input:

```json
[
  {"partner": "ACME", "task": "T1.1", "component": "Order Service"},
  {"partner": "ACME", "task": "T1.2", "component": "Inventory Service"}
]
```

`component` is required. `partner` and `task` are optional and will be left blank when missing.

## Matrix Behavior

For each component pair, users fill in the lower triangle of the matrix. The upper triangle is formula-driven:

- `↗` mirrors as `↙`
- `↙` mirrors as `↗`
- `↔` mirrors unchanged
- interface values mirror unchanged

Direction dropdown options:

```text
↔, ↗, ↙
```

Interface dropdown options:

```text
REST API, GraphQL, gRPC, Kafka, MQTT, WebSocket, SPARQL endpoint, NGSI-LD,
Eclipse Dataspace Connector (EDC), AAS / Eclipse BaSyx, File / Batch, Other
```

## Tests

Python:

```bash
PYTHONPATH=src python3 -m unittest discover -s tests
```

Frontend build (also runs TypeScript type-check):

```bash
cd web && npm run build
```
