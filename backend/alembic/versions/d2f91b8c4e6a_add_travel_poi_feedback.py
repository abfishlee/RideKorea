"""add travel poi feedback

Revision ID: d2f91b8c4e6a
Revises: 9d4c2f61b7e0
Create Date: 2026-06-30 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "d2f91b8c4e6a"
down_revision: Union[str, None] = "9d4c2f61b7e0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "travel_pois",
        sa.Column("recommend_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "travel_pois",
        sa.Column("caution_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_table(
        "travel_poi_feedback",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("poi_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("feedback_type", sa.String(length=12), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["poi_id"], ["travel_pois.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("poi_id", "user_id", name="uq_travel_poi_feedback_poi_user"),
    )
    op.create_index(op.f("ix_travel_poi_feedback_poi_id"), "travel_poi_feedback", ["poi_id"], unique=False)
    op.create_index(op.f("ix_travel_poi_feedback_user_id"), "travel_poi_feedback", ["user_id"], unique=False)
    op.alter_column("travel_pois", "recommend_count", server_default=None)
    op.alter_column("travel_pois", "caution_count", server_default=None)


def downgrade() -> None:
    op.drop_index(op.f("ix_travel_poi_feedback_user_id"), table_name="travel_poi_feedback")
    op.drop_index(op.f("ix_travel_poi_feedback_poi_id"), table_name="travel_poi_feedback")
    op.drop_table("travel_poi_feedback")
    op.drop_column("travel_pois", "caution_count")
    op.drop_column("travel_pois", "recommend_count")
