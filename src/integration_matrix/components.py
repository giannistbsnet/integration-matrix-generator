from __future__ import annotations

import csv
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


@dataclass(frozen=True)
class Component:
    partner: str
    task: str
    component: str


def load_components(path: str | Path) -> list[Component]:
    source = Path(path)
    suffix = source.suffix.lower()

    if suffix == ".csv":
        components = _load_csv(source)
    elif suffix == ".json":
        components = _load_json(source)
    else:
        raise ValueError(f"Unsupported input format '{source.suffix}'. Use .csv or .json.")

    if not components:
        raise ValueError("Input must contain at least one component.")
    return components


def _load_csv(path: Path) -> list[Component]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames is None:
            raise ValueError("CSV input must include a header row.")
        _require_component_field(reader.fieldnames)
        return [_component_from_mapping(row, row_number=index) for index, row in enumerate(reader, start=2)]


def _load_json(path: Path) -> list[Component]:
    with path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)

    if not isinstance(payload, list):
        raise ValueError("JSON input must be a list of component objects.")

    components: list[Component] = []
    for index, item in enumerate(payload, start=1):
        if not isinstance(item, dict):
            raise ValueError(f"JSON item {index} must be an object.")
        components.append(_component_from_mapping(item, row_number=index))
    return components


def _require_component_field(fieldnames: Iterable[str]) -> None:
    normalized = {field.strip().lower() for field in fieldnames}
    if "component" not in normalized:
        raise ValueError("Input must include a 'component' field.")


def _component_from_mapping(row: dict[str, object], row_number: int) -> Component:
    normalized = {str(key).strip().lower(): value for key, value in row.items()}
    component = _clean_text(normalized.get("component"))
    if not component:
        raise ValueError(f"Component is required at row/item {row_number}.")
    return Component(
        partner=_clean_text(normalized.get("partner")),
        task=_clean_text(normalized.get("task")),
        component=component,
    )


def _clean_text(value: object) -> str:
    if value is None:
        return ""
    return str(value).strip()
