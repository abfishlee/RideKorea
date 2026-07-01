"""add title to spot diaries

Revision ID: c3b8d1182f73
Revises: bbd47c6fd924
Create Date: 2026-06-30 00:00:01.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3b8d1182f73'
down_revision: Union[str, None] = 'bbd47c6fd924'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('spot_diaries', sa.Column('title', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('spot_diaries', 'title')
