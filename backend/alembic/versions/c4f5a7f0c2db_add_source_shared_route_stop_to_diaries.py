"""add source shared route stop to diaries

Revision ID: c4f5a7f0c2db
Revises: b61e2d63b34c
Create Date: 2026-06-30 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c4f5a7f0c2db'
down_revision: Union[str, None] = 'b61e2d63b34c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('spot_diaries', sa.Column('source_shared_route_stop_id', sa.UUID(), nullable=True))
    op.create_foreign_key(
        'fk_spot_diaries_source_shared_route_stop_id_shared_route_stops',
        'spot_diaries',
        'shared_route_stops',
        ['source_shared_route_stop_id'],
        ['id'],
        ondelete='SET NULL',
    )


def downgrade() -> None:
    op.drop_constraint(
        'fk_spot_diaries_source_shared_route_stop_id_shared_route_stops',
        'spot_diaries',
        type_='foreignkey',
    )
    op.drop_column('spot_diaries', 'source_shared_route_stop_id')
