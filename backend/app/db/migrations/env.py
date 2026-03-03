"""
Alembic migration environment.
Configure target_metadata from app.db.base and sqlalchemy.url from app.core.config.
"""

import re
from logging.config import fileConfig

from alembic import context

from app.core.config import settings
from app.db.base import Base
from app.db.models import Note, Organization, User  # noqa: F401 - register with Base.metadata

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_url() -> str:
    """Use sync PostgreSQL URL for Alembic (replace asyncpg driver)."""
    url = settings.database_url
    if "+asyncpg" in url:
        url = re.sub(r"postgresql\+asyncpg", "postgresql", url)
    return url


def run_migrations_offline() -> None:
    context.configure(url=get_url(), target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    from sqlalchemy import create_engine
    from sqlalchemy.pool import NullPool

    connectable = create_engine(get_url(), poolclass=NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
