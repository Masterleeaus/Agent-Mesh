import json
from models.aspire import FetchOpportunityInput, ListAttachmentsInput, Opportunity, Attachment
from auth.token_resolver import token_resolver
from client.aspire import aspire_client


async def fetch_opportunity(arguments: dict) -> dict:
    """
    Fetch a single Aspire opportunity by ID, including its nested property,
    contact, and services.
    """
    inp = FetchOpportunityInput(**arguments)

    if inp.credentials:
        token = await token_resolver.resolve_from_credentials(inp.credentials)
    else:
        token = await token_resolver.resolve(inp.workspace_id)

    data = await aspire_client.get(
        token,
        f"/opportunities/{inp.opportunity_id}",
        params={
            "includeServices": inp.include_services,
            "includeProposals": inp.include_proposals,
        },
    )
    opportunity = Opportunity.model_validate(data)
    return json.loads(opportunity.model_dump_json())


async def list_attachments(arguments: dict) -> list:
    """
    List file attachments on an Aspire opportunity.
    When images_only=True (default), returns only jpg/jpeg/png/webp files.
    """
    inp = ListAttachmentsInput(**arguments)

    if inp.credentials:
        token = await token_resolver.resolve_from_credentials(inp.credentials)
    else:
        token = await token_resolver.resolve(inp.workspace_id)

    data = await aspire_client.get(
        token,
        f"/opportunities/{inp.opportunity_id}/attachments",
    )
    attachments = [Attachment.model_validate(item) for item in data]
    if inp.images_only:
        attachments = [a for a in attachments if a.is_image]
    return json.loads(json.dumps([a.model_dump() for a in attachments]))
