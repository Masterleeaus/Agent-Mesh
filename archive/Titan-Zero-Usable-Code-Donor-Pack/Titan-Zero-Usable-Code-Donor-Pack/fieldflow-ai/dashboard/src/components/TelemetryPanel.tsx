import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Radio,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  fetchTelemetry,
  type ApiTelemetry,
} from "../services/fieldflowApi";

type TelemetryPanelProps = {
  equipmentId: string;
  model: string;
  category: string;
};

type LoadStatus = "loading" | "success" | "error";

export function TelemetryPanel({
  equipmentId,
  model,
  category,
}: TelemetryPanelProps) {
  const [telemetry, setTelemetry] =
    useState<ApiTelemetry | null>(null);
  const [loadStatus, setLoadStatus] =
    useState<LoadStatus>("loading");
  const [refreshNumber, setRefreshNumber] = useState(0);

  useEffect(() => {
    let requestCancelled = false;

    async function loadTelemetry() {
      setLoadStatus("loading");

      try {
        const reading = await fetchTelemetry(equipmentId);

        if (!requestCancelled) {
          setTelemetry(reading);
          setLoadStatus("success");
        }
      } catch (error) {
        console.error("Unable to load telemetry:", error);

        if (!requestCancelled) {
          setLoadStatus("error");
        }
      }
    }

    void loadTelemetry();

    return () => {
      requestCancelled = true;
    };
  }, [equipmentId, refreshNumber]);

  function refreshTelemetry() {
    setRefreshNumber((currentNumber) => currentNumber + 1);
  }

  const recordedTime = telemetry
    ? new Date(telemetry.recorded_at).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      })
    : "";

  return (
    <section className="telemetry-panel">
      <div className="telemetry-heading">
        <div className="telemetry-identity">
          <span className="pulse-ring">
            <Radio size={16} />
          </span>

          <div>
            <span>Selected live asset</span>
            <strong>{model}</strong>
            <small>
              {category} · {equipmentId}
            </small>
          </div>
        </div>

        <button
          className="refresh-button"
          disabled={loadStatus === "loading"}
          onClick={refreshTelemetry}
          type="button"
        >
          <RefreshCw
            className={loadStatus === "loading" ? "spinning" : ""}
            size={15}
          />
          Refresh
        </button>
      </div>

      {loadStatus === "error" && (
        <div className="telemetry-error">
          <WifiOff size={17} />
          Unable to retrieve telemetry from the equipment API.
        </div>
      )}

      {telemetry && (
        <>
          <div className="telemetry-grid">
            <div
              className={
                telemetry.engine_temperature_c >= 105
                  ? "telemetry-reading caution"
                  : "telemetry-reading"
              }
            >
              <span>Engine temperature</span>
              <strong>{telemetry.engine_temperature_c}°C</strong>
            </div>

            <div
              className={
                telemetry.hydraulic_pressure_psi > 0 &&
                telemetry.hydraulic_pressure_psi < 1800
                  ? "telemetry-reading caution"
                  : "telemetry-reading"
              }
            >
              <span>Hydraulic pressure</span>
              <strong>
                {telemetry.hydraulic_pressure_psi.toLocaleString()} PSI
              </strong>
            </div>

            <div className="telemetry-reading">
              <span>Engine speed</span>
              <strong>
                {telemetry.engine_rpm.toLocaleString()} RPM
              </strong>
            </div>

            <div
              className={
                telemetry.battery_voltage > 0 &&
                telemetry.battery_voltage < 11.8
                  ? "telemetry-reading caution"
                  : "telemetry-reading"
              }
            >
              <span>Battery</span>
              <strong>{telemetry.battery_voltage} V</strong>
            </div>
          </div>

          <div className="telemetry-footer">
            <div
              className={`connection-state ${telemetry.connectivity}`}
            >
              {telemetry.connectivity === "offline" ? (
                <WifiOff size={15} />
              ) : (
                <Wifi size={15} />
              )}

              <span>
                {telemetry.connectivity} · Updated {recordedTime}
              </span>
            </div>

            <div
              className={
                telemetry.alerts.length > 0
                  ? "alert-total active"
                  : "alert-total"
              }
            >
              {telemetry.alerts.length > 0 ? (
                <AlertTriangle size={15} />
              ) : (
                <CheckCircle2 size={15} />
              )}

              <span>
                {telemetry.alerts.length === 0
                  ? "No active alerts"
                  : `${telemetry.alerts.length} active ${
                      telemetry.alerts.length === 1
                        ? "alert"
                        : "alerts"
                    }`}
              </span>
            </div>
          </div>

          {telemetry.alerts.length > 0 && (
            <div className="telemetry-alerts">
              {telemetry.alerts.map((alert) => (
                <p key={alert}>
                  <AlertTriangle size={14} />
                  {alert}
                </p>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}