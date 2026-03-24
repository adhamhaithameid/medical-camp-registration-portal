import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import type { AuthResult } from "@medical-camp/shared";
import { api } from "../lib/api";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/patients", label: "Patients" },
  { to: "/doctors", label: "Doctors" },
  { to: "/appointments", label: "Appointments" },
  { to: "/billing", label: "Billing" }
];

export const Layout = () => {
  const navigate = useNavigate();
  const [auth, setAuth] = useState<AuthResult>({ authenticated: false });

  useEffect(() => {
    let ignore = false;

    const loadStatus = async () => {
      try {
        const status = await api.getAuthStatus();

        if (!ignore) {
          setAuth(status);
        }
      } catch {
        if (!ignore) {
          setAuth({ authenticated: false });
        }
      }
    };

    loadStatus();

    return () => {
      ignore = true;
    };
  }, []);

  const handleLogout = async () => {
    await api.logout();
    setAuth({ authenticated: false });
    navigate("/auth", { replace: true });
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand-block">
          <p className="badge">HMS</p>
          <h1>Hospital Management System</h1>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                isActive ? "nav-link nav-link-active" : "nav-link"
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="auth-block">
          {auth.authenticated && auth.user ? (
            <>
              <p>
                {auth.user.fullName} ({auth.user.role})
              </p>
              <button className="btn btn-secondary" onClick={handleLogout} type="button">
                Logout
              </button>
            </>
          ) : (
            <Link className="btn btn-primary" to="/auth">
              Login
            </Link>
          )}
        </div>
      </header>

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
};
