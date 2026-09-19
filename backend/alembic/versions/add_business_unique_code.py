"""add business unique code

Revision ID: add_business_unique_code
Revises: 8ab4a02595af
Create Date: 2026-09-19
"""

from alembic import op
import sqlalchemy as sa


revision = "add_business_unique_code"
down_revision = "8ab4a02595af"
branch_labels = None
depends_on = None


def upgrade():
    # Create sequence for VYPR-0001, VYPR-0002, ...
    op.execute(
        """
        CREATE SEQUENCE IF NOT EXISTS vyaparx_business_code_seq
        START WITH 1
        """
    )

    # Add column temporarily nullable
    op.add_column(
        "businesses",
        sa.Column(
            "unique_code",
            sa.String(length=20),
            nullable=True
        )
    )

    # Generate codes for existing businesses
    op.execute(
        """
        WITH numbered AS (
            SELECT
                id,
                ROW_NUMBER() OVER (ORDER BY id) AS row_num
            FROM businesses
        )
        UPDATE businesses b
        SET unique_code =
            'VYPR-' ||
            LPAD(numbered.row_num::text, 4, '0')
        FROM numbered
        WHERE b.id = numbered.id
        """
    )

    # Move sequence after existing records
    op.execute(
        """
        SELECT setval(
            'vyaparx_business_code_seq',
            COALESCE(
                (SELECT COUNT(*) FROM businesses),
                0
            )
        )
        """
    )

    # New businesses automatically get VYPR-XXXX
    op.alter_column(
        "businesses",
        "unique_code",
        server_default=sa.text(
            "'VYPR-' || LPAD(nextval('vyaparx_business_code_seq')::text, 4, '0')"
        ),
        nullable=False
    )

    # Unique constraint
    op.create_unique_constraint(
        "uq_businesses_unique_code",
        "businesses",
        ["unique_code"]
    )


def downgrade():
    op.drop_constraint(
        "uq_businesses_unique_code",
        "businesses",
        type_="unique"
    )

    op.drop_column(
        "businesses",
        "unique_code"
    )

    op.execute(
        "DROP SEQUENCE IF EXISTS vyaparx_business_code_seq"
    )