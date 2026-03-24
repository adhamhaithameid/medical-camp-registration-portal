import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ErrorCallout } from "../components/ErrorCallout";
import { FieldErrorText } from "../components/FieldErrorText";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getFieldError } from "../lib/api";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

export const AdminLoginPage = () => {
  const { login } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isOnline = useOnlineStatus();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const redirectPath =
    (location.state as { from?: string } | undefined)?.from ?? "/admin/registrations";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!isOnline) {
      setError(new Error("You are offline. Reconnect to continue login."));
      return;
    }

    if (!username.trim() || !password.trim()) {
      setError(new Error("Username and password are required."));
      return;
    }

    try {
      setIsSubmitting(true);
      await login(username.trim(), password);
      pushToast({
        variant: "success",
        title: "Login Successful",
        message: "Admin session established."
      });
      navigate(redirectPath, { replace: true });
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="workspace-page form-panel">
      <h2>Admin Login</h2>
      <p className="muted-text">
        Default users: <strong>admin / admin12345</strong> (super admin),{" "}
        <strong>staff / staff12345</strong> (staff)
      </p>

      {!isOnline && <p className="warning-text">Offline mode detected. Login requires network access.</p>}
      <ErrorCallout error={error} />

      <form onSubmit={handleSubmit} className="form-grid" noValidate>
        <label htmlFor="adminUsername">
          Username
          <input
            id="adminUsername"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
          />
          <FieldErrorText message={getFieldError(error, "username")} />
        </label>

        <label htmlFor="adminPassword">
          Password
          <input
            id="adminPassword"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
          <FieldErrorText message={getFieldError(error, "password")} />
        </label>

        <button className="btn btn-primary" type="submit" disabled={isSubmitting || !isOnline}>
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </section>
  );
};
