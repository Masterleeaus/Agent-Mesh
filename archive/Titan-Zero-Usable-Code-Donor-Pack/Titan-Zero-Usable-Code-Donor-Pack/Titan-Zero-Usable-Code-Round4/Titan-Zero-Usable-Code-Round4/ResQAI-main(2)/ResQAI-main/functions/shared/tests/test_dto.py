from functions.shared.dto import (
    FilterParam,
    Page,
    PaginationParams,
    QueryParams,
    SearchParams,
    SortDirection,
    SortParams,
    build_filter_dict,
    parse_uuid,
    validate_email,
    validate_enum,
    validate_phone,
)
import pytest


class TestPaginationParams:
    def test_defaults(self):
        p = PaginationParams()
        assert p.page == 1
        assert p.page_size == 20

    def test_valid_range(self):
        p = PaginationParams(page=5, page_size=50)
        assert p.page == 5
        assert p.page_size == 50

    def test_invalid_page(self):
        with pytest.raises(Exception):
            PaginationParams(page=0)

    def test_invalid_page_size(self):
        with pytest.raises(Exception):
            PaginationParams(page_size=0)

    def test_exceeds_max_page_size(self):
        with pytest.raises(Exception):
            PaginationParams(page_size=500)


class TestSortParams:
    def test_defaults(self):
        s = SortParams()
        assert s.sort_dir == SortDirection.DESC
        assert s.sort_by is None

    def test_asc(self):
        s = SortParams(sort_by="name", sort_dir=SortDirection.ASC)
        assert s.sort_by == "name"
        assert s.sort_dir == SortDirection.ASC


class TestFilterParam:
    def test_default_operator(self):
        f = FilterParam(field="status", value="active")
        assert f.operator == "eq"

    def test_full(self):
        f = FilterParam(field="created_at", operator="gte", value="2026-01-01")
        assert f.field == "created_at"
        assert f.operator == "gte"


class TestSearchParams:
    def test_defaults(self):
        s = SearchParams()
        assert s.query is None
        assert s.search_fields is None

    def test_full(self):
        s = SearchParams(query="john", search_fields=["name", "email"])
        assert s.query == "john"
        assert s.search_fields == ["name", "email"]


class TestQueryParams:
    def test_defaults(self):
        q = QueryParams()
        assert q.pagination.page == 1
        assert q.sort.sort_by is None
        assert q.filters == []
        assert q.search.query is None


class TestPage:
    def test_defaults(self):
        p = Page()
        assert p.items == []
        assert p.total == 0
        assert p.page == 1
        assert p.page_size == 20
        assert p.total_pages == 1

    def test_with_items(self):
        p = Page(items=[{"id": "1"}, {"id": "2"}], total=50, page=2, page_size=10)
        assert len(p.items) == 2
        assert p.total == 50
        assert p.page == 2
        assert p.total_pages == 5

    def test_total_pages_computation(self):
        p = Page(total=99, page_size=20)
        assert p.total_pages == 5

    def test_single_page(self):
        p = Page(total=5, page_size=20)
        assert p.total_pages == 1


class TestValidateEmail:
    def test_valid(self):
        assert validate_email("test@example.com") == "test@example.com"
        assert validate_email("user+tag@domain.co.uk") == "user+tag@domain.co.uk"

    def test_invalid(self):
        with pytest.raises(ValueError):
            validate_email("not-an-email")
        with pytest.raises(ValueError):
            validate_email("@domain.com")
        with pytest.raises(ValueError):
            validate_email("user@")

    def test_none(self):
        assert validate_email(None) is None


class TestValidatePhone:
    def test_valid(self):
        assert validate_phone("+1234567890") == "+1234567890"

    def test_invalid_short(self):
        with pytest.raises(ValueError):
            validate_phone("123")

    def test_none(self):
        assert validate_phone(None) is None


class TestValidateEnum:
    def test_valid(self):
        result = validate_enum("active", ["active", "inactive"], "status")
        assert result == "active"

    def test_invalid(self):
        with pytest.raises(ValueError, match="Invalid status"):
            validate_enum("unknown", ["active", "inactive"], "status")


class TestParseUUID:
    def test_valid(self):
        uid = "550e8400-e29b-41d4-a716-446655440000"
        assert parse_uuid(uid) == uid

    def test_invalid(self):
        with pytest.raises(ValueError):
            parse_uuid("not-a-uuid")


class TestBuildFilterDict:
    def test_eq(self):
        filters = [FilterParam(field="status", operator="eq", value="active")]
        result = build_filter_dict(filters)
        assert result == {"status": "active"}

    def test_gte(self):
        filters = [FilterParam(field="created_at", operator="gte", value="2026-01-01")]
        result = build_filter_dict(filters)
        assert result == {"created_at_gte": "2026-01-01"}

    def test_multiple(self):
        filters = [
            FilterParam(field="status", operator="eq", value="active"),
            FilterParam(field="created_at", operator="gte", value="2026-01-01"),
            FilterParam(field="type", operator="in", value=["a", "b"]),
        ]
        result = build_filter_dict(filters)
        assert result["status"] == "active"
        assert result["created_at_gte"] == "2026-01-01"
        assert result["type_in"] == ["a", "b"]
