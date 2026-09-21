import pytest
from unittest.mock import MagicMock, patch
from src.handler import update_work_order
from src.models import UpdateWorkOrderInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.get = MagicMock()
        instance.records.update = MagicMock()
        instance.records.create = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_updates_status(mock_pod):
    mock_pod.records.get.return_value = {"work_order_id": "wo-1", "status": "created"}
    data = UpdateWorkOrderInput(work_order_id="wo-1", status="in_progress")
    result = await update_work_order(MagicMock(), data)
    assert result.status == "success"
    mock_pod.records.update.assert_called_once()
    args = mock_pod.records.update.call_args[1]
    assert args["status"] == "in_progress"


@pytest.mark.asyncio
async def test_sets_completed_at_when_completed(mock_pod):
    mock_pod.records.get.return_value = {"work_order_id": "wo-1", "status": "in_progress"}
    data = UpdateWorkOrderInput(work_order_id="wo-1", status="completed")
    result = await update_work_order(MagicMock(), data)
    assert result.status == "success"
    args = mock_pod.records.update.call_args[1]
    assert "completed_at" in args
    assert args["status"] == "completed"


@pytest.mark.asyncio
async def test_returns_not_found(mock_pod):
    mock_pod.records.get.return_value = None
    data = UpdateWorkOrderInput(work_order_id="missing")
    result = await update_work_order(MagicMock(), data)
    assert result.status == "not_found"
    assert "not found" in result.error


@pytest.mark.asyncio
async def test_handles_all_optional_fields(mock_pod):
    mock_pod.records.get.return_value = {"work_order_id": "wo-1"}
    data = UpdateWorkOrderInput(
        work_order_id="wo-1",
        technician_notes="All done",
        parts_used=[{"part_id": "p1", "quantity": 2}],
        photos=["http://photo.url/1"],
        signature_ref="sig-abc",
    )
    result = await update_work_order(MagicMock(), data)
    assert result.status == "success"
    args = mock_pod.records.update.call_args[1]
    assert args["technician_notes"] == "All done"
    assert len(args["parts_used"]) == 1
    assert len(args["photos"]) == 1
    assert args["signature_ref"] == "sig-abc"