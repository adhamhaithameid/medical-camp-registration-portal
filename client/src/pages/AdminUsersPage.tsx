import { useEffect, useState } from "react";
import type { AdminRole, AdminUser } from "@medical-camp/shared";
import { ErrorCallout } from "../components/ErrorCallout";
import { FieldErrorText } from "../components/FieldErrorText";
import { useToast } from "../context/ToastContext";
import { api, getFieldError } from "../lib/api";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

const initialCreateForm = {
  username: "",
  password: "",
  role: "STAFF" as AdminRole
};

export const AdminUsersPage = () => {
  const { pushToast } = useToast();
  const isOnline = useOnlineStatus();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = async () => {
    try {
      setIsLoading(true);
      const response = await api.getAdminUsers();
      setUsers(response.users);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!isOnline) {
      setError(new Error("You are offline. Reconnect before creating admin users."));
      return;
    }

    if (!createForm.username.trim() || !createForm.password.trim()) {
      setError(new Error("Username and password are required."));
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
      pushToast({
        variant: "success",
        title: "Admin Created",
        message: "Admin user created successfully."
      });
      await load();
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (user: AdminUser, role: AdminRole) => {
    try {
      if (!isOnline) {
        throw new Error("You are offline. Reconnect before role changes.");
      }
      await api.updateAdminUser(user.id, { role });
      pushToast({
        variant: "success",
        title: "Role Updated",
        message: `Role updated for ${user.username}.`
      });
      await load();
    } catch (requestError) {
      setError(requestError);
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    try {
      if (!isOnline) {
        throw new Error("You are offline. Reconnect before status changes.");
      }
      await api.updateAdminUser(user.id, { isActive: !user.isActive });
      pushToast({
        variant: "warning",
        title: "Status Updated",
        message: `Active status updated for ${user.username}.`
      });
      await load();
    } catch (requestError) {
      setError(requestError);
    }
  };

  const handleDelete = async (user: AdminUser) => {
    const confirmed = window.confirm(`Delete admin user "${user.username}"?`);
    if (!confirmed) {
      return;
    }

    try {
      if (!isOnline) {
        throw new Error("You are offline. Reconnect before deleting users.");
      }
      await api.deleteAdminUser(user.id);
      pushToast({
        variant: "warning",
        title: "Admin Deleted",
        message: `Admin user ${user.username} deleted.`
      });
      await load();
    } catch (requestError) {
      setError(requestError);
    }
  };

  const filteredUsers = users.filter((user) =>
    [user.username, user.role].join(" ").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="workspace-page">
      <h2>Admins Management</h2>
      <p className="muted-text">Corporate access control for admin accounts (super admin only).</p>

      {!isOnline && (
        <p className="warning-text">You are offline. Admin role/status actions are disabled.</p>
      )}
      <ErrorCallout error={error} onRetry={load} />

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
          <FieldErrorText message={getFieldError(error, "username")} />
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
          <FieldErrorText message={getFieldError(error, "password")} />
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
          <FieldErrorText message={getFieldError(error, "role")} />
        </label>
        <button className="btn btn-primary" type="submit" disabled={isSubmitting || !isOnline}>
          {isSubmitting ? "Creating..." : "Create Admin"}
        </button>
      </form>

      <div className="toolbar">
        <input
          aria-label="Search Admins"
          placeholder="Search by username or role"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button className="btn btn-ghost" type="button" onClick={() => setSearch("")}>
          Clear
        </button>
      </div>

      <p className="muted-text">Total admins: {filteredUsers.length}</p>

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
              {filteredUsers.map((user) => (
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
                        disabled={!isOnline}
                      >
                        Toggle Role
                      </button>
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => handleToggleActive(user)}
                        disabled={!isOnline}
                      >
                        Toggle Active
                      </button>
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => handleDelete(user)}
                        disabled={!isOnline}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
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
