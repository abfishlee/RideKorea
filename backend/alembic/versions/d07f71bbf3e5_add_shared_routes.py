"""add shared routes

Revision ID: d07f71bbf3e5
Revises: c3b8d1182f73
Create Date: 2026-06-30 00:00:02.000000

"""
from typing import Sequence, Union

from alembic import op
import geoalchemy2
import sqlalchemy as sa


revision: str = 'd07f71bbf3e5'
down_revision: Union[str, None] = 'c3b8d1182f73'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'shared_routes',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('source_journey_id', sa.UUID(), nullable=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('start_name', sa.String(), nullable=True),
        sa.Column('end_name', sa.String(), nullable=True),
        sa.Column('visibility', sa.String(length=10), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['source_journey_id'], ['journeys.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_shared_routes_user_id'), 'shared_routes', ['user_id'], unique=False)

    op.create_table(
        'shared_route_stops',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('shared_route_id', sa.UUID(), nullable=False),
        sa.Column('source_diary_id', sa.UUID(), nullable=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('body', sa.Text(), nullable=True),
        sa.Column(
            'location',
            geoalchemy2.types.Geography(
                geometry_type='POINT',
                srid=4326,
                dimension=2,
                spatial_index=True,
            ),
            nullable=True,
        ),
        sa.Column('photo_urls', sa.ARRAY(sa.String()), nullable=True),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['shared_route_id'], ['shared_routes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['source_diary_id'], ['spot_diaries.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_shared_route_stops_shared_route_id'), 'shared_route_stops', ['shared_route_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_shared_route_stops_shared_route_id'), table_name='shared_route_stops')
    op.drop_table('shared_route_stops')
    op.drop_index(op.f('ix_shared_routes_user_id'), table_name='shared_routes')
    op.drop_table('shared_routes')
