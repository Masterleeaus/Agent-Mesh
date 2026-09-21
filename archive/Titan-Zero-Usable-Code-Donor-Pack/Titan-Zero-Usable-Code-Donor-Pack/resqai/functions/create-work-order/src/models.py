from typing import Optional
from pydantic import BaseModel, Field


class CreateWorkOrderInput(BaseModel):
    appointment_id: str = Field(description="The appointment UUID this work order belongs to.")
    technician_id: str = Field(description="The technician UUID assigned to the work order.")
    customer_id: str = Field(description="The customer UUID.")
    service_description: str = Field(description="Description of the service to be performed.")
    customer_notes: Optional[str] = Field(default=None, description="Optional notes from the customer.")
    created_by: Optional[str] = Field(default=None, description="Actor creating the work order.")


class CreateWorkOrderOutput(BaseModel):
    status: str = Field(description="Operation result status: success, not_found, or error.")
    work_order_id: Optional[str] = Field(default=None, description="The created work order UUID.")
    error: Optional[str] = Field(default=None, description="Error detail if creation failed.")