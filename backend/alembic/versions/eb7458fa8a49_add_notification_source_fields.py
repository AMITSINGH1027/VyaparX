"""add notification source fields

Revision ID: eb7458fa8a49
Revises: d9cb270036a4
Create Date: 2026-09-23 11:52:28.676132
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "eb7458fa8a49"
down_revision: Union[str, None] = "d9cb270036a4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "notifications",
        sa.Column(
            "source_type",
            sa.String(length=100),
            nullable=True,
        ),
    )

    op.add_column(
        "notifications",
        sa.Column(
            "source_id",
            sa.String(length=36),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_notifications_source",
        "notifications",
        ["business_id", "source_type", "source_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_notifications_source",
        table_name="notifications",
    )

    op.drop_column(
        "notifications",
        "source_id",
    )

    op.drop_column(
        "notifications",
        "source_type",
    )