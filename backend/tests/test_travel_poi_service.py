import unittest
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from uuid import uuid4

from app.core.exceptions import ValidationError
from app.services import travel_poi_service


class FakeScalarResult:
    def __init__(self, value):
        self.value = value

    def first(self):
        return self.value


class FakeExecuteResult:
    def __init__(self, *, scalar=None, first_row=None, one_row=None, all_rows=None):
        self.scalar = scalar
        self.first_row = first_row
        self.one_row = one_row
        self.all_rows = all_rows or []

    def scalars(self):
        return FakeScalarResult(self.scalar)

    def first(self):
        return self.first_row

    def one(self):
        return self.one_row

    def all(self):
        return self.all_rows


class FakeDb:
    def __init__(self, *execute_results):
        self.execute_results = list(execute_results)
        self.added = []
        self.deleted = []
        self.refreshed = []
        self.committed = False

    async def execute(self, _query):
        if not self.execute_results:
            raise AssertionError("Unexpected execute call")
        return self.execute_results.pop(0)

    def add(self, item):
        self.added.append(item)

    async def delete(self, item):
        self.deleted.append(item)

    async def commit(self):
        self.committed = True

    async def refresh(self, item):
        self.refreshed.append(item)


def make_poi(**overrides):
    defaults = {
        "id": uuid4(),
        "name": "Ara Repair",
        "name_en": "Ara Repair",
        "category": "repair",
        "description": None,
        "description_en": None,
        "address": None,
        "phone": None,
        "source": "demo",
        "external_id": "repair-1",
        "source_url": None,
        "source_name": None,
        "license_type": None,
        "attribution": None,
        "retrieved_at": None,
        "review_status": "approved",
        "transport_mode": None,
        "route_name": None,
        "bike_policy": None,
        "bike_policy_en": None,
        "packing_required": None,
        "packing_notes": None,
        "packing_notes_en": None,
        "booking_url": None,
        "recommend_count": 0,
        "caution_count": 0,
        "is_active": True,
        "created_at": datetime(2026, 6, 30, tzinfo=timezone.utc),
    }
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


class FeedbackDeltaTest(unittest.TestCase):
    def test_feedback_delta_never_drops_below_zero(self):
        poi = make_poi(recommend_count=0, caution_count=0)

        travel_poi_service._apply_feedback_delta(poi, "recommend", -1)
        travel_poi_service._apply_feedback_delta(poi, "caution", -1)

        self.assertEqual(0, poi.recommend_count)
        self.assertEqual(0, poi.caution_count)

    def test_feedback_delta_rejects_unknown_type(self):
        poi = make_poi()

        with self.assertRaises(ValidationError):
            travel_poi_service._apply_feedback_delta(poi, "bookmark", 1)


class SetFeedbackTest(unittest.IsolatedAsyncioTestCase):
    async def test_new_feedback_increments_matching_counter(self):
        poi = make_poi(recommend_count=2, caution_count=1)
        db = FakeDb(
            FakeExecuteResult(scalar=poi),
            FakeExecuteResult(scalar=None),
        )
        user = SimpleNamespace(id=uuid4())
        response = SimpleNamespace(id=poi.id)

        with patch.object(travel_poi_service, "_get_poi_response", new=AsyncMock(return_value=response)):
            feedback_type, poi_response = await travel_poi_service.set_feedback(
                db,
                user,
                poi.id,
                "recommend",
            )

        self.assertEqual("recommend", feedback_type)
        self.assertEqual(response, poi_response)
        self.assertEqual(3, poi.recommend_count)
        self.assertEqual(1, poi.caution_count)
        self.assertEqual(1, len(db.added))
        self.assertEqual("recommend", db.added[0].feedback_type)
        self.assertTrue(db.committed)

    async def test_same_feedback_toggles_off_and_decrements_counter(self):
        poi = make_poi(recommend_count=1, caution_count=0)
        existing_feedback = SimpleNamespace(feedback_type="recommend")
        db = FakeDb(
            FakeExecuteResult(scalar=poi),
            FakeExecuteResult(scalar=existing_feedback),
        )

        with patch.object(travel_poi_service, "_get_poi_response", new=AsyncMock(return_value=SimpleNamespace(id=poi.id))):
            feedback_type, _poi_response = await travel_poi_service.set_feedback(
                db,
                SimpleNamespace(id=uuid4()),
                poi.id,
                "recommend",
            )

        self.assertIsNone(feedback_type)
        self.assertEqual(0, poi.recommend_count)
        self.assertEqual([existing_feedback], db.deleted)
        self.assertTrue(db.committed)

    async def test_switching_feedback_moves_counter(self):
        poi = make_poi(recommend_count=1, caution_count=0)
        existing_feedback = SimpleNamespace(feedback_type="recommend")
        db = FakeDb(
            FakeExecuteResult(scalar=poi),
            FakeExecuteResult(scalar=existing_feedback),
        )

        with patch.object(travel_poi_service, "_get_poi_response", new=AsyncMock(return_value=SimpleNamespace(id=poi.id))):
            feedback_type, _poi_response = await travel_poi_service.set_feedback(
                db,
                SimpleNamespace(id=uuid4()),
                poi.id,
                "caution",
            )

        self.assertEqual("caution", feedback_type)
        self.assertEqual("caution", existing_feedback.feedback_type)
        self.assertEqual(0, poi.recommend_count)
        self.assertEqual(1, poi.caution_count)
        self.assertTrue(db.committed)

    async def test_invalid_feedback_type_is_rejected_before_db_query(self):
        db = FakeDb()

        with self.assertRaises(ValidationError):
            await travel_poi_service.set_feedback(
                db,
                SimpleNamespace(id=uuid4()),
                uuid4(),
                "bookmark",
            )

        self.assertEqual([], db.added)
        self.assertFalse(db.committed)


class ReportTest(unittest.IsolatedAsyncioTestCase):
    async def test_create_report_marks_approved_poi_as_needs_review(self):
        poi = make_poi(review_status="approved")
        user = SimpleNamespace(id=uuid4(), display_name="Sasaki", profile_photo_url=None)
        db = FakeDb(FakeExecuteResult(first_row=(poi, '{"type":"Point","coordinates":[126.6,37.5]}')))
        response = SimpleNamespace(id=uuid4())

        with patch.object(travel_poi_service, "_report_to_response", return_value=response) as to_response:
            result = await travel_poi_service.create_report(
                db,
                user,
                poi.id,
                SimpleNamespace(report_type="wrong_location", note="Pin is across the river"),
            )

        self.assertEqual(response, result)
        self.assertEqual("needs-review", poi.review_status)
        self.assertEqual(1, len(db.added))
        self.assertEqual("wrong_location", db.added[0].report_type)
        self.assertEqual("open", db.added[0].status)
        self.assertTrue(db.committed)
        self.assertEqual([db.added[0], poi], db.refreshed)
        to_response.assert_called_once()

    async def test_invalid_report_type_is_rejected_before_db_query(self):
        db = FakeDb()

        with self.assertRaises(ValidationError):
            await travel_poi_service.create_report(
                db,
                SimpleNamespace(id=uuid4()),
                uuid4(),
                SimpleNamespace(report_type="spam", note=None),
            )

        self.assertEqual([], db.added)
        self.assertFalse(db.committed)


class AdminReportStatusTest(unittest.IsolatedAsyncioTestCase):
    async def test_resolved_report_sets_resolved_at(self):
        report = SimpleNamespace(id=uuid4(), status="open", resolved_at=None)
        poi = make_poi()
        author = SimpleNamespace(id=uuid4(), display_name="Sasaki", profile_photo_url=None)
        response = SimpleNamespace(id=report.id, status="resolved")
        db = FakeDb(
            FakeExecuteResult(first_row=(report, poi, '{"type":"Point","coordinates":[126.6,37.5]}', author)),
            FakeExecuteResult(one_row=(report, poi, '{"type":"Point","coordinates":[126.6,37.5]}', author)),
        )

        with patch.object(travel_poi_service, "_report_to_response", return_value=response):
            result = await travel_poi_service.admin_update_report_status(db, report.id, "resolved")

        self.assertEqual(response, result)
        self.assertEqual("resolved", report.status)
        self.assertIsNotNone(report.resolved_at)
        self.assertTrue(db.committed)
        self.assertEqual([report], db.refreshed)

    async def test_reopening_report_clears_resolved_at(self):
        report = SimpleNamespace(
            id=uuid4(),
            status="resolved",
            resolved_at=datetime(2026, 6, 30, tzinfo=timezone.utc),
        )
        poi = make_poi()
        author = SimpleNamespace(id=uuid4(), display_name="Sasaki", profile_photo_url=None)
        db = FakeDb(
            FakeExecuteResult(first_row=(report, poi, '{"type":"Point","coordinates":[126.6,37.5]}', author)),
            FakeExecuteResult(one_row=(report, poi, '{"type":"Point","coordinates":[126.6,37.5]}', author)),
        )

        with patch.object(travel_poi_service, "_report_to_response", return_value=SimpleNamespace(id=report.id)):
            await travel_poi_service.admin_update_report_status(db, report.id, "open")

        self.assertEqual("open", report.status)
        self.assertIsNone(report.resolved_at)

    async def test_invalid_report_status_is_rejected_before_db_query(self):
        db = FakeDb()

        with self.assertRaises(ValidationError):
            await travel_poi_service.admin_update_report_status(db, uuid4(), "archived")

        self.assertFalse(db.committed)


if __name__ == "__main__":
    unittest.main()
