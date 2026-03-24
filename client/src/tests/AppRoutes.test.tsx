import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

  it("renders home route", () => {
    mockedFetch.mockImplementation((url: string) => {
      if (url.includes("/api/auth/status")) {
        return mockJsonResponse({ auth: { authenticated: false } });
      }

      return mockJsonResponse({});
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { name: /Hospital Management System/i, level: 2 })
    ).toBeInTheDocument();
  });

  it("redirects unauthenticated user to auth page", async () => {
    mockedFetch.mockImplementation((url: string) => {
      if (url.includes("/api/auth/status")) {
        return mockJsonResponse({ auth: { authenticated: false } });
      }

      return mockJsonResponse({});
    });

    render(
      <MemoryRouter initialEntries={["/patients"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /User Login/i })).toBeInTheDocument();
    });
  });

  it("shows patients route when authenticated", async () => {
    mockedFetch.mockImplementation((url: string) => {
      if (url.includes("/api/auth/status")) {
        return mockJsonResponse({
          auth: {
            authenticated: true,
            user: {
              id: 1,
              fullName: "System Admin",
              email: "admin@hms.local",
              role: "ADMIN"
            }
          }
        });
      }

      if (url.includes("/api/patients")) {
        return mockJsonResponse({
          patients: [
            {
              id: 1,
              fullName: "Nour Hassan",
              dateOfBirth: "1992-09-20T00:00:00.000Z",
              gender: "Female",
              phone: "+20 101 111 2233",
              address: "Nasr City",
              medicalHistory: "Test",
              isDeleted: false,
              deletedAt: null,
              createdAt: "2026-03-24T10:00:00.000Z",
              updatedAt: "2026-03-24T10:00:00.000Z"
            }
          ]
        });
      }

      return mockJsonResponse({});
    });

    render(
      <MemoryRouter initialEntries={["/patients"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(
      await screen.findByRole("heading", { name: /Patient Management/i })
    ).toBeInTheDocument();
    expect(await screen.findByText(/Nour Hassan/i)).toBeInTheDocument();
  });
});
