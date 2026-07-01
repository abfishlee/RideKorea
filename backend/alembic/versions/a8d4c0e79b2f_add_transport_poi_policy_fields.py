"""add transport poi policy fields

Revision ID: a8d4c0e79b2f
Revises: f3a6b9d12c4e
Create Date: 2026-06-30 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a8d4c0e79b2f"
down_revision: Union[str, None] = "f3a6b9d12c4e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("travel_pois", sa.Column("transport_mode", sa.String(length=30), nullable=True))
    op.add_column("travel_pois", sa.Column("route_name", sa.String(), nullable=True))
    op.add_column("travel_pois", sa.Column("bike_policy", sa.Text(), nullable=True))
    op.add_column("travel_pois", sa.Column("bike_policy_en", sa.Text(), nullable=True))
    op.add_column("travel_pois", sa.Column("packing_required", sa.Boolean(), nullable=True))
    op.add_column("travel_pois", sa.Column("packing_notes", sa.Text(), nullable=True))
    op.add_column("travel_pois", sa.Column("packing_notes_en", sa.Text(), nullable=True))
    op.add_column("travel_pois", sa.Column("booking_url", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("travel_pois", "booking_url")
    op.drop_column("travel_pois", "packing_notes_en")
    op.drop_column("travel_pois", "packing_notes")
    op.drop_column("travel_pois", "packing_required")
    op.drop_column("travel_pois", "bike_policy_en")
    op.drop_column("travel_pois", "bike_policy")
    op.drop_column("travel_pois", "route_name")
    op.drop_column("travel_pois", "transport_mode")
