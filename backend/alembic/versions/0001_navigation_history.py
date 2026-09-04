from alembic import op
import sqlalchemy as sa

revision = "0001_navigation_history"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "navigation_history",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("local_ip", sa.String(45), nullable=False),
        sa.Column("hostname", sa.String(255)),
        sa.Column("domain", sa.String(255), nullable=False),
        sa.Column("remote_ip", sa.String(45)),
        sa.Column("protocol", sa.String(50)),
        sa.Column("application", sa.String(100)),
        sa.Column("interface_id", sa.String(50)),
        sa.Column("event_key", sa.String(64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("event_key", name="uq_navigation_history_event_key"),
    )
    op.create_index("ix_navigation_history_timestamp", "navigation_history", ["timestamp"])
    op.create_index("ix_navigation_history_local_ip", "navigation_history", ["local_ip"])
    op.create_index("ix_navigation_history_domain", "navigation_history", ["domain"])
    op.create_index("ix_navigation_history_created_at", "navigation_history", ["created_at"])
    op.create_table(
        "sync_state",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("source", sa.String(100), nullable=False, unique=True),
        sa.Column("last_sync_timestamp", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_sync_state_source", "sync_state", ["source"])


def downgrade() -> None:
    op.drop_table("sync_state")
    op.drop_table("navigation_history")
