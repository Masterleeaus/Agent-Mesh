from typing import Optional
from pydantic import BaseModel, Field


class CreateInventoryItemInput(BaseModel):
    name: str = Field(description="Display name of the inventory item.")
    sku: str = Field(description="Stock-keeping unit identifier (must be unique).")
    description: Optional[str] = Field(default=None, description="Optional description of the item.")
    category: Optional[str] = Field(default=None, description="Item category for grouping.")
    unit_price_cents: int = Field(default=0, description="Price per unit in cents.")
    quantity_on_hand: int = Field(default=0, description="Current stock quantity.")
    reorder_threshold: int = Field(default=10, description="Quantity threshold that triggers reorder.")
    reorder_quantity: int = Field(default=50, description="Quantity to reorder when threshold is hit.")
    supplier_info: Optional[str] = Field(default=None, description="Supplier name or contact info.")
    created_by: Optional[str] = Field(default=None, description="Actor creating the item.")


class CreateInventoryItemOutput(BaseModel):
    status: str = Field(description="Operation result status: success, conflict, or error.")
    item_id: Optional[str] = Field(default=None, description="The created inventory item UUID.")
    error: Optional[str] = Field(default=None, description="Error detail if creation failed.")