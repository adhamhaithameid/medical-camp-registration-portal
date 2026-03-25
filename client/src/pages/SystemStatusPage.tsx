import { useEffect, useState } from "react";
import type { SystemHealthSnapshot, SystemStatusResponse } from "@medical-camp/shared";
import { ErrorCallout } from "../components/ErrorCallout";
import { api } from "../lib/api";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { useToast } from "../context/ToastContext";

export const SystemStatusPage = () => {
  const [publicHealth, setPublicHealth] = useState<SystemHealthSnapshot | null>(null);
  const [adminStatus, setAdminStatus] = useState<SystemStatusResponse | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isOnline = useOnlineStatus();
  const { pushToast } = useToast();

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [healthResponse, adminResponse] = await Promise.all([
        api.getHealth(),
        api.getSystemStatus()
      ]);
      setPublicHealth(healthResponse);
      setAdminStatus(adminResponse);
      return true;
    } catch (requestError) {
      setError(requestError);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleRefresh = async () => {
    const successful = await load();
    if (successful) {
      pushToast({
        variant: "success",
        title: "System Refreshed",
        message: "System health and diagnostics counters are up to date."
      });
    }
  };

  return (
    <section className="workspace-page">
      <section className="detail-panel">
        <h2>System Status</h2>
        <p className="muted-text">
          Live service health, DB connectivity, session status, and runtime diagnostics counters.
        </p>
      </section>

      {!isOnline && (
        <p className="warning-text">You are offline. Live status checks are temporarily unavailable.</p>
      )}

      <section className="detail-panel">
        <div className="inline-actions">
          <button className="btn btn-secondary" type="button" onClick={handleRefresh} disabled={!isOnline}>
            Refresh Status
          </button>
        </div>
      </section>

      <ErrorCallout
        error={error}
        onRetry={async () => {
          await load();
        }}
      />

      {isLoading ? (
        <p>Loading system status...</p>
      ) : (
        <>
          {publicHealth && (
            <div className="kpi-grid">
              <article className="kpi-item">
                <p className="kpi-label">Public Health</p>
                <p className="kpi-value">{publicHealth.status.toUpperCase()}</p>
              </article>
              <article className="kpi-item">
                <p className="kpi-label">Database</p>
                <p className="kpi-value">{publicHealth.dependencies.database.toUpperCase()}</p>
              </article>
              <article className="kpi-item">
                <p className="kpi-label">Uptime</p>
                <p className="kpi-value">{publicHealth.uptimeSeconds}s</p>
              </article>
              <article className="kpi-item">
                <p className="kpi-label">Telemetry</p>
                <p className="kpi-value">
                  {publicHealth.telemetry.sentryEnabled || publicHealth.telemetry.otelEnabled
                    ? "Enabled"
                    : "Local"}
                </p>
              </article>
            </div>
          )}

          {adminStatus && (
            <section className="detail-panel">
              <h3>Authenticated Session Snapshot</h3>
              <p className="muted-text">
                <strong>User:</strong> {adminStatus.auth.adminUsername ?? "-"} (
                {adminStatus.auth.role ?? "UNKNOWN"})
              </p>
              <p className="muted-text">
                <strong>Failed API Calls (in-memory):</strong>{" "}
                {adminStatus.diagnostics.failedApiCallsInMemory}
              </p>
              <p className="muted-text">
                <strong>Queued Notifications:</strong> {adminStatus.diagnostics.queuedNotifications}
              </p>
            </section>
          )}
        </>
      )}
    </section>
  );
};
