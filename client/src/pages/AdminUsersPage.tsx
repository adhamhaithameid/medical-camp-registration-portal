import { useEffect, useState } from "react";
import type { AdminRole, AdminUser } from "@medical-camp/shared";
import { api } from "../lib/api";

const initialCreateForm = {
  username: "",
  password: "",
  role: "STAFF" as AdminRole
};

export const AdminUsersPage = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = async () => {
    try {
      setIsLoading(true);
      const response = await api.getAdminUsers();
      setUsers(response.users);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load admins");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!createForm.username.trim() || !createForm.password.trim()) {
      setErrorMessage("Username and password are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.createAdminUser({
        username: createForm.username.trim(),
        password: createForm.password,
        role: createForm.role
      });
      setCreateForm(initialCreateForm);
      setSuccessMessage("Admin user created successfully.");
      await load();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create admin user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (user: AdminUser, role: AdminRole) => {
    try {
      await api.updateAdminUser(user.id, { role });
      setSuccessMessage("Admin role updated.");
      await load();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update admin role");
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    try {
      await api.updateAdminUser(user.id, { isActive: !user.isActive });
      setSuccessMessage("Admin active status updated.");
      await load();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update admin status");
    }
  };

  const handleDelete = async (user: AdminUser) => {
    try {
      await api.deleteAdminUser(user.id);
      setSuccessMessage("Admin user deleted.");
      await load();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete admin user");
    }
  };

  return (
    <section>
      <h2>Admins Management</h2>
      <p>Complete CRUD for admin accounts (super admin only).</p>

      {errorMessage && <p className="error-text">{errorMessage}</p>}
      {successMessage && <p className="success-text">{successMessage}</p>}

      <form className="form-grid" onSubmit={handleCreate} noValidate>
        <label htmlFor="adminUsername">
          Username
          <input
            id="adminUsername"
            value={createForm.username}
            onChange={(event) =>
              setCreateForm((previous) => ({ ...previous, username: event.target.value }))
            }
          />
        </label>
        <label htmlFor="adminPassword">
          Password
          <input
            id="adminPassword"
            type="password"
            value={createForm.password}
            onChange={(event) =>
              setCreateForm((previous) => ({ ...previous, password: event.target.value }))
            }
          />
        </label>
        <label htmlFor="adminRole">
          Role
          <select
            id="adminRole"
            value={createForm.role}
            onChange={(event) =>
              setCreateForm((previous) => ({ ...previous, role: event.target.value as AdminRole }))
            }
          >
            <option value="STAFF">Staff</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
        </label>
        <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Admin"}
        </button>
      </form>

      {isLoading ? (
        <p>Loading admins...</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.role}</td>
                  <td>{user.isActive ? "Active" : "Inactive"}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() =>
                          handleRoleChange(
                            user,
                            user.role === "SUPER_ADMIN" ? "STAFF" : "SUPER_ADMIN"
                          )
                        }
                      >
                        Toggle Role
                      </button>
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => handleToggleActive(user)}
                      >
                        Toggle Active
                      </button>
                      <button className="btn btn-secondary" type="button" onClick={() => handleDelete(user)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6}>No admin users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
