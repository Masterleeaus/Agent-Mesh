from lemma_sdk import FunctionContext, Pod

from functions.shared import BaseService, FilterParam, PaginationParams, SearchParams, SortDirection, SortParams
from src.models import ListTicketsInput, ListTicketsOutput


async def list_tickets(ctx: FunctionContext, data: ListTicketsInput) -> ListTicketsOutput:
    pod = Pod.from_env()
    svc = BaseService(pod, "tickets_v2", "Ticket", correlation_id=data.correlation_id, function_name="list_tickets")

    try:
        pagination = PaginationParams(page=data.page, page_size=data.page_size)
        sort_params = None
        if data.sort_by:
            sort_dir = SortDirection.ASC if data.sort_dir == "asc" else SortDirection.DESC
            sort_params = SortParams(sort_by=data.sort_by, sort_dir=sort_dir)

        filters = []
        if data.filters:
            for field, value in data.filters.items():
                filters.append(FilterParam(field=field, operator="eq", value=value))

        search_params = None
        if data.search:
            search_params = SearchParams(query=data.search, search_fields=data.search_fields)

        page = svc.repo.list(pagination=pagination, sort=sort_params, filters=filters if filters else None, search=search_params)
        return ListTicketsOutput(status="success", data=page.items, pagination=page.model_dump(), meta={"entity": "ticket", "correlation_id": data.correlation_id})
    except Exception as e:
        return ListTicketsOutput(status="error", error={"code": "INTERNAL_ERROR", "message": str(e)})
