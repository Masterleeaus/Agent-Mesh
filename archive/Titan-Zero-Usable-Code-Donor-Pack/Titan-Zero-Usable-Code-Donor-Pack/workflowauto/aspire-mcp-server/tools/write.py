import base64
import json
import httpx
from datetime import date
from models.aspire import (
    CreateProposalInput,
    UpdateProposalInput,
    UploadAttachmentInput,
    Proposal,
)
from auth.token_resolver import token_resolver
from client.aspire import aspire_client


async def create_proposal(arguments: dict) -> dict:
    """
    Create a new proposal in Aspire linked to the given opportunity.
    expiration_date: optional ISO date string (YYYY-MM-DD).
    Returns the created proposal including the new proposalId.
    """
    # Convert expiration_date string to date if present
    if "expiration_date" in arguments and arguments["expiration_date"]:
        arguments = dict(arguments)
        arguments["expiration_date"] = date.fromisoformat(arguments["expiration_date"])

    inp = CreateProposalInput(**arguments)

    if inp.credentials:
        token = await token_resolver.resolve_from_credentials(inp.credentials)
    else:
        token = await token_resolver.resolve(inp.workspace_id)

    body: dict = {
        "opportunityId": inp.opportunity_id,
        "proposalName": inp.proposal_name,
    }
    if inp.notes:
        body["notes"] = inp.notes
    if inp.expiration_date:
        body["expirationDate"] = inp.expiration_date.isoformat()
    if inp.template_id:
        body["templateId"] = inp.template_id

    data = await aspire_client.post(token, "/proposals", json=body)
    proposal = Proposal.model_validate(data)
    return json.loads(proposal.model_dump_json())


async def update_proposal(arguments: dict) -> dict:
    """
    Update fields on an existing Aspire proposal.
    proposalStatusId is intentionally not exposed — status changes trigger
    downstream Aspire automations.
    """
    if "expiration_date" in arguments and arguments["expiration_date"]:
        arguments = dict(arguments)
        arguments["expiration_date"] = date.fromisoformat(arguments["expiration_date"])

    inp = UpdateProposalInput(**arguments)

    if inp.credentials:
        token = await token_resolver.resolve_from_credentials(inp.credentials)
    else:
        token = await token_resolver.resolve(inp.workspace_id)

    body: dict = {}
    if inp.proposal_name:
        body["proposalName"] = inp.proposal_name
    if inp.notes:
        body["notes"] = inp.notes
    if inp.expiration_date:
        body["expirationDate"] = inp.expiration_date.isoformat()

    data = await aspire_client.patch(token, f"/proposals/{inp.proposal_id}", json=body)
    proposal = Proposal.model_validate(data)
    return json.loads(proposal.model_dump_json())


async def upload_attachment(arguments: dict) -> dict:
    """
    Download a file from file_url, base64-encode it, and attach it to
    an Aspire opportunity or proposal.
    """
    inp = UploadAttachmentInput(**arguments)

    if inp.credentials:
        token = await token_resolver.resolve_from_credentials(inp.credentials)
    else:
        token = await token_resolver.resolve(inp.workspace_id)

    # Download the file from the provided URL
    async with httpx.AsyncClient() as http:
        file_response = await http.get(inp.file_url, timeout=30.0)
        file_response.raise_for_status()
        file_content = base64.b64encode(file_response.content).decode()

    data = await aspire_client.post(
        token,
        "/attachments",
        json={
            "fileName": inp.file_name,
            "fileContent": file_content,
            "parentType": inp.parent_type,
            "parentId": inp.parent_id,
        },
    )
    return {"success": True, "attachment": data}
