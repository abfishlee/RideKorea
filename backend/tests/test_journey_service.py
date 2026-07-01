import unittest
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from uuid import uuid4

from app.core.constants import JourneyStatus
from app.schemas import JourneyTrackBatchCreate
from app.services import journey_service


class FakeDb:
    def __init__(self):
        self.added_track_points = None
        self.committed = False

    def add_all(self, items):
        self.added_track_points = list(items)

    async def commit(self):
        self.committed = True


class JourneyStatusTimestampTest(unittest.TestCase):
    def test_riding_sets_started_at_once(self):
        journey = SimpleNamespace(
            status=JourneyStatus.PLANNING.value,
            started_at=None,
            completed_at=None,
        )

        journey_service._apply_status_timestamps(journey, JourneyStatus.RIDING.value)
        first_started_at = journey.started_at
        journey.status = JourneyStatus.RIDING.value
        journey_service._apply_status_timestamps(journey, JourneyStatus.RIDING.value)

        self.assertIsNotNone(first_started_at)
        self.assertEqual(first_started_at, journey.started_at)
        self.assertIsNone(journey.completed_at)

    def test_completed_sets_completed_at_without_overwriting_started_at(self):
        started_at = datetime(2026, 6, 30, 8, 0, tzinfo=timezone.utc)
        journey = SimpleNamespace(
            status=JourneyStatus.RIDING.value,
            started_at=started_at,
            completed_at=None,
        )

        journey_service._apply_status_timestamps(journey, JourneyStatus.COMPLETED.value)

        self.assertEqual(started_at, journey.started_at)
        self.assertIsNotNone(journey.completed_at)
        self.assertGreaterEqual(journey.completed_at, started_at)

    def test_paused_does_not_set_start_or_complete_time(self):
        journey = SimpleNamespace(
            status=JourneyStatus.PLANNING.value,
            started_at=None,
            completed_at=None,
        )

        journey_service._apply_status_timestamps(journey, JourneyStatus.PAUSED.value)

        self.assertIsNone(journey.started_at)
        self.assertIsNone(journey.completed_at)


class AddTrackPointsTest(unittest.IsolatedAsyncioTestCase):
    async def test_add_track_points_preserves_client_off_route_without_course(self):
        journey_id = uuid4()
        db = FakeDb()
        response = [SimpleNamespace(id=uuid4())]
        payload = JourneyTrackBatchCreate(
            points=[
                {
                    "location": {"lat": 37.5619, "lng": 126.6011},
                    "speed_kmh": 18.5,
                    "altitude_m": 8.2,
                    "is_off_route": True,
                    "recorded_at": "2026-06-30T09:00:00+09:00",
                }
            ]
        )

        with (
            patch.object(
                journey_service,
                "_get_owned_journey",
                new=AsyncMock(return_value=SimpleNamespace(id=journey_id, course_id=None)),
            ) as get_owned_journey,
            patch.object(journey_service, "_is_point_off_course", new=AsyncMock()) as is_off_course,
            patch.object(journey_service, "list_track_points", new=AsyncMock(return_value=response)) as list_track_points,
        ):
            result = await journey_service.add_track_points(db, SimpleNamespace(id=uuid4()), journey_id, payload)

        self.assertEqual(response, result)
        get_owned_journey.assert_awaited_once()
        is_off_course.assert_not_called()
        list_track_points.assert_awaited_once()
        self.assertTrue(db.committed)
        self.assertEqual(1, len(db.added_track_points))
        self.assertEqual(journey_id, db.added_track_points[0].journey_id)
        self.assertTrue(db.added_track_points[0].is_off_route)
        self.assertEqual(18.5, db.added_track_points[0].speed_kmh)
        self.assertEqual(8.2, db.added_track_points[0].altitude_m)

    async def test_add_track_points_uses_course_proximity_when_course_exists(self):
        journey_id = uuid4()
        course_id = uuid4()
        db = FakeDb()
        payload = JourneyTrackBatchCreate(
            points=[
                {
                    "location": {"lat": 35.1796, "lng": 129.0756},
                    "speed_kmh": None,
                    "altitude_m": None,
                    "is_off_route": False,
                    "recorded_at": "2026-06-30T11:00:00+09:00",
                }
            ]
        )

        with (
            patch.object(
                journey_service,
                "_get_owned_journey",
                new=AsyncMock(return_value=SimpleNamespace(id=journey_id, course_id=course_id)),
            ),
            patch.object(journey_service, "_is_point_off_course", new=AsyncMock(return_value=True)) as is_off_course,
            patch.object(journey_service, "list_track_points", new=AsyncMock(return_value=[])),
        ):
            await journey_service.add_track_points(db, SimpleNamespace(id=uuid4()), journey_id, payload)

        is_off_course.assert_awaited_once()
        self.assertEqual(1, len(db.added_track_points))
        self.assertTrue(db.added_track_points[0].is_off_route)


class JourneyTrackSummaryTest(unittest.TestCase):
    def test_summary_counts_points_duration_distance_and_off_route(self):
        journey_id = uuid4()
        summary = journey_service._summarize_track_points(
            journey_id,
            [
                {
                    "location": {"lat": 37.000, "lng": 127.000},
                    "recorded_at": datetime(2026, 6, 30, 9, 0, tzinfo=timezone.utc),
                    "is_off_route": False,
                },
                {
                    "location": {"lat": 37.001, "lng": 127.001},
                    "recorded_at": datetime(2026, 6, 30, 9, 10, tzinfo=timezone.utc),
                    "is_off_route": True,
                },
            ],
        )

        self.assertEqual(journey_id, summary.journey_id)
        self.assertEqual(2, summary.point_count)
        self.assertEqual(1, summary.off_route_count)
        self.assertEqual(600, summary.duration_seconds)
        self.assertGreater(summary.distance_km, 0)

    def test_summary_ignores_large_gps_jump(self):
        journey_id = uuid4()
        summary = journey_service._summarize_track_points(
            journey_id,
            [
                {
                    "location": {"lat": 37.000, "lng": 127.000},
                    "recorded_at": datetime(2026, 6, 30, 9, 0, tzinfo=timezone.utc),
                    "is_off_route": False,
                },
                {
                    "location": {"lat": 37.001, "lng": 127.001},
                    "recorded_at": datetime(2026, 6, 30, 9, 10, tzinfo=timezone.utc),
                    "is_off_route": False,
                },
                {
                    "location": {"lat": 38.000, "lng": 128.000},
                    "recorded_at": datetime(2026, 6, 30, 9, 20, tzinfo=timezone.utc),
                    "is_off_route": False,
                },
            ],
        )
        without_jump = journey_service._summarize_track_points(
            journey_id,
            [
                {
                    "location": {"lat": 37.000, "lng": 127.000},
                    "recorded_at": datetime(2026, 6, 30, 9, 0, tzinfo=timezone.utc),
                    "is_off_route": False,
                },
                {
                    "location": {"lat": 37.001, "lng": 127.001},
                    "recorded_at": datetime(2026, 6, 30, 9, 10, tzinfo=timezone.utc),
                    "is_off_route": False,
                },
            ],
        )

        self.assertAlmostEqual(without_jump.distance_km, summary.distance_km, places=4)
        self.assertEqual(3, summary.point_count)


if __name__ == "__main__":
    unittest.main()
