"""add business profile fields

Revision ID: 4d1f3a6b7c82
Revises: 8ab4a02595af
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '4d1f3a6b7c82'
down_revision: Union[str, None] = '8ab4a02595af'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('businesses', sa.Column('industry', sa.String(length=150), nullable=True))
    op.add_column('businesses', sa.Column('pan', sa.String(length=20), nullable=True))
    op.add_column('businesses', sa.Column('business_registration_number', sa.String(length=100), nullable=True))
    op.add_column('businesses', sa.Column('tax_type', sa.String(length=50), nullable=True))
    op.add_column('businesses', sa.Column('pincode', sa.String(length=10), nullable=True))


def downgrade() -> None:
    op.drop_column('businesses', 'pincode')
    op.drop_column('businesses', 'tax_type')
    op.drop_column('businesses', 'business_registration_number')
    op.drop_column('businesses', 'pan')
    op.drop_column('businesses', 'industry')
