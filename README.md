# Integration Matrix Generator

Generate an Excel integration matrix from a CSV or JSON list of components.

The workbook contains:

- `Descriptions`: one row per component, with blank placeholder columns for component and interface descriptions.
- `Integration Matrix`: one row and one two-column header group per component, with dropdowns for integration direction and interface type.

## Install

```bash
python -m pip install -e .
```

## Usage

```bash
integration-matrix generate --input examples/components.csv --output IntegrationMatrix.generated.xlsx
```

You can also run the package without installing the console script:

```bash
PYTHONPATH=src python -m integration_matrix generate --input examples/components.csv --output IntegrationMatrix.generated.xlsx
```

## Input Format

CSV input:

```csv
partner,task,component
FLM,T4.1,UniMaaS EDC Connector
FLM,T4.1,Digital Thread Component
```

JSON input:

```json
[
  {"partner": "FLM", "task": "T4.1", "component": "UniMaaS EDC Connector"},
  {"partner": "FLM", "task": "T4.1", "component": "Digital Thread Component"}
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
PYTHONPATH=src python -m unittest discover -s tests
```
