import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

type RegisterFormState = {
  fullName: string;
  email: string;
  password: string;
  role: "ADMIN" | "STAFF" | "RECEPTIONIST";
};

const defaultRegister: RegisterFormState = {
  fullName: "",
  email: "",
  password: "",
  role: "STAFF"
};

export const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState(defaultRegister);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectPath =
    (location.state as { from?: string } | undefined)?.from ?? "/patients";

  const handleLogin = async () => {
    await api.login({
      email: loginForm.email.trim(),
      password: loginForm.password
    });
  };

  const handleRegister = async () => {
    await api.register({
      fullName: registerForm.fullName.trim(),
      email: registerForm.email.trim(),
      password: registerForm.password,
      role: registerForm.role
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (mode === "login" && (!loginForm.email.trim() || !loginForm.password)) {
      setErrorMessage("Email and password are required.");
      return;
    }

    if (
      mode === "register" &&
      (!registerForm.fullName.trim() || !registerForm.email.trim() || !registerForm.password)
    ) {
      setErrorMessage("Full name, email, and password are required.");
      return;
    }

    try {
      setIsSubmitting(true);

      if (mode === "login") {
        await handleLogin();
      } else {
        await handleRegister();
      }

      navigate(redirectPath, { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="form-panel">
      <h2>{mode === "login" ? "User Login" : "User Registration"}</h2>
      <p>
        Default seed account: <strong>admin@hms.local</strong> / <strong>admin12345</strong>
      </p>

      <div className="toggle-row" role="tablist" aria-label="Auth mode">
        <button
          type="button"
          className={mode === "login" ? "btn btn-primary" : "btn btn-secondary"}
          onClick={() => setMode("login")}
        >
          Login
        </button>
        <button
          type="button"
          className={mode === "register" ? "btn btn-primary" : "btn btn-secondary"}
          onClick={() => setMode("register")}
        >
          Register
        </button>
      </div>

      {errorMessage && <p className="error-text">{errorMessage}</p>}

      <form onSubmit={handleSubmit} className="form-grid" noValidate>
        {mode === "register" && (
          <label htmlFor="fullName">
            Full Name
            <input
              id="fullName"
              value={registerForm.fullName}
              onChange={(event) =>
                setRegisterForm((previous) => ({ ...previous, fullName: event.target.value }))
              }
            />
          </label>
        )}

        <label htmlFor="email">
          Email
          <input
            id="email"
            type="email"
            value={mode === "login" ? loginForm.email : registerForm.email}
            onChange={(event) => {
              const value = event.target.value;

              if (mode === "login") {
                setLoginForm((previous) => ({ ...previous, email: value }));
              } else {
                setRegisterForm((previous) => ({ ...previous, email: value }));
              }
            }}
            autoComplete="email"
          />
        </label>

        <label htmlFor="password">
          Password
          <input
            id="password"
            type="password"
            value={mode === "login" ? loginForm.password : registerForm.password}
            onChange={(event) => {
              const value = event.target.value;

              if (mode === "login") {
                setLoginForm((previous) => ({ ...previous, password: value }));
              } else {
                setRegisterForm((previous) => ({ ...previous, password: value }));
              }
            }}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </label>

        {mode === "register" && (
          <label htmlFor="role">
            Role
            <select
              id="role"
              value={registerForm.role}
              onChange={(event) =>
                setRegisterForm((previous) => ({
                  ...previous,
                  role: event.target.value as "ADMIN" | "STAFF" | "RECEPTIONIST"
                }))
              }
            >
              <option value="STAFF">Staff</option>
              <option value="RECEPTIONIST">Receptionist</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
        )}

        <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Submitting..."
            : mode === "login"
              ? "Sign In"
              : "Create Account"}
        </button>
      </form>
    </section>
  );
};
