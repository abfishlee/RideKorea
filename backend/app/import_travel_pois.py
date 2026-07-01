"""CLI utility for importing external travel POI datasets.

Usage from the backend directory:
    python -m app.import_travel_pois data/travel_pois.csv --source public-data --dry-run
    python -m app.import_travel_pois data/travel_pois.csv --license-sidecar data/travel_poi_reviews.csv --dry-run
"""
from __future__ import annotations

import argparse
import asyncio
from pathlib import Path

from .database import AsyncSessionLocal
from .services.travel_poi_importer import import_poi_rows, load_poi_rows


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Import RideKorea travel POI data from CSV or JSON")
    parser.add_argument("path", type=Path, help="CSV or JSON file path")
    parser.add_argument(
        "--source",
        default="external",
        help="Default source value when a row does not include source",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate and summarize without writing to the database",
    )
    parser.add_argument(
        "--license-sidecar",
        type=Path,
        default=None,
        help="Optional CSV/JSON file with license review metadata keyed by source + external_id",
    )
    return parser.parse_args()


async def main() -> None:
    args = parse_args()
    rows, validation_issues = load_poi_rows(args.path, args.source, args.license_sidecar)

    async with AsyncSessionLocal() as session:
        result = await import_poi_rows(session, rows, dry_run=args.dry_run)

    all_issues = [*validation_issues, *result.issues]
    print(
        "Travel POI import summary: "
        f"valid_rows={len(rows)}, inserted={result.inserted}, "
        f"updated={result.updated}, skipped={result.skipped}, issues={len(all_issues)}, "
        f"dry_run={args.dry_run}"
    )

    for issue in all_issues:
        print(f"- row {issue.row_number}: {issue.message}")


if __name__ == "__main__":
    asyncio.run(main())
