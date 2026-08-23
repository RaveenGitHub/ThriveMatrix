from pathlib import Path

from app.db import get_database_url


def test_relative_sqlite_database_url_is_resolved_to_an_absolute_path(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "sqlite:///api/data/thrivematrix_sessions.db")

    resolved = get_database_url()
    database_path = resolved.replace("sqlite:///", "", 1)

    assert Path(database_path).is_absolute()
    assert Path(database_path).resolve() == (Path(__file__).resolve().parents[1] / "data" / "thrivematrix_sessions.db").resolve()
