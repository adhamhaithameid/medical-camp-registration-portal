import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const publicLinks = [
  { to: "/", label: "Home", end: true },
  { to: "/register", label: "Register" },
  { to: "/registration/manage", label: "Manage Registration" },
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
          <p className="badge">MCAMP</p>
          <h1>Medical Camp Registration Portal</h1>
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
                Admin Registrations
              </NavLink>
              {auth.role === "SUPER_ADMIN" && (
                <NavLink
                  to="/admin/camps"
                  className={({ isActive }) =>
                    isActive ? "nav-link nav-link-active" : "nav-link"
                  }
                >
                  Camp Management
                </NavLink>
              )}
            </>
          )}
        </nav>

        <div className="auth-block">
          {auth.authenticated && auth.user ? (
            <>
              <p>
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
