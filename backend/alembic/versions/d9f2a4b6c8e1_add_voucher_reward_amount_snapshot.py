"""add voucher reward amount snapshot

Revision ID: d9f2a4b6c8e1
Revises: c8e9f0a1b2c3
Create Date: 2026-07-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d9f2a4b6c8e1"
down_revision: Union[str, None] = "c8e9f0a1b2c3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "vouchers",
        sa.Column("reward_amount", sa.Integer(), server_default="5000", nullable=False),
    )
    op.alter_column("vouchers", "reward_amount", server_default=None)


def downgrade() -> None:
    op.drop_column("vouchers", "reward_amount")
