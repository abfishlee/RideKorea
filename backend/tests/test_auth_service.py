import unittest
from unittest.mock import patch

from app.services import auth_service


class FakeScalarResult:
    def __init__(self, value=None):
        self.value = value

    def first(self):
        return self.value


class FakeExecuteResult:
    def __init__(self, scalar=None):
        self.scalar = scalar

    def scalars(self):
        return FakeScalarResult(value=self.scalar)


class FakeDb:
    def __init__(self, *execute_results):
        self.execute_results = list(execute_results)
        self.added = []
        self.committed = False
        self.refreshed = []

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


class DevLoginTest(unittest.IsolatedAsyncioTestCase):
    @patch("app.services.auth_service._ensure_dev_preview_data")
    async def test_dev_login_creates_stable_local_user(self, ensure_preview_data):
        db = FakeDb(FakeExecuteResult(), FakeExecuteResult())

        user = await auth_service.authenticate_dev_user(db)

        self.assertEqual(user.social_id, "ridekorea-dev-user")
        self.assertEqual(user.provider, "dev")
        self.assertEqual(user.email, "dev@ridekorea.local")
        self.assertEqual(user.display_name, "Dev Rider")
        self.assertEqual(user.preferred_language, "ko")
        self.assertEqual(db.added, [user])
        self.assertTrue(db.committed)
        self.assertEqual(db.refreshed, [user])
        ensure_preview_data.assert_awaited_once_with(db, user)


if __name__ == "__main__":
    unittest.main()
