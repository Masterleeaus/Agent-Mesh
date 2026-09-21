from typing import Optional
from pydantic import BaseModel, Field


class GetWorkOrderInput(BaseModel):
    work_order_id: str = Field(description="The work order UUID to retrieve.")


class GetWorkOrderOutput(BaseModel):
    status: str = Field(description="Operation result status: success, not_found, or error.")
    work_order: Optional[dict] = Field(default=None, description="The full work order record.")
    error: Optional[str] = Field(default=None, description="Error detail if retrieval failed.")