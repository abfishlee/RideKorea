"""add voucher redemption metadata

Revision ID: c8e9f0a1b2c3
Revises: a8d4c0e79b2f
Create Date: 2026-07-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c8e9f0a1b2c3"
down_revision: Union[str, None] = "a8d4c0e79b2f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("vouchers", sa.Column("redeemed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("vouchers", sa.Column("redeemed_by_user_id", sa.UUID(), nullable=True))
    op.add_column("vouchers", sa.Column("redemption_source", sa.String(length=20), nullable=True))
    op.create_foreign_key(
        "fk_vouchers_redeemed_by_user_id_users",
        "vouchers",
        "users",
        ["redeemed_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_vouchers_redeemed_by_user_id_users", "vouchers", type_="foreignkey")
    op.drop_column("vouchers", "redemption_source")
    op.drop_column("vouchers", "redeemed_by_user_id")
    op.drop_column("vouchers", "redeemed_at")
