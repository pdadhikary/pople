"""add notify triggers for job status, metrics, geometry

Revision ID: 8257bb221256
Revises: 92d7a895789f
Create Date: 2026-08-17 11:38:32.280122

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "8257bb221256"
down_revision: str | Sequence[str] | None = "92d7a895789f"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("""
        CREATE OR REPLACE FUNCTION notify_row_insert()
        RETURNS trigger AS $$
        BEGIN
            PERFORM pg_notify(
                TG_ARGV[0],
                json_build_object('job_id', NEW.job_id, 'id', NEW.id)::text
            );
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    op.execute("""
        CREATE TRIGGER job_metric_insert_trigger
        AFTER INSERT ON jobmetric
        FOR EACH ROW EXECUTE FUNCTION notify_row_insert('job_metrics');
    """)

    op.execute("""
        CREATE TRIGGER geometry_step_insert_trigger
        AFTER INSERT ON geometrystep
        FOR EACH ROW EXECUTE FUNCTION notify_row_insert('job_geometry');
    """)

    op.execute("""
        CREATE OR REPLACE FUNCTION notify_job_status_change()
        RETURNS trigger AS $$
        BEGIN
            PERFORM pg_notify(
                'job_control',
                json_build_object(
                    'job_id', NEW.id,
                    'action', 'status_changed',
                    'status', NEW.status
                )::text
            );
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    op.execute("""
        CREATE TRIGGER job_status_change_trigger
        AFTER UPDATE OF status ON job
        FOR EACH ROW
        WHEN (OLD.status IS DISTINCT FROM NEW.status)
        EXECUTE FUNCTION notify_job_status_change();
    """)

def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP TRIGGER IF EXISTS job_status_change_trigger ON job;")
    op.execute("DROP FUNCTION IF EXISTS notify_job_status_change();")

    op.execute("DROP TRIGGER IF EXISTS job_metric_insert_trigger ON jobmetric;")
    op.execute("DROP TRIGGER IF EXISTS geometry_step_insert_trigger ON geometrystep;")
    op.execute("DROP FUNCTION IF EXISTS notify_row_insert();")
