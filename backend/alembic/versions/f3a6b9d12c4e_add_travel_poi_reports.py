"""add travel poi reports

Revision ID: f3a6b9d12c4e
Revises: e7f4a2c91b6d
Create Date: 2026-06-30 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "f3a6b9d12c4e"
down_revision: Union[str, None] = "e7f4a2c91b6d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "travel_poi_reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("poi_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("report_type", sa.String(length=20), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="open"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["poi_id"], ["travel_pois.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_travel_poi_reports_poi_id"), "travel_poi_reports", ["poi_id"], unique=False)
    op.create_index(op.f("ix_travel_poi_reports_user_id"), "travel_poi_reports", ["user_id"], unique=False)
    op.alter_column("travel_poi_reports", "status", server_default=None)


def downgrade() -> None:
    op.drop_index(op.f("ix_travel_poi_reports_user_id"), table_name="travel_poi_reports")
    op.drop_index(op.f("ix_travel_poi_reports_poi_id"), table_name="travel_poi_reports")
    op.drop_table("travel_poi_reports")
