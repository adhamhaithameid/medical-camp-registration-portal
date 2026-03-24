import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminCampsPage } from "./pages/AdminCampsPage";
import { AdminDiagnosticsPage } from "./pages/AdminDiagnosticsPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { AdminRegistrationsPage } from "./pages/AdminRegistrationsPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { CampDetailsPage } from "./pages/CampDetailsPage";
import { ContactPage } from "./pages/ContactPage";
import { DoctorsPage } from "./pages/DoctorsPage";
import { HomePage } from "./pages/HomePage";
import { PatientsPage } from "./pages/PatientsPage";
import { RegistrationLookupPage } from "./pages/RegistrationLookupPage";
import { RegistrationPage } from "./pages/RegistrationPage";
import { SystemStatusPage } from "./pages/SystemStatusPage";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="camps/:id" element={<CampDetailsPage />} />
        <Route path="register" element={<RegistrationPage />} />
        <Route path="registration/manage" element={<RegistrationLookupPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="admin/login" element={<AdminLoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="admin/registrations" element={<AdminRegistrationsPage />} />
          <Route path="admin/patients" element={<PatientsPage />} />
          <Route path="admin/doctors" element={<DoctorsPage />} />
          <Route path="admin/system" element={<SystemStatusPage />} />
          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />}>
            <Route path="admin/camps" element={<AdminCampsPage />} />
            <Route path="admin/users" element={<AdminUsersPage />} />
            <Route path="admin/diagnostics" element={<AdminDiagnosticsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
