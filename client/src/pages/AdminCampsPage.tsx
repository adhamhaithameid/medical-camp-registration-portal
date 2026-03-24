import { useEffect, useState } from "react";
import type { Camp, CampInput } from "@medical-camp/shared";
import { api } from "../lib/api";

const initialForm: CampInput = {
  name: "",
  date: "",
  location: "",
  description: "",
  capacity: 100,
  isActive: true
};

export const AdminCampsPage = () => {
  const [camps, setCamps] = useState<Camp[]>([]);
  const [form, setForm] = useState<CampInput>(initialForm);
  const [editingCampId, setEditingCampId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const load = async () => {
    try {
      setIsLoading(true);
      const response = await api.getAdminCamps();
      setCamps(response.camps);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load camps");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setEditingCampId(null);
  };

  const validate = () => {
    if (!form.name.trim() || !form.date || !form.location.trim() || !form.description.trim()) {
      return "Name, date, location, and description are required.";
    }

    if (!Number.isInteger(Number(form.capacity)) || Number(form.capacity) <= 0) {
      return "Capacity must be a positive integer.";
    }

    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CampInput = {
        name: form.name.trim(),
        date: new Date(form.date).toISOString(),
        location: form.location.trim(),
        description: form.description.trim(),
        capacity: Number(form.capacity),
        isActive: form.isActive
      };

      if (editingCampId) {
        await api.updateCamp(editingCampId, payload);
        setSuccessMessage("Camp updated.");
      } else {
        await api.createCamp(payload);
        setSuccessMessage("Camp created.");
      }

      resetForm();
      await load();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save camp");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (camp: Camp) => {
    setEditingCampId(camp.id);
    setForm({
      name: camp.name,
      date: camp.date.slice(0, 16),
      location: camp.location,
      description: camp.description,
      capacity: camp.capacity,
      isActive: camp.isActive
    });
  };

  const deactivate = async (campId: number) => {
    const confirmed = window.confirm("Deactivate this camp?");
    if (!confirmed) {
      return;
    }

    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      await api.deactivateCamp(campId);
      setSuccessMessage("Camp deactivated.");
      await load();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to deactivate camp");
    }
  };

  return (
    <section className="workspace-page">
      <h2>Admin Camp Management</h2>
      <p className="muted-text">
        Create, edit, and deactivate camps with live capacity visibility.
      </p>

      {errorMessage && <p className="error-text">{errorMessage}</p>}
      {successMessage && <p className="success-text">{successMessage}</p>}

      <p className="muted-text">Total camps: {camps.length}</p>

      <form className="form-grid" onSubmit={handleSubmit} noValidate>
        <label htmlFor="campName">
          Camp Name
          <input
            id="campName"
            value={form.name}
            onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
          />
        </label>
        <label htmlFor="campDate">
          Camp Date
          <input
            id="campDate"
            type="datetime-local"
            value={form.date}
            onChange={(event) => setForm((previous) => ({ ...previous, date: event.target.value }))}
          />
        </label>
        <label htmlFor="campLocation">
          Location
          <input
            id="campLocation"
            value={form.location}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, location: event.target.value }))
            }
          />
        </label>
        <label htmlFor="campCapacity">
          Capacity
          <input
            id="campCapacity"
            type="number"
            min={1}
            value={form.capacity}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, capacity: Number(event.target.value) }))
            }
          />
        </label>
        <label htmlFor="campDescription">
          Description
          <input
            id="campDescription"
            value={form.description}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, description: event.target.value }))
            }
          />
        </label>
        <label className="checkbox-inline" htmlFor="campActive">
          <input
            id="campActive"
            type="checkbox"
            checked={Boolean(form.isActive)}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, isActive: event.target.checked }))
            }
          />
          Active Camp
        </label>

        <div className="inline-actions">
          <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : editingCampId ? "Update Camp" : "Create Camp"}
          </button>
          {editingCampId && (
            <button className="btn btn-secondary" type="button" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {isLoading ? (
        <p>Loading camps...</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Date</th>
                <th>Location</th>
                <th>Capacity</th>
                <th>Confirmed</th>
                <th>Waitlist</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {camps.map((camp) => (
                <tr key={camp.id}>
                  <td>{camp.name}</td>
                  <td>{new Date(camp.date).toLocaleString()}</td>
                  <td>{camp.location}</td>
                  <td>{camp.capacity}</td>
                  <td>{camp.confirmedCount}</td>
                  <td>{camp.waitlistCount}</td>
                  <td>{camp.isActive ? "Active" : "Inactive"}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-secondary" type="button" onClick={() => startEdit(camp)}>
                        Edit
                      </button>
                      {camp.isActive && (
                        <button
                          className="btn btn-secondary"
                          type="button"
                          onClick={() => deactivate(camp.id)}
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {camps.length === 0 && (
                <tr>
                  <td colSpan={8}>No camps found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
