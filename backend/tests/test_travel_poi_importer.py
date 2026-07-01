import csv
import json
import tempfile
import unittest
from pathlib import Path

from app.services.travel_poi_importer import load_license_reviews, load_poi_rows


class TravelPoiImporterTest(unittest.TestCase):
    def test_loads_csv_rows_with_license_sidecar(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            data_path = Path(temp_dir) / "pois.csv"
            sidecar_path = Path(temp_dir) / "licenses.csv"

            self._write_csv(
                data_path,
                [
                    {
                        "external_id": "repair-1",
                        "source": "demo",
                        "name": "Ara Repair",
                        "name_en": "Ara Repair",
                        "category": "repair",
                        "lat": "37.5619",
                        "lng": "126.6011",
                    },
                ],
            )
            self._write_csv(
                sidecar_path,
                [
                    {
                        "external_id": "repair-1",
                        "source": "demo",
                        "source_url": "https://example.test/source",
                        "source_name": "Example Dataset",
                        "license_type": "KOGL Type 1",
                        "attribution": "Example",
                        "retrieved_at": "2026-06-30T00:00:00+09:00",
                        "review_status": "approved",
                        "commercial_use_allowed": "true",
                        "derivative_allowed": "true",
                    },
                ],
            )

            rows, issues = load_poi_rows(data_path, license_sidecar_path=sidecar_path)

            self.assertEqual(issues, [])
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0].review_status, "approved")
            self.assertEqual(rows[0].source_url, "https://example.test/source")
            self.assertEqual(rows[0].license_type, "KOGL Type 1")

    def test_missing_sidecar_review_marks_row_needs_review(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            data_path = Path(temp_dir) / "pois.csv"
            sidecar_path = Path(temp_dir) / "licenses.csv"

            self._write_csv(
                data_path,
                [
                    {
                        "external_id": "food-1",
                        "source": "demo",
                        "name": "Rider Meal",
                        "category": "food",
                        "lat": "37.5318",
                        "lng": "126.9216",
                    },
                ],
            )
            self._write_csv(
                sidecar_path,
                [
                    {
                        "external_id": "other-id",
                        "source": "demo",
                        "source_url": "https://example.test/source",
                        "source_name": "Example Dataset",
                        "license_type": "KOGL Type 1",
                        "retrieved_at": "2026-06-30T00:00:00+09:00",
                        "review_status": "approved",
                        "commercial_use_allowed": "true",
                        "derivative_allowed": "true",
                    },
                ],
            )

            rows, issues = load_poi_rows(data_path, license_sidecar_path=sidecar_path)

            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0].review_status, "needs-review")
            self.assertEqual(len(issues), 1)
            self.assertIn("license sidecar row is required", issues[0].message)

    def test_rejects_invalid_category_and_coordinates(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            data_path = Path(temp_dir) / "pois.json"
            data_path.write_text(
                json.dumps(
                    [
                        {
                            "external_id": "bad-category",
                            "name": "Bad Category",
                            "category": "museum",
                            "lat": 37.0,
                            "lng": 127.0,
                        },
                        {
                            "external_id": "bad-lat",
                            "name": "Bad Latitude",
                            "category": "culture",
                            "lat": 100,
                            "lng": 127.0,
                        },
                    ]
                ),
                encoding="utf-8",
            )

            rows, issues = load_poi_rows(data_path)

            self.assertEqual(rows, [])
            self.assertEqual(len(issues), 2)
            self.assertIn("category must be one of", issues[0].message)
            self.assertEqual(issues[1].message, "lat must be between -90 and 90")

    def test_approved_license_requires_commercial_derivative_and_retrieved_at(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            sidecar_path = Path(temp_dir) / "licenses.csv"
            self._write_csv(
                sidecar_path,
                [
                    {
                        "external_id": "transport-1",
                        "source_url": "https://example.test/source",
                        "source_name": "Example Dataset",
                        "license_type": "KOGL Type 1",
                        "review_status": "approved",
                        "commercial_use_allowed": "false",
                        "derivative_allowed": "true",
                        "retrieved_at": "2026-06-30T00:00:00+09:00",
                    },
                    {
                        "external_id": "transport-2",
                        "source_url": "https://example.test/source",
                        "source_name": "Example Dataset",
                        "license_type": "KOGL Type 1",
                        "review_status": "approved",
                        "commercial_use_allowed": "true",
                        "derivative_allowed": "false",
                        "retrieved_at": "2026-06-30T00:00:00+09:00",
                    },
                    {
                        "external_id": "transport-3",
                        "source_url": "https://example.test/source",
                        "source_name": "Example Dataset",
                        "license_type": "KOGL Type 1",
                        "review_status": "approved",
                        "commercial_use_allowed": "true",
                        "derivative_allowed": "true",
                    },
                ],
            )

            reviews, issues = load_license_reviews(sidecar_path)

            self.assertEqual(reviews, [])
            self.assertEqual(len(issues), 3)
            self.assertIn("commercial_use_allowed=true", issues[0].message)
            self.assertIn("derivative_allowed=true", issues[1].message)
            self.assertIn("retrieved_at", issues[2].message)

    def test_transport_fields_are_normalized(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            data_path = Path(temp_dir) / "pois.csv"
            self._write_csv(
                data_path,
                [
                    {
                        "external_id": "airport-1",
                        "name": "Airport Transfer",
                        "category": "transport",
                        "lat": "37.4602",
                        "lng": "126.4407",
                        "transport_mode": "airport",
                        "route_name": "Incheon to Ara",
                        "packing_required": "yes",
                        "is_active": "active",
                    },
                ],
            )

            rows, issues = load_poi_rows(data_path)

            self.assertEqual(issues, [])
            self.assertEqual(rows[0].name_en, "Airport Transfer")
            self.assertEqual(rows[0].source, "external")
            self.assertTrue(rows[0].packing_required)
            self.assertTrue(rows[0].is_active)

    def _write_csv(self, path: Path, rows: list[dict[str, str]]) -> None:
        fieldnames = sorted({key for row in rows for key in row.keys()})
        with path.open("w", encoding="utf-8", newline="") as file:
            writer = csv.DictWriter(file, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)


if __name__ == "__main__":
    unittest.main()
