# Integration Matrix Generator

Generate an Excel integration matrix from a CSV or JSON list of components.

The workbook contains:

- `Descriptions`: one row per component, with blank placeholder columns for component and interface descriptions.
- `Integration Matrix`: one row and one two-column header group per component, with dropdowns for integration direction and interface type.

## Install

Recommended for day-to-day use:

```bash
./scripts/generate-workbook --input examples/components.csv --output IntegrationMatrix.generated.xlsx
```

The script creates a local `.venv` in this project and installs pinned dependencies there. That keeps the tool isolated from your global Python packages and avoids PATH issues with user-level pip installs.

If you prefer a normal editable Python install:

```bash
python3 -m pip install -e .
generate-integration-matrix --input examples/components.csv --output IntegrationMatrix.generated.xlsx
```

The legacy command also works after installation:

```bash
integration-matrix generate --input examples/components.csv --output IntegrationMatrix.generated.xlsx
```

You can also run the package without installing the console script if dependencies are already available:

```bash
PYTHONPATH=src python3 -m integration_matrix generate --input examples/components.csv --output IntegrationMatrix.generated.xlsx
```

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

```bash
PYTHONPATH=src python3 -m unittest discover -s tests
```
