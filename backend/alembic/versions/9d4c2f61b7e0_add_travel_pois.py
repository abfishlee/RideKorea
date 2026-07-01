"""add travel pois

Revision ID: 9d4c2f61b7e0
Revises: c4f5a7f0c2db
Create Date: 2026-06-30 00:00:03.000000

"""
from typing import Sequence, Union

from alembic import op
import geoalchemy2
import sqlalchemy as sa


revision: str = '9d4c2f61b7e0'
down_revision: Union[str, None] = 'c4f5a7f0c2db'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'travel_pois',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('name_en', sa.String(), nullable=False),
        sa.Column('category', sa.String(length=30), nullable=False),
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
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('description_en', sa.Text(), nullable=True),
        sa.Column('address', sa.String(), nullable=True),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('source', sa.String(length=50), nullable=True),
        sa.Column('external_id', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_travel_pois_category'), 'travel_pois', ['category'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_travel_pois_category'), table_name='travel_pois')
    op.drop_table('travel_pois')
