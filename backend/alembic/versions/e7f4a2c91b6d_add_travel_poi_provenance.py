"""add travel poi provenance

Revision ID: e7f4a2c91b6d
Revises: d2f91b8c4e6a
Create Date: 2026-06-30 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e7f4a2c91b6d"
down_revision: Union[str, None] = "d2f91b8c4e6a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("travel_pois", sa.Column("source_url", sa.String(), nullable=True))
    op.add_column("travel_pois", sa.Column("source_name", sa.String(), nullable=True))
    op.add_column("travel_pois", sa.Column("license_type", sa.String(length=50), nullable=True))
    op.add_column("travel_pois", sa.Column("attribution", sa.Text(), nullable=True))
    op.add_column("travel_pois", sa.Column("retrieved_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "travel_pois",
        sa.Column("review_status", sa.String(length=20), nullable=False, server_default="approved"),
    )
    op.alter_column("travel_pois", "review_status", server_default=None)


def downgrade() -> None:
    op.drop_column("travel_pois", "review_status")
    op.drop_column("travel_pois", "retrieved_at")
    op.drop_column("travel_pois", "attribution")
    op.drop_column("travel_pois", "license_type")
    op.drop_column("travel_pois", "source_name")
    op.drop_column("travel_pois", "source_url")
