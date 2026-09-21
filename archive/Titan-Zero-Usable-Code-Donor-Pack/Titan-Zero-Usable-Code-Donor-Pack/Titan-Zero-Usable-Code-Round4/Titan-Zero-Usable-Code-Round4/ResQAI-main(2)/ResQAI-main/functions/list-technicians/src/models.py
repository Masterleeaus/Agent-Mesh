from typing import Optional

from pydantic import BaseModel, Field


class TechnicianItem(BaseModel):
    technician_id: str = Field(description="UUID of the technician.")
    name: str = Field(description="Full name of the technician.")
    primary_phone: Optional[str] = Field(default=None, description="Primary phone number.")
    primary_email: Optional[str] = Field(default=None, description="Primary email address.")
    availability: Optional[str] = Field(default=None, description="Current availability status.")
    status: Optional[str] = Field(default=None, description="Current status.")
    rating: Optional[float] = Field(default=None, description="Technician rating.")
    current_jobs_count: Optional[int] = Field(default=None, description="Number of current active jobs.")
    max_daily_jobs: Optional[int] = Field(default=None, description="Maximum jobs per day.")


class ListTechniciansInput(BaseModel):
    status: Optional[str] = Field(default=None, description="Filter by status (e.g. active, inactive).")
    availability: Optional[str] = Field(default=None, description="Filter by availability (e.g. available, busy).")
    min_rating: Optional[float] = Field(default=None, description="Minimum rating filter.")
    limit: int = Field(default=100, description="Maximum number of results to return.")


class ListTechniciansOutput(BaseModel):
    total: int = Field(description="Total number of matching technicians.")
    technicians: list[TechnicianItem] = Field(description="List of matching technicians.")
