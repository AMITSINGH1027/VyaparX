"""add oauth provider fields

Revision ID: 9d589c366de2
Revises: eb7458fa8a49
Create Date: 2026-09-24
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9d589c366de2"
down_revision: Union[str, None] = "eb7458fa8a49"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "auth_provider",
            sa.String(length=30),
            nullable=False,
            server_default="local",
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "provider_user_id",
            sa.String(length=255),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_users_auth_provider",
        "users",
        ["auth_provider"],
        unique=False,
    )

    op.create_index(
        "ix_users_provider_user_id",
        "users",
        ["provider_user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_users_provider_user_id",
        table_name="users",
    )

    op.drop_index(
        "ix_users_auth_provider",
        table_name="users",
    )

    op.drop_column(
        "users",
        "provider_user_id",
    )

    op.drop_column(
        "users",
        "auth_provider",
    )