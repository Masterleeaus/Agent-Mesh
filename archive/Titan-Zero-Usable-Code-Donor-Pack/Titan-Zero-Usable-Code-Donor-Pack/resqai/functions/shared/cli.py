import json
import sys
from pydantic import BaseModel


def run_cli(input_model: type[BaseModel], run_fn, output_field: str | None = None) -> None:
    args = {}
    if len(sys.argv) > 1:
        args = json.loads(sys.argv[1])
    data = input_model(**args)
    result = run_fn(data)
    print(result.model_dump_json(indent=2))
