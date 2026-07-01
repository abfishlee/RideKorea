"""add shared route likes

Revision ID: a3b1c52909da
Revises: f2d0cb2e8a8d
Create Date: 2026-06-30 00:00:05.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a3b1c52909da'
down_revision: Union[str, None] = 'f2d0cb2e8a8d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'shared_route_likes',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('shared_route_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['shared_route_id'], ['shared_routes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('shared_route_id', 'user_id', name='uq_shared_route_likes_route_user'),
    )
    op.create_index(op.f('ix_shared_route_likes_shared_route_id'), 'shared_route_likes', ['shared_route_id'], unique=False)
    op.create_index(op.f('ix_shared_route_likes_user_id'), 'shared_route_likes', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_shared_route_likes_user_id'), table_name='shared_route_likes')
    op.drop_index(op.f('ix_shared_route_likes_shared_route_id'), table_name='shared_route_likes')
    op.drop_table('shared_route_likes')
