from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .components import load_components
from .workbook import create_workbook, save_workbook


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="generate-integration-matrix",
        description="Generate an integration matrix Excel workbook from a component list.",
    )
    _add_generate_args(parser)

    subparsers = parser.add_subparsers(dest="command")
    generate = subparsers.add_parser("generate", help="Generate an .xlsx integration matrix workbook.")
    _add_generate_args(generate)
    generate.set_defaults(func=_generate)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if not hasattr(args, "func"):
        if args.input and args.output:
            args.func = _generate
        else:
            parser.error("provide --input and --output, or use the 'generate' subcommand")
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


def _add_generate_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--input", "-i", type=Path, help="Path to a .csv or .json component list.")
    parser.add_argument("--output", "-o", type=Path, help="Path for the generated .xlsx workbook.")
