from lemma_sdk import FunctionContext, Pod

from functions.shared import BaseService, FilterParam, PaginationParams, SearchParams, SortDirection, SortParams
from src.models import ListKnowledgeArticlesInput, ListKnowledgeArticlesOutput


async def list_knowledge_articles(ctx: FunctionContext, data: ListKnowledgeArticlesInput) -> ListKnowledgeArticlesOutput:
    pod = Pod.from_env()
    svc = BaseService(pod, "knowledge_articles_v2", "Knowledge Article", correlation_id=data.correlation_id, function_name="list_knowledge_articles")

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
        return ListKnowledgeArticlesOutput(status="success", data=page.items, pagination=page.model_dump(), meta={"entity": "knowledge_article", "correlation_id": data.correlation_id})
    except Exception as e:
        return ListKnowledgeArticlesOutput(status="error", error={"code": "INTERNAL_ERROR", "message": str(e)})
