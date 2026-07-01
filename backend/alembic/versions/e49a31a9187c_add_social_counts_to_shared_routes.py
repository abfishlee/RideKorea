"""add social counts to shared routes

Revision ID: e49a31a9187c
Revises: d07f71bbf3e5
Create Date: 2026-06-30 00:00:03.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e49a31a9187c'
down_revision: Union[str, None] = 'd07f71bbf3e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'shared_routes',
        sa.Column('like_count', sa.Integer(), server_default='0', nullable=False),
    )
    op.add_column(
        'shared_routes',
        sa.Column('comment_count', sa.Integer(), server_default='0', nullable=False),
    )
    op.add_column(
        'shared_routes',
        sa.Column('share_count', sa.Integer(), server_default='0', nullable=False),
    )
    op.alter_column('shared_routes', 'like_count', server_default=None)
    op.alter_column('shared_routes', 'comment_count', server_default=None)
    op.alter_column('shared_routes', 'share_count', server_default=None)


def downgrade() -> None:
    op.drop_column('shared_routes', 'share_count')
    op.drop_column('shared_routes', 'comment_count')
    op.drop_column('shared_routes', 'like_count')
