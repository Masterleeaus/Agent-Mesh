import json
from pathlib import Path


def load_fixture(name: str, base_path: Path | None = None) -> list[dict]:
    if base_path is None:
        base_path = Path(__file__).parent.parent
    path = base_path / "tests" / "fixtures" / f"{name}.json"
    if path.exists():
        return json.loads(path.read_text())
    return []


def load_fixtures(base_path: Path, *names: str) -> list[list[dict]]:
    return [load_fixture(n, base_path) for n in names]


def build_id_lookup(items: list[dict], key: str = "id") -> dict[str, dict]:
    return {item[key]: item for item in items}


def build_group_lookup(
    items: list[dict], group_key: str
) -> dict[str, list[dict]]:
    result: dict[str, list[dict]] = {}
    for item in items:
        result.setdefault(item[group_key], []).append(item)
    return result
