from typing import Optional
from pydantic import BaseModel, Field


class UpdateInventoryItemInput(BaseModel):
    item_id: str = Field(description="The inventory item UUID to update.")
    name: Optional[str] = Field(default=None, description="New display name.")
    description: Optional[str] = Field(default=None, description="New description.")
    category: Optional[str] = Field(default=None, description="New category.")
    unit_price_cents: Optional[int] = Field(default=None, description="New unit price in cents.")
    quantity_on_hand: Optional[int] = Field(default=None, description="New stock quantity.")
    reorder_threshold: Optional[int] = Field(default=None, description="New reorder threshold.")
    reorder_quantity: Optional[int] = Field(default=None, description="New reorder quantity.")
    supplier_info: Optional[str] = Field(default=None, description="New supplier info.")
    updated_by: Optional[str] = Field(default=None, description="Actor updating the item.")


class UpdateInventoryItemOutput(BaseModel):
    status: str = Field(description="Operation result status: success, not_found, or error.")
    item_id: str = Field(description="The updated inventory item UUID.")
    error: Optional[str] = Field(default=None, description="Error detail if update failed.")