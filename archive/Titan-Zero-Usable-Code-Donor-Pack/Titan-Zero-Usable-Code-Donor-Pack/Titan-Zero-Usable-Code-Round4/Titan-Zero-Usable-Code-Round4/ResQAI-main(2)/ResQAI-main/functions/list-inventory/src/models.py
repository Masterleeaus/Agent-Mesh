from typing import Optional
from pydantic import BaseModel, Field


class InventoryItem(BaseModel):
    item_id: str = Field(description="The inventory item UUID.")
    name: str = Field(description="Display name of the item.")
    sku: str = Field(description="Stock-keeping unit identifier.")
    category: Optional[str] = Field(default=None, description="Item category.")
    quantity_on_hand: int = Field(description="Current stock quantity.")
    reorder_threshold: int = Field(description="Quantity threshold for reorder.")
    unit_price_cents: int = Field(description="Price per unit in cents.")
    supplier_info: Optional[str] = Field(default=None, description="Supplier info.")


class ListInventoryInput(BaseModel):
    category: Optional[str] = Field(default=None, description="Filter by category.")
    low_stock_only: bool = Field(default=False, description="Only return items below reorder threshold.")
    limit: int = Field(default=100, description="Maximum number of items to return.")


class ListInventoryOutput(BaseModel):
    total: int = Field(description="Total number of items matching the filters.")
    items: list[InventoryItem] = Field(description="List of inventory items.")