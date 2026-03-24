import { useEffect, useState } from "react";
import type { Camp, RegistrationRecord, RegistrationStatus } from "@medical-camp/shared";
import { ErrorCallout } from "../components/ErrorCallout";
import { useToast } from "../context/ToastContext";
import { api, type AdminRegistrationsQuery } from "../lib/api";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

const PAGE_SIZE = 10;

export const AdminRegistrationsPage = () => {
  const { pushToast } = useToast();
  const isOnline = useOnlineStatus();
  const [camps, setCamps] = useState<Camp[]>([]);
  const [rows, setRows] = useState<RegistrationRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<{
    search: string;
    campId: string;
    status: "" | RegistrationStatus;
    dateFrom: string;
    dateTo: string;
  }>({
    search: "",
    campId: "",
    status: "",
    dateFrom: "",
    dateTo: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const toQuery = (): AdminRegistrationsQuery => ({
    search: filters.search || undefined,
    campId: filters.campId ? Number(filters.campId) : undefined,
    status: filters.status || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    page,
    pageSize: PAGE_SIZE
  });

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [campsResponse, registrationsResponse] = await Promise.all([
        api.getAdminCamps(),
        api.getAdminRegistrations(toQuery())
      ]);
      setCamps(campsResponse.camps);
      setRows(registrationsResponse.registrations);
      setTotalPages(registrationsResponse.meta.totalPages);
      setTotal(registrationsResponse.meta.total);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [page]);

  const handleApplyFilters = async () => {
    setPage(1);
    try {
      if (!isOnline) {
        throw new Error("You are offline. Reconnect before applying filters.");
      }
      setIsLoading(true);
      const response = await api.getAdminRegistrations({
        ...toQuery(),
        page: 1
      });
      setRows(response.registrations);
      setTotalPages(response.meta.totalPages);
      setTotal(response.meta.total);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsLoading(false);
    }
  };

  const resetFilters = async () => {
    setFilters({
      search: "",
      campId: "",
      status: "",
      dateFrom: "",
      dateTo: ""
    });
    setPage(1);
    try {
      if (!isOnline) {
        throw new Error("You are offline. Reconnect before resetting filters.");
      }
      setIsLoading(true);
      const response = await api.getAdminRegistrations({
        page: 1,
        pageSize: PAGE_SIZE
      });
      setRows(response.registrations);
      setTotalPages(response.meta.totalPages);
      setTotal(response.meta.total);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      if (!isOnline) {
        throw new Error("You are offline. Reconnect before exporting CSV.");
      }
      const csv = await api.exportAdminRegistrationsCsv(toQuery());
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `registrations-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      pushToast({
        variant: "success",
        title: "CSV Export Ready",
        message: "Registration report downloaded."
      });
    } catch (requestError) {
      setError(requestError);
    }
  };

  const handlePromote = async (registrationId: number) => {
    try {
      if (!isOnline) {
        throw new Error("You are offline. Reconnect before promotion.");
      }
      setError(null);
      await api.promoteRegistration(registrationId);
      pushToast({
        variant: "success",
        title: "Promotion Completed",
        message: "Waitlisted registration moved to confirmed."
      });
      await load();
    } catch (requestError) {
      setError(requestError);
    }
  };

  return (
    <section className="workspace-page">
      <h2>Admin Registrations</h2>
      <p className="muted-text">
        Search and filter registrations, promote waitlist entries, and export CSV reports.
      </p>

      {!isOnline && (
        <p className="warning-text">You are offline. Filtering/export/promotion is disabled.</p>
      )}
      <ErrorCallout error={error} onRetry={load} />

      <div className="form-grid">
        <label htmlFor="search">
          Search
          <input
            id="search"
            value={filters.search}
            placeholder="Name, contact, code, email"
            onChange={(event) =>
              setFilters((previous) => ({ ...previous, search: event.target.value }))
            }
          />
        </label>
        <label htmlFor="campFilter">
          Camp
          <select
            id="campFilter"
            value={filters.campId}
            onChange={(event) =>
              setFilters((previous) => ({ ...previous, campId: event.target.value }))
            }
          >
            <option value="">All camps</option>
            {camps.map((camp) => (
              <option key={camp.id} value={camp.id}>
                {camp.name}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="statusFilter">
          Status
          <select
            id="statusFilter"
            value={filters.status}
            onChange={(event) =>
              setFilters((previous) => ({
                ...previous,
                status: event.target.value as "" | RegistrationStatus
              }))
            }
          >
            <option value="">All statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="WAITLISTED">Waitlisted</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
        <label htmlFor="dateFromFilter">
          Camp Date From
          <input
            id="dateFromFilter"
            type="date"
            value={filters.dateFrom}
            onChange={(event) =>
              setFilters((previous) => ({ ...previous, dateFrom: event.target.value }))
            }
          />
        </label>
        <label htmlFor="dateToFilter">
          Camp Date To
          <input
            id="dateToFilter"
            type="date"
            value={filters.dateTo}
            onChange={(event) =>
              setFilters((previous) => ({ ...previous, dateTo: event.target.value }))
            }
          />
        </label>
      </div>

      <div className="inline-actions">
        <button className="btn btn-primary" type="button" onClick={handleApplyFilters} disabled={!isOnline}>
          Apply Filters
        </button>
        <button className="btn btn-ghost" type="button" onClick={resetFilters} disabled={!isOnline}>
          Reset
        </button>
        <button className="btn btn-secondary" type="button" onClick={handleExport} disabled={!isOnline}>
          Export CSV
        </button>
      </div>

      <p className="muted-text">Total matching registrations: {total}</p>

      {isLoading ? (
        <p>Loading registrations...</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Contact</th>
                <th>Camp</th>
                <th>Camp Date</th>
                <th>Status</th>
                <th>Code</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.fullName}</td>
                  <td>{row.contactNumber}</td>
                  <td>{row.campName ?? row.campId}</td>
                  <td>{row.campDate ? new Date(row.campDate).toLocaleDateString() : "-"}</td>
                  <td>
                    <span
                      className={
                        row.status === "CONFIRMED"
                          ? "status-chip status-chip-green"
                          : row.status === "WAITLISTED"
                            ? "status-chip status-chip-amber"
                            : "status-chip status-chip-gray"
                      }
                    >
                      {row.status}
                    </span>
                  </td>
                  <td>{row.confirmationCode}</td>
                  <td>{new Date(row.createdAt).toLocaleString()}</td>
                  <td>
                    {row.status === "WAITLISTED" ? (
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => handlePromote(row.id)}
                        disabled={!isOnline}
                      >
                        Promote
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9}>No registrations found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination-row">
        <button
          className="btn btn-secondary"
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((previous) => Math.max(1, previous - 1))}
        >
          Previous
        </button>
        <p>
          Page {page} of {totalPages}
        </p>
        <button
          className="btn btn-secondary"
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))}
        >
          Next
        </button>
      </div>
    </section>
  );
};
