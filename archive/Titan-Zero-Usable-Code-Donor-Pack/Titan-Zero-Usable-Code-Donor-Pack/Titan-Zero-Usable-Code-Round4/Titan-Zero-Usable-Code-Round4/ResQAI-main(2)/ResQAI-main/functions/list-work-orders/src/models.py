from typing import Optional
from pydantic import BaseModel, Field


class WorkOrderItem(BaseModel):
    work_order_id: str = Field(description="The work order UUID.")
    appointment_id: str = Field(description="The associated appointment UUID.")
    technician_id: str = Field(description="The assigned technician UUID.")
    customer_id: str = Field(description="The customer UUID.")
    status: str = Field(description="Current status of the work order.")
    service_description: str = Field(description="Description of service performed.")
    started_at: Optional[str] = Field(default=None, description="ISO timestamp when work started.")
    completed_at: Optional[str] = Field(default=None, description="ISO timestamp when work completed.")
    parts_used: Optional[list[dict]] = Field(default=None, description="Parts used on the work order.")
    photos: Optional[list[str]] = Field(default=None, description="Photo attachment URLs.")


class ListWorkOrdersInput(BaseModel):
    technician_id: Optional[str] = Field(default=None, description="Filter by technician UUID.")
    status: Optional[str] = Field(default=None, description="Filter by work order status.")
    appointment_id: Optional[str] = Field(default=None, description="Filter by appointment UUID.")
    limit: int = Field(default=100, description="Maximum number of work orders to return.")


class ListWorkOrdersOutput(BaseModel):
    total: int = Field(description="Total number of work orders matching the filters.")
    work_orders: list[WorkOrderItem] = Field(description="List of work order items.")