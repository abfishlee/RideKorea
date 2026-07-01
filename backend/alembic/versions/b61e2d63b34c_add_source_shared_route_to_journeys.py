"""add source shared route to journeys

Revision ID: b61e2d63b34c
Revises: a3b1c52909da
Create Date: 2026-06-30 00:00:06.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b61e2d63b34c'
down_revision: Union[str, None] = 'a3b1c52909da'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('journeys', sa.Column('source_shared_route_id', sa.UUID(), nullable=True))
    op.create_foreign_key(
        'fk_journeys_source_shared_route_id_shared_routes',
        'journeys',
        'shared_routes',
        ['source_shared_route_id'],
        ['id'],
        ondelete='SET NULL',
    )


def downgrade() -> None:
    op.drop_constraint('fk_journeys_source_shared_route_id_shared_routes', 'journeys', type_='foreignkey')
    op.drop_column('journeys', 'source_shared_route_id')
