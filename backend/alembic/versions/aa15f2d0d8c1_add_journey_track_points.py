"""add journey track points

Revision ID: aa15f2d0d8c1
Revises: f7ef8076334d
Create Date: 2026-06-29 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import geoalchemy2
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'aa15f2d0d8c1'
down_revision: Union[str, None] = 'f7ef8076334d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'journey_track_points',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('journey_id', sa.UUID(), nullable=False),
        sa.Column(
            'location',
            geoalchemy2.types.Geography(
                geometry_type='POINT',
                srid=4326,
                dimension=2,
                spatial_index=True,
            ),
            nullable=False,
        ),
        sa.Column('speed_kmh', sa.Numeric(6, 2), nullable=True),
        sa.Column('altitude_m', sa.Numeric(7, 2), nullable=True),
        sa.Column('is_off_route', sa.Boolean(), nullable=False),
        sa.Column('recorded_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['journey_id'], ['journeys.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_journey_track_points_journey_id'), 'journey_track_points', ['journey_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_journey_track_points_journey_id'), table_name='journey_track_points')
    op.drop_table('journey_track_points')
