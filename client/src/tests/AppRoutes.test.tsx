import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
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

  it("renders contact route", async () => {
    render(
      <MemoryRouter initialEntries={["/contact"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /Contact/i })).toBeInTheDocument();
  });

  it("redirects unauthenticated user to admin login", async () => {
    mockedFetch.mockImplementation(() => mockJsonResponse({ auth: { authenticated: false } }));

    render(
      <MemoryRouter initialEntries={["/admin/registrations"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Admin Login/i })).toBeInTheDocument();
    });
  });

  it("shows admin registrations when authenticated", async () => {
    mockedFetch.mockImplementation((url: string) => {
      if (url.includes("/api/auth/status")) {
        return mockJsonResponse({ auth: { authenticated: true, adminUsername: "admin" } });
      }

      if (url.includes("/api/admin/registrations")) {
        return mockJsonResponse({
          registrations: [
            {
              id: 1,
              fullName: "Nour Hassan",
              age: 33,
              contactNumber: "+20 101 234 7890",
              campId: 1,
              createdAt: "2026-03-24T10:00:00.000Z",
              campName: "City General Health Camp",
              campDate: "2026-04-12T09:00:00.000Z",
              campLocation: "Cairo Community Clinic"
            }
          ]
        });
      }

      return mockJsonResponse({});
    });

    render(
      <MemoryRouter initialEntries={["/admin/registrations"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(
      await screen.findByRole("heading", { name: /Registered Participants/i })
    ).toBeInTheDocument();
    expect(await screen.findByText(/Nour Hassan/i)).toBeInTheDocument();
  });
});
