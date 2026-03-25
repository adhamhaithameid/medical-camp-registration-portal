import { useEffect, useState } from "react";
import type { AdminDiagnosticsResponse } from "@medical-camp/shared";
import { ErrorCallout } from "../components/ErrorCallout";
import { api } from "../lib/api";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { useToast } from "../context/ToastContext";

export const AdminDiagnosticsPage = () => {
  const [report, setReport] = useState<AdminDiagnosticsResponse | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const isOnline = useOnlineStatus();
  const { pushToast } = useToast();

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.getAdminDiagnostics();
      setReport(response);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const json = await api.exportAdminDiagnosticsReport();
      const blob = new Blob([json], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `diagnostics-report-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      pushToast({
        variant: "success",
        title: "Diagnostics Exported",
        message: "JSON report downloaded successfully."
      });
    } catch (requestError) {
      setError(requestError);
      pushToast({
        variant: "error",
        title: "Export Failed",
        message: "Diagnostics export failed. Review the error details."
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section className="workspace-page">
      <section className="detail-panel">
        <h2>Admin Diagnostics</h2>
        <p className="muted-text">
          Investigate recent failures, audit activity, notification queue, and export a full error
          report for support.
        </p>
      </section>

      {!isOnline && (
        <p className="warning-text">You are offline. Diagnostics data may be stale until reconnect.</p>
      )}

      <section className="detail-panel">
        <div className="inline-actions">
          <button className="btn btn-secondary" type="button" onClick={() => void load()} disabled={!isOnline}>
            Refresh Diagnostics
          </button>
          <button className="btn btn-primary" type="button" onClick={handleExport} disabled={isExporting || !isOnline}>
            {isExporting ? "Exporting..." : "Export Error Report"}
          </button>
        </div>
      </section>

      <ErrorCallout error={error} onRetry={load} />

      {isLoading ? (
        <p>Loading diagnostics...</p>
      ) : (
        <>
          {report && (
            <div className="kpi-grid">
              <article className="kpi-item">
                <p className="kpi-label">System</p>
                <p className="kpi-value">{report.system.status.toUpperCase()}</p>
              </article>
              <article className="kpi-item">
                <p className="kpi-label">Failed API Calls</p>
                <p className="kpi-value">{report.summary.failedApiCalls}</p>
              </article>
              <article className="kpi-item">
                <p className="kpi-label">Queued Notifications</p>
                <p className="kpi-value">{report.summary.queuedNotifications}</p>
              </article>
              <article className="kpi-item">
                <p className="kpi-label">Audit Log Entries</p>
                <p className="kpi-value">{report.summary.auditLogs}</p>
              </article>
            </div>
          )}

          <section className="detail-panel">
            <h3>Recent Failed API Calls</h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Request ID</th>
                    <th>Method</th>
                    <th>Path</th>
                    <th>Status</th>
                    <th>Error Code</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {(report?.failedApiCalls ?? []).map((entry) => (
                    <tr key={`${entry.requestId}-${entry.timestamp}`}>
                      <td>{new Date(entry.timestamp).toLocaleString()}</td>
                      <td>{entry.requestId}</td>
                      <td>{entry.method}</td>
                      <td>{entry.path}</td>
                      <td>{entry.status}</td>
                      <td>{entry.errorCode}</td>
                      <td>{entry.durationMs} ms</td>
                    </tr>
                  ))}
                  {(report?.failedApiCalls.length ?? 0) === 0 && (
                    <tr>
                      <td colSpan={7}>No failed API calls captured.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="detail-panel">
            <h3>Queued Notifications</h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Registration ID</th>
                    <th>Channel</th>
                    <th>Event</th>
                    <th>Status</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {(report?.queuedNotifications ?? []).map((entry) => (
                    <tr key={entry.id}>
                      <td>{new Date(entry.createdAt).toLocaleString()}</td>
                      <td>{entry.registrationId}</td>
                      <td>{entry.channel}</td>
                      <td>{entry.event}</td>
                      <td>{entry.status}</td>
                      <td>{entry.errorMessage ?? "-"}</td>
                    </tr>
                  ))}
                  {(report?.queuedNotifications.length ?? 0) === 0 && (
                    <tr>
                      <td colSpan={6}>No queued notifications.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="detail-panel">
            <h3>Recent Audit Logs</h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {(report?.auditLogs ?? []).map((entry) => (
                    <tr key={entry.id}>
                      <td>{new Date(entry.createdAt).toLocaleString()}</td>
                      <td>{entry.actorUsername ?? entry.actorId ?? "-"}</td>
                      <td>{entry.action}</td>
                      <td>
                        {entry.entityType}:{entry.entityId}
                      </td>
                      <td>{entry.ipAddress ?? "-"}</td>
                    </tr>
                  ))}
                  {(report?.auditLogs.length ?? 0) === 0 && (
                    <tr>
                      <td colSpan={5}>No audit logs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </section>
  );
};
