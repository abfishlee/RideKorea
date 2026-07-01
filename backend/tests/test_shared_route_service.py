import unittest
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from uuid import uuid4

from app.core.constants import Visibility
from app.core.exceptions import ValidationError
from app.schemas import SharedRouteResponse
from app.services import shared_route_service


class FakeScalarResult:
    def __init__(self, values=None, value=None):
        self.values = values or []
        self.value = value

    def first(self):
        return self.value

    def one(self):
        if self.value is not None:
            return self.value
        if len(self.values) != 1:
            raise AssertionError("Expected exactly one scalar value")
        return self.values[0]

    def all(self):
        return self.values


class FakeExecuteResult:
    def __init__(self, *, scalar=None, scalars=None):
        self.scalar = scalar
        self.scalars_list = scalars

    def scalars(self):
        return FakeScalarResult(values=self.scalars_list, value=self.scalar)


class FakeDb:
    def __init__(self, *execute_results):
        self.execute_results = list(execute_results)
        self.added = []
        self.refreshed = []
        self.committed = False

    async def execute(self, _query):
        if not self.execute_results:
            raise AssertionError("Unexpected execute call")
        return self.execute_results.pop(0)

    def add(self, item):
        self.added.append(item)

    async def commit(self):
        self.committed = True

    async def refresh(self, item):
        self.refreshed.append(item)


def make_route(**overrides):
    defaults = {
        "id": uuid4(),
        "user_id": uuid4(),
        "source_journey_id": None,
        "title": "금강 강변 투어",
        "summary": "대전까지 달린 강변 기록",
        "start_name": "금강하구둑",
        "end_name": "대전",
        "visibility": Visibility.PUBLIC.value,
        "like_count": 0,
        "comment_count": 0,
        "share_count": 0,
        "created_at": datetime(2026, 6, 30, tzinfo=timezone.utc),
        "user": SimpleNamespace(display_name="Peter", profile_photo_url=None),
        "stops": [],
    }
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


def make_route_response(route):
    return SharedRouteResponse(
        id=route.id,
        user_id=route.user_id,
        source_journey_id=route.source_journey_id,
        title=route.title,
        summary=route.summary,
        start_name=route.start_name,
        end_name=route.end_name,
        visibility=route.visibility,
        like_count=route.like_count,
        comment_count=route.comment_count,
        share_count=route.share_count,
        liked_by_me=True,
        created_at=route.created_at,
        author=route.user,
        stops=[],
    )


class SharedRouteSummaryTest(unittest.TestCase):
    def test_build_summary_uses_first_three_diary_titles(self):
        diaries = [
            SimpleNamespace(title="출발"),
            SimpleNamespace(title="수리점 발견"),
            SimpleNamespace(title="강변 점심"),
            SimpleNamespace(title="숙소 도착"),
        ]

        self.assertEqual("출발 / 수리점 발견 / 강변 점심", shared_route_service._build_summary(diaries))

    def test_build_summary_falls_back_when_titles_are_missing(self):
        self.assertEqual(
            "Journey timeline draft created from riding diaries.",
            shared_route_service._build_summary([SimpleNamespace(title=None)]),
        )


class ImportPublicRouteTest(unittest.IsolatedAsyncioTestCase):
    async def test_import_returns_existing_journey_without_creating_duplicate(self):
        route = make_route()
        existing_journey = SimpleNamespace(id=uuid4(), source_shared_route_id=route.id)
        db = FakeDb(FakeExecuteResult(scalar=existing_journey))

        with patch.object(shared_route_service, "_get_public_route_or_raise", new=AsyncMock(return_value=route)):
            result = await shared_route_service.import_public_route_as_journey(
                db,
                SimpleNamespace(id=uuid4()),
                route.id,
            )

        self.assertEqual(existing_journey, result)
        self.assertEqual([], db.added)
        self.assertFalse(db.committed)

    async def test_import_creates_private_planning_journey(self):
        route = make_route(title="베어링과 함께한 대전강변 투어")
        user = SimpleNamespace(id=uuid4())
        db = FakeDb(FakeExecuteResult(scalar=None))

        with patch.object(shared_route_service, "_get_public_route_or_raise", new=AsyncMock(return_value=route)):
            result = await shared_route_service.import_public_route_as_journey(db, user, route.id)

        self.assertEqual(result, db.added[0])
        self.assertEqual(user.id, result.user_id)
        self.assertEqual(route.id, result.source_shared_route_id)
        self.assertEqual("베어링과 함께한 대전강변 투어 준비", result.title)
        self.assertEqual("planning", result.status)
        self.assertEqual(Visibility.PRIVATE.value, result.visibility)
        self.assertTrue(db.committed)
        self.assertEqual([result], db.refreshed)


class LikePublicRouteTest(unittest.IsolatedAsyncioTestCase):
    async def test_existing_like_does_not_increment_again(self):
        route = make_route(like_count=7)
        user = SimpleNamespace(id=uuid4())
        db = FakeDb(FakeExecuteResult(scalar=SimpleNamespace(id=uuid4())))

        with (
            patch.object(shared_route_service, "_get_public_route_or_raise", new=AsyncMock(return_value=route)),
            patch.object(shared_route_service, "get_public_shared_route", new=AsyncMock(return_value=make_route_response(route))),
        ):
            result = await shared_route_service.like_public_route(db, user, route.id)

        self.assertTrue(result.liked)
        self.assertEqual(7, route.like_count)
        self.assertEqual([], db.added)
        self.assertFalse(db.committed)

    async def test_new_like_increments_once_and_persists(self):
        route = make_route(like_count=7)
        user = SimpleNamespace(id=uuid4())
        db = FakeDb(FakeExecuteResult(scalar=None))

        with (
            patch.object(shared_route_service, "_get_public_route_or_raise", new=AsyncMock(return_value=route)),
            patch.object(shared_route_service, "get_public_shared_route", new=AsyncMock(return_value=make_route_response(route))),
        ):
            result = await shared_route_service.like_public_route(db, user, route.id)

        self.assertTrue(result.liked)
        self.assertEqual(8, route.like_count)
        self.assertEqual(1, len(db.added))
        self.assertEqual(route.id, db.added[0].shared_route_id)
        self.assertEqual(user.id, db.added[0].user_id)
        self.assertTrue(db.committed)


class PublicCommentTest(unittest.IsolatedAsyncioTestCase):
    async def test_blank_comment_is_rejected_before_persisting(self):
        route = make_route(comment_count=3)
        db = FakeDb()

        with patch.object(shared_route_service, "_get_public_route_or_raise", new=AsyncMock(return_value=route)):
            with self.assertRaises(ValidationError):
                await shared_route_service.create_public_comment(
                    db,
                    SimpleNamespace(id=uuid4()),
                    route.id,
                    "   ",
                )

        self.assertEqual(3, route.comment_count)
        self.assertEqual([], db.added)
        self.assertFalse(db.committed)

    async def test_comment_is_trimmed_and_increments_count(self):
        route = make_route(comment_count=3)
        user = SimpleNamespace(id=uuid4(), display_name="Sasaki", profile_photo_url=None)
        returned_comment = SimpleNamespace(
            id=uuid4(),
            shared_route_id=route.id,
            user_id=user.id,
            body="정말 도움이 됐어요!",
            created_at=datetime(2026, 6, 30, tzinfo=timezone.utc),
            user=user,
        )
        db = FakeDb(FakeExecuteResult(scalar=returned_comment))

        with patch.object(shared_route_service, "_get_public_route_or_raise", new=AsyncMock(return_value=route)):
            result = await shared_route_service.create_public_comment(
                db,
                user,
                route.id,
                "  정말 도움이 됐어요!  ",
            )

        self.assertEqual("정말 도움이 됐어요!", db.added[0].body)
        self.assertEqual(4, route.comment_count)
        self.assertTrue(db.committed)
        self.assertEqual("정말 도움이 됐어요!", result.body)


if __name__ == "__main__":
    unittest.main()
