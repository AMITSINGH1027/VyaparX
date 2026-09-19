"""merge business profile and unique code migrations

Revision ID: d9cb270036a4
Revises: 4d1f3a6b7c82, add_business_unique_code
Create Date: 2026-09-19 15:42:38.190511
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'd9cb270036a4'
down_revision: Union[str, None] = ('4d1f3a6b7c82', 'add_business_unique_code')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
