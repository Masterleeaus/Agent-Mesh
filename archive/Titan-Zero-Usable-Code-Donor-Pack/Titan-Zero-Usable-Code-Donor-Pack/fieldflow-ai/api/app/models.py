from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, Field


class EquipmentStatus(str, Enum):
    OPERATIONAL = "operational"
    WARNING = "warning"
    CRITICAL = "critical"
    OFFLINE = "offline"
    MAINTENANCE = "maintenance"


class ConnectivityStatus(str, Enum):
    ONLINE = "online"
    DEGRADED = "degraded"
    OFFLINE = "offline"


class Equipment(BaseModel):
    equipment_id: str
    model: str
    category: str
    serial_number: str
    location: str
    assigned_dealer: str
    status: EquipmentStatus
    engine_hours: float = Field(ge=0)
    fuel_level: float = Field(ge=0, le=100)
    health_score: int = Field(ge=0, le=100)
    last_service_date: date


class TelemetryReading(BaseModel):
    equipment_id: str
    recorded_at: datetime
    engine_temperature_c: float
    hydraulic_pressure_psi: float
    engine_rpm: int = Field(ge=0)
    battery_voltage: float = Field(ge=0)
    fuel_level: float = Field(ge=0, le=100)
    connectivity: ConnectivityStatus
    health_status: EquipmentStatus
    alerts: list[str]