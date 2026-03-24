import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../context/AuthContext";
import { AppRoutes } from "../App";

const mockedFetch = vi.fn();
vi.stubGlobal("fetch", mockedFetch);

const mockJsonResponse = (body: unknown, ok = true) =>
  Promise.resolve({
    ok,
    json: async () => body
  });

describe("AppRoutes", () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  it("renders home route", async () => {
    mockedFetch.mockImplementation((url: string) => {
      if (url.includes("/api/auth/status")) {
        return mockJsonResponse({ auth: { authenticated: false } });
      }

      if (url.includes("/api/camps")) {
        return mockJsonResponse({ camps: [] });
      }

      return mockJsonResponse({});
    });

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/"]}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(
      await screen.findByRole("heading", {
        name: /Find A Medical Camp And Register In Minutes/i,
        level: 2
      })
    ).toBeInTheDocument();
  });

  it("redirects unauthenticated admin user to admin login", async () => {
    mockedFetch.mockImplementation((url: string) => {
      if (url.includes("/api/auth/status")) {
        return mockJsonResponse({ auth: { authenticated: false } });
      }

      return mockJsonResponse({ camps: [] });
    });

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/admin/registrations"]}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Admin Login/i })).toBeInTheDocument();
    });
  });

  it("shows admin registrations route when authenticated", async () => {
    mockedFetch.mockImplementation((url: string) => {
      if (url.includes("/api/auth/status")) {
        return mockJsonResponse({
          auth: {
            authenticated: true,
            adminUsername: "admin",
            role: "SUPER_ADMIN",
            user: {
              id: 1,
              username: "admin",
              role: "SUPER_ADMIN"
            }
          }
        });
      }

      if (url.includes("/api/admin/camps")) {
        return mockJsonResponse({ camps: [] });
      }

      if (url.includes("/api/admin/registrations")) {
        return mockJsonResponse({
          registrations: [],
          meta: {
            total: 0,
            page: 1,
            pageSize: 10,
            totalPages: 1
          }
        });
      }

      return mockJsonResponse({});
    });

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/admin/registrations"]}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(
      await screen.findByRole("heading", { name: /Admin Registrations/i })
    ).toBeInTheDocument();
  });
});
