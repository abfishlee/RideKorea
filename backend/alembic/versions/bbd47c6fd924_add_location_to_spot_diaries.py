"""add location to spot diaries

Revision ID: bbd47c6fd924
Revises: aa15f2d0d8c1
Create Date: 2026-06-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import geoalchemy2
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bbd47c6fd924'
down_revision: Union[str, None] = 'aa15f2d0d8c1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'spot_diaries',
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
    )


def downgrade() -> None:
    op.drop_column('spot_diaries', 'location')
