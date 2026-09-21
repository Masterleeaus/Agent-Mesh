from datetime import datetime, timezone
from random import uniform

from api.app.models import (
    ConnectivityStatus,
    Equipment,
    EquipmentStatus,
    TelemetryReading,
)


BASE_TELEMETRY = {
    "FF-BC-1007": {
        "engine_temperature_c": 88.0,
        "hydraulic_pressure_psi": 2380.0,
        "engine_rpm": 1840,
        "battery_voltage": 13.8,
        "connectivity": ConnectivityStatus.ONLINE,
    },
    "FF-DD-2041": {
        "engine_temperature_c": 101.0,
        "hydraulic_pressure_psi": 1940.0,
        "engine_rpm": 2010,
        "battery_voltage": 12.4,
        "connectivity": ConnectivityStatus.DEGRADED,
    },
    "FF-TR-3018": {
        "engine_temperature_c": 112.0,
        "hydraulic_pressure_psi": 1590.0,
        "engine_rpm": 2260,
        "battery_voltage": 11.6,
        "connectivity": ConnectivityStatus.ONLINE,
    },
    "FF-RC-4025": {
        "engine_temperature_c": 42.0,
        "hydraulic_pressure_psi": 0.0,
        "engine_rpm": 0,
        "battery_voltage": 12.8,
        "connectivity": ConnectivityStatus.ONLINE,
    },
    "FF-SG-5032": {
        "engine_temperature_c": 0.0,
        "hydraulic_pressure_psi": 0.0,
        "engine_rpm": 0,
        "battery_voltage": 0.0,
        "connectivity": ConnectivityStatus.OFFLINE,
    },
}


def generate_telemetry(equipment: Equipment) -> TelemetryReading:
    base_reading = BASE_TELEMETRY[equipment.equipment_id]

    engine_temperature = round(
        base_reading["engine_temperature_c"] + uniform(-1.5, 1.5),
        1,
    )
    hydraulic_pressure = round(
        base_reading["hydraulic_pressure_psi"] + uniform(-25, 25),
        1,
    )
    battery_voltage = round(
        base_reading["battery_voltage"] + uniform(-0.1, 0.1),
        1,
    )

    alerts = create_alerts(
        equipment.status,
        engine_temperature,
        hydraulic_pressure,
        battery_voltage,
        base_reading["connectivity"],
    )

    return TelemetryReading(
        equipment_id=equipment.equipment_id,
        recorded_at=datetime.now(timezone.utc),
        engine_temperature_c=max(engine_temperature, 0),
        hydraulic_pressure_psi=max(hydraulic_pressure, 0),
        engine_rpm=base_reading["engine_rpm"],
        battery_voltage=max(battery_voltage, 0),
        fuel_level=equipment.fuel_level,
        connectivity=base_reading["connectivity"],
        health_status=equipment.status,
        alerts=alerts,
    )


def create_alerts(
    status: EquipmentStatus,
    engine_temperature: float,
    hydraulic_pressure: float,
    battery_voltage: float,
    connectivity: ConnectivityStatus,
) -> list[str]:
    alerts = []

    if engine_temperature >= 105:
        alerts.append("Engine temperature exceeds safe operating range.")

    if 0 < hydraulic_pressure < 1800:
        alerts.append("Hydraulic pressure is below the expected range.")

    if 0 < battery_voltage < 11.8:
        alerts.append("Battery voltage is below the recommended level.")

    if connectivity == ConnectivityStatus.DEGRADED:
        alerts.append("Telemetry connection is degraded.")

    if connectivity == ConnectivityStatus.OFFLINE:
        alerts.append("Equipment telemetry is offline.")

    if status == EquipmentStatus.MAINTENANCE:
        alerts.append("Equipment is currently undergoing maintenance.")

    return alerts