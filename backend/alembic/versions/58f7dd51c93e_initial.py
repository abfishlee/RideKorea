"""initial

Revision ID: 58f7dd51c93e
Revises: None
Create Date: 2026-06-24 16:39:57.258600

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import geoalchemy2
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '58f7dd51c93e'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create courses table
    op.create_table('courses',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('name_en', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('description_en', sa.Text(), nullable=True),
        sa.Column('distance_km', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('estimated_days_min', sa.Integer(), nullable=False),
        sa.Column('estimated_days_max', sa.Integer(), nullable=False),
        sa.Column('difficulty', sa.String(length=10), nullable=False),
        sa.Column('route_geometry', geoalchemy2.types.Geometry(geometry_type='LINESTRING', srid=4326, dimension=2, from_text='ST_GeomFromEWKT', name='geometry', nullable=False), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # 2. Create users table
    op.create_table('users',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('social_id', sa.String(), nullable=False),
        sa.Column('provider', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('display_name', sa.String(), nullable=True),
        sa.Column('profile_photo_url', sa.String(), nullable=True),
        sa.Column('preferred_language', sa.String(length=5), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_social_id'), 'users', ['social_id'], unique=True)
    
    # 3. Create spots table (indexes will be auto-created by GeoAlchemy2)
    op.create_table('spots',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('course_id', sa.UUID(), nullable=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('name_en', sa.String(), nullable=False),
        sa.Column('type', sa.String(length=30), nullable=False),
        sa.Column('location', geoalchemy2.types.Geography(geometry_type='POINT', srid=4326, dimension=2, from_text='ST_GeogFromText', name='geography', nullable=False), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('description_en', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # 4. Create journeys table
    op.create_table('journeys',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('course_id', sa.UUID(), nullable=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('status', sa.String(length=15), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('visibility', sa.String(length=10), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # 5. Create spot_diaries table
    op.create_table('spot_diaries',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('journey_id', sa.UUID(), nullable=False),
        sa.Column('spot_id', sa.UUID(), nullable=True),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('diary_text', sa.Text(), nullable=True),
        sa.Column('photo_urls', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('visited_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('visibility', sa.String(length=10), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['journey_id'], ['journeys.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['spot_id'], ['spots.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('spot_diaries')
    op.drop_table('journeys')
    op.drop_table('spots')
    op.drop_table('users')
    op.drop_table('courses')
