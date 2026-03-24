import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const AdminLoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectPath =
    (location.state as { from?: string } | undefined)?.from ?? "/admin/registrations";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !password.trim()) {
      setErrorMessage("Username and password are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      await login(username.trim(), password);
      navigate(redirectPath, { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="form-panel">
      <h2>Admin Login</h2>
      <p>
        Default users: <strong>admin / admin12345</strong> (super admin),{" "}
        <strong>staff / staff12345</strong> (staff)
      </p>

      {errorMessage && <p className="error-text">{errorMessage}</p>}

      <form onSubmit={handleSubmit} className="form-grid" noValidate>
        <label htmlFor="adminUsername">
          Username
          <input
            id="adminUsername"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
          />
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
        </label>

        <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </section>
  );
};
