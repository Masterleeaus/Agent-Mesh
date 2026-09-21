import pytest
from unittest.mock import MagicMock, patch
from src.handler import update_technician_skills, UpdateTechnicianSkillsInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.get = MagicMock(return_value={"id": "tech-1", "certification": ["Electrical"]})
        instance.records.update = MagicMock()
        instance.records.create = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_updates_skills_successfully(mock_pod):
    data = UpdateTechnicianSkillsInput(technician_id="tech-1", skills=["Plumbing", "Electrical", "HVAC"])
    result = await update_technician_skills(MagicMock(), data)
    assert result.status == "success"
    assert result.technician_id == "tech-1"
    assert result.skills == ["Plumbing", "Electrical", "HVAC"]
    mock_pod.records.update.assert_called_once_with(
        "technicians", "tech-1", {"certification": ["Plumbing", "Electrical", "HVAC"]}
    )
    mock_pod.records.create.assert_called_once()


@pytest.mark.asyncio
async def test_returns_not_found_when_technician_missing(mock_pod):
    mock_pod.records.get.return_value = None
    data = UpdateTechnicianSkillsInput(technician_id="missing", skills=["Plumbing"])
    result = await update_technician_skills(MagicMock(), data)
    assert result.status == "not_found"
    assert "not found" in result.error
    assert result.skills == []


@pytest.mark.asyncio
async def test_handles_exception_gracefully(mock_pod):
    mock_pod.records.get.side_effect = Exception("DB timeout")
    data = UpdateTechnicianSkillsInput(technician_id="tech-1", skills=["Plumbing"])
    result = await update_technician_skills(MagicMock(), data)
    assert result.status == "error"
    assert "DB timeout" in result.error
    assert result.skills == []
