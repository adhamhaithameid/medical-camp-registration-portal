import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const patientLinks = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/register", label: "Camp Registration" },
  { to: "/registration/manage", label: "Manage Registration" },
  { to: "/contact", label: "Support Center" }
];

const adminOpsLinks = [
  { to: "/admin/registrations", label: "Registrations" },
  { to: "/admin/patients", label: "Patients" },
  { to: "/admin/doctors", label: "Doctors" },
  { to: "/admin/system", label: "System" }
];

const superAdminLinks = [
  { to: "/admin/camps", label: "Camp Catalog" },
  { to: "/admin/users", label: "Admin Users" },
  { to: "/admin/diagnostics", label: "Diagnostics" }
];

const getWorkspaceTitle = (pathname: string) => {
  if (pathname === "/admin/login") {
    return "Admin Access";
  }

  const linkPool = [...patientLinks, ...adminOpsLinks, ...superAdminLinks].sort(
    (a, b) => b.to.length - a.to.length
  );
  const matchedLink = linkPool.find((link) =>
    link.to === "/" ? pathname === "/" : pathname.startsWith(link.to)
  );

  if (!matchedLink) {
    return "Patient Dashboard";
  }

  if (matchedLink.to === "/") {
    return "Patient Dashboard";
  }

  return matchedLink.label;
};

export const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { auth, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="app-shell app-shell-patient">
      <aside className="patient-sidebar">
        <div className="sidebar-brand">
          <p className="badge">MedCore Care</p>
          <h1>Patient First Portal</h1>
          <p className="header-subtitle">
            One place for camp registration, self-service updates, and hospital operations.
          </p>
        </div>

        <nav className="side-nav" aria-label="Primary navigation">
          <section className="side-nav-group">
            <p className="side-nav-group-title">Patient Area</p>
            {patientLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  isActive ? "side-nav-link side-nav-link-active" : "side-nav-link"
                }
              >
                {link.label}
              </NavLink>
            ))}
          </section>

          {auth.authenticated && (
            <section className="side-nav-group">
              <p className="side-nav-group-title">Clinical Operations</p>
              {adminOpsLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    isActive ? "side-nav-link side-nav-link-active" : "side-nav-link"
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </section>
          )}

          {auth.authenticated && auth.role === "SUPER_ADMIN" && (
            <section className="side-nav-group">
              <p className="side-nav-group-title">Administration</p>
              {superAdminLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    isActive ? "side-nav-link side-nav-link-active" : "side-nav-link"
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </section>
          )}
        </nav>

        <div className="patient-sidebar-footer">
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
            <>
              <p className="muted-text">Staff or admin access</p>
              <Link className="btn btn-primary" to="/admin/login">
                Admin Login
              </Link>
            </>
          )}
        </div>
      </aside>

      <div className="workspace-main">
        <header className="workspace-topbar">
          <div>
            <p className="workspace-breadcrumb">
              {auth.authenticated ? "Hospital Operations Workspace" : "Patient Self-Service Portal"}
            </p>
            <p className="workspace-title">{getWorkspaceTitle(location.pathname)}</p>
          </div>

          <div className="topbar-actions">
            <label className="topbar-search" htmlFor="workspaceSearch">
              Search
              <input
                id="workspaceSearch"
                type="search"
                placeholder="Search patient, doctor, camp..."
                aria-label="Search patient, doctor, camp"
              />
            </label>

            {auth.authenticated ? (
              <Link className="btn btn-secondary" to="/admin/patients">
                Patients
              </Link>
            ) : (
              <Link className="btn btn-primary" to="/register">
                Register Now
              </Link>
            )}
          </div>
        </header>

        <main className="page-content workspace-frame patient-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
