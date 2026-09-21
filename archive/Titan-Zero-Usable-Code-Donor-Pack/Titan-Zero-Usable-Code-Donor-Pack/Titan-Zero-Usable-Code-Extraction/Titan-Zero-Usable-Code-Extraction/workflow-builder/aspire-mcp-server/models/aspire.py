from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional


# ── Core Objects ──────────────────────────────────────────────────────────────

class Property(BaseModel):
    propertyId: int
    propertyName: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    squareFootage: Optional[float] = None
    propertyTypeId: Optional[int] = None

    @property
    def full_address(self) -> str:
        parts = [self.address, self.city, self.state, self.zip]
        return ", ".join(p for p in parts if p)

    @property
    def property_type_label(self) -> str:
        return {1: "Residential", 2: "Commercial", 3: "HOA"}.get(
            self.propertyTypeId, "Unknown"
        )


class OpportunityService(BaseModel):
    serviceId: int
    serviceName: str
    quantity: Optional[float] = None
    unitPrice: Optional[float] = None


class Opportunity(BaseModel):
    opportunityId: int
    opportunityName: str
    opportunityStatusId: int
    propertyId: int
    contactId: Optional[int] = None
    assignedRepId: Optional[int] = None
    totalRevenue: Optional[float] = None
    createdDate: datetime
    notes: Optional[str] = None
    property: Optional[Property] = None
    services: list[OpportunityService] = []


class Attachment(BaseModel):
    attachmentId: int
    fileName: str
    fileType: Optional[str] = None
    fileUrl: Optional[str] = None
    uploadedAt: Optional[datetime] = None
    isBeforeImage: Optional[bool] = None

    @property
    def is_image(self) -> bool:
        return (self.fileType or "").lower() in {"jpg", "jpeg", "png", "webp"}


class Proposal(BaseModel):
    proposalId: int
    proposalName: str
    opportunityId: int
    proposalStatusId: int
    sentDate: Optional[datetime] = None
    expirationDate: Optional[date] = None
    totalAmount: Optional[float] = None
    notes: Optional[str] = None


# ── Tool Input Schemas ────────────────────────────────────────────────────────

class FetchOpportunityInput(BaseModel):
    workspace_id: str = Field(..., description="Platform workspace ID")
    opportunity_id: int = Field(..., description="Aspire opportunity ID")
    include_services: bool = Field(True, description="Include nested services")
    include_proposals: bool = Field(True, description="Include nested proposals")
    credentials: Optional[dict] = Field(None, description="Direct credential override")


class ListAttachmentsInput(BaseModel):
    workspace_id: str
    opportunity_id: int
    images_only: bool = Field(True, description="Filter to jpg/jpeg/png/webp only")
    credentials: Optional[dict] = None


class CreateProposalInput(BaseModel):
    workspace_id: str
    opportunity_id: int
    proposal_name: str
    notes: Optional[str] = None
    expiration_date: Optional[date] = None
    template_id: Optional[int] = None
    credentials: Optional[dict] = None


class UpdateProposalInput(BaseModel):
    workspace_id: str
    proposal_id: int
    proposal_name: Optional[str] = None
    notes: Optional[str] = None
    expiration_date: Optional[date] = None
    # NOTE: proposalStatusId deliberately excluded.
    # Changing status triggers downstream Aspire automations.
    credentials: Optional[dict] = None


class UploadAttachmentInput(BaseModel):
    workspace_id: str
    file_name: str
    file_url: str = Field(..., description="URL of the file to fetch and upload")
    parent_type: str = Field(..., pattern="^(opportunity|proposal)$")
    parent_id: int
    credentials: Optional[dict] = None
