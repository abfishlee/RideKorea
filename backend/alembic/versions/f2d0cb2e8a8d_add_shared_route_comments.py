"""add shared route comments

Revision ID: f2d0cb2e8a8d
Revises: e49a31a9187c
Create Date: 2026-06-30 00:00:04.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f2d0cb2e8a8d'
down_revision: Union[str, None] = 'e49a31a9187c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'shared_route_comments',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('shared_route_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['shared_route_id'], ['shared_routes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_shared_route_comments_shared_route_id'), 'shared_route_comments', ['shared_route_id'], unique=False)
    op.create_index(op.f('ix_shared_route_comments_user_id'), 'shared_route_comments', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_shared_route_comments_user_id'), table_name='shared_route_comments')
    op.drop_index(op.f('ix_shared_route_comments_shared_route_id'), table_name='shared_route_comments')
    op.drop_table('shared_route_comments')
