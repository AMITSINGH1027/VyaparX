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
    # ---------------------------------------------------------
    # Create sequence for:
    # VYPR-0001, VYPR-0002, VYPR-0003, ...
    # ---------------------------------------------------------
    op.execute(
        """
        CREATE SEQUENCE IF NOT EXISTS vyaparx_business_code_seq
        START WITH 1
        """
    )

    # ---------------------------------------------------------
    # Add unique_code temporarily as nullable
    # ---------------------------------------------------------
    op.add_column(
        "businesses",
        sa.Column(
            "unique_code",
            sa.String(length=20),
            nullable=True,
        ),
    )

    # ---------------------------------------------------------
    # Generate codes for existing businesses
    # ---------------------------------------------------------
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

    # ---------------------------------------------------------
    # Synchronize sequence
    #
    # If there are 0 businesses:
    #   set sequence to 1 and mark as NOT CALLED
    #   -> nextval() returns 1
    #
    # If there are N businesses:
    #   set sequence to N and mark as CALLED
    #   -> nextval() returns N + 1
    # ---------------------------------------------------------
    op.execute(
        """
        SELECT setval(
            'vyaparx_business_code_seq',
            GREATEST(COUNT(*), 1),
            COUNT(*) > 0
        )
        FROM businesses
        """
    )

    # ---------------------------------------------------------
    # Make unique_code required and auto-generated
    # ---------------------------------------------------------
    op.alter_column(
        "businesses",
        "unique_code",
        server_default=sa.text(
            "'VYPR-' || "
            "LPAD(nextval('vyaparx_business_code_seq')::text, 4, '0')"
        ),
        nullable=False,
    )

    # ---------------------------------------------------------
    # Unique constraint
    # ---------------------------------------------------------
    op.create_unique_constraint(
        "uq_businesses_unique_code",
        "businesses",
        ["unique_code"],
    )


def downgrade():
    # Remove unique constraint
    op.drop_constraint(
        "uq_businesses_unique_code",
        "businesses",
        type_="unique",
    )

    # Remove column
    op.drop_column(
        "businesses",
        "unique_code",
    )

    # Remove sequence
    op.execute(
        "DROP SEQUENCE IF EXISTS vyaparx_business_code_seq"
    )