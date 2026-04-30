from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .components import load_components
from .workbook import create_workbook, save_workbook


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="integration-matrix",
        description="Generate an integration matrix Excel workbook from a component list.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    generate = subparsers.add_parser("generate", help="Generate an .xlsx integration matrix workbook.")
    generate.add_argument("--input", "-i", required=True, type=Path, help="Path to a .csv or .json component list.")
    generate.add_argument("--output", "-o", required=True, type=Path, help="Path for the generated .xlsx workbook.")
    generate.set_defaults(func=_generate)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        args.func(args)
    except Exception as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    return 0


def _generate(args: argparse.Namespace) -> None:
    components = load_components(args.input)
    workbook = create_workbook(components)
    save_workbook(workbook, args.output)
    print(f"Generated {args.output} with {len(components)} components.")
