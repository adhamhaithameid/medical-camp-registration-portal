import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/camps", label: "Camp Details" },
  { to: "/register", label: "Registration" },
  { to: "/contact", label: "Contact" },
  { to: "/admin/registrations", label: "Admin" }
];

export const Layout = () => {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand-block">
          <p className="badge">Medical Outreach</p>
          <h1>Medical Camp Registration Portal</h1>
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
      </header>

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
};
