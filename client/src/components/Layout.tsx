import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const publicLinks = [
  { to: "/", label: "Home", end: true },
  { to: "/register", label: "Camp Register" },
  { to: "/registration/manage", label: "Camp Manage" },
  { to: "/contact", label: "Contact" }
];

export const Layout = () => {
  const navigate = useNavigate();
  const { auth, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand-block">
          <p className="badge">HMS</p>
          <h1>Hospital Management System</h1>
          <p className="header-subtitle">
            Unified operations for patient, doctor, admin, and camp workflows.
          </p>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          {publicLinks.map((link) => (
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
          {auth.authenticated && (
            <>
              <NavLink
                to="/admin/registrations"
                className={({ isActive }) =>
                  isActive ? "nav-link nav-link-active" : "nav-link"
                }
              >
                Registrations
              </NavLink>
              <NavLink
                to="/admin/patients"
                className={({ isActive }) =>
                  isActive ? "nav-link nav-link-active" : "nav-link"
                }
              >
                Patients
              </NavLink>
              <NavLink
                to="/admin/doctors"
                className={({ isActive }) =>
                  isActive ? "nav-link nav-link-active" : "nav-link"
                }
              >
                Doctors
              </NavLink>
              <NavLink
                to="/admin/system"
                className={({ isActive }) =>
                  isActive ? "nav-link nav-link-active" : "nav-link"
                }
              >
                System
              </NavLink>
              {auth.role === "SUPER_ADMIN" && (
                <>
                  <NavLink
                    to="/admin/camps"
                    className={({ isActive }) =>
                      isActive ? "nav-link nav-link-active" : "nav-link"
                    }
                  >
                    Camps
                  </NavLink>
                  <NavLink
                    to="/admin/users"
                    className={({ isActive }) =>
                      isActive ? "nav-link nav-link-active" : "nav-link"
                    }
                  >
                    Admins
                  </NavLink>
                  <NavLink
                    to="/admin/diagnostics"
                    className={({ isActive }) =>
                      isActive ? "nav-link nav-link-active" : "nav-link"
                    }
                  >
                    Diagnostics
                  </NavLink>
                </>
              )}
            </>
          )}
        </nav>

        <div className="auth-block">
          {auth.authenticated && auth.user ? (
            <>
              <p className="session-pill">
                {auth.user.username} ({auth.user.role})
              </p>
              <button className="btn btn-secondary" onClick={handleLogout} type="button">
                Logout
              </button>
            </>
          ) : (
            <Link className="btn btn-primary" to="/admin/login">
              Admin Login
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
