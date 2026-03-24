import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../context/AuthContext";
import { RegistrationPage } from "../pages/RegistrationPage";

const mockedFetch = vi.fn();
vi.stubGlobal("fetch", mockedFetch);

const mockJsonResponse = (body: unknown, ok = true, status = 200) =>
  Promise.resolve({
    ok,
    status,
    json: async () => body
  });

describe("RegistrationPage", () => {
  beforeEach(() => {
    mockedFetch.mockReset();
    mockedFetch.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes("/api/camps")) {
        return mockJsonResponse({
          camps: [
            {
              id: 1,
              name: "Diabetes Camp",
              date: "2026-05-10T08:00:00.000Z",
              location: "Nasr City",
              description: "General screening camp",
              capacity: 2,
              isActive: true,
              confirmedCount: 2,
              waitlistCount: 1,
              remainingSeats: 0,
              createdAt: "2026-03-24T10:00:00.000Z",
              updatedAt: "2026-03-24T10:00:00.000Z"
            }
          ]
        });
      }

      if (url.includes("/api/registrations") && options?.method === "POST") {
        return mockJsonResponse({
          registration: {
            id: 7,
            fullName: "Mariam Tarek",
            age: 27,
            contactNumber: "+20 100 555 6677",
            email: "mariam@example.com",
            campId: 1,
            status: "WAITLISTED",
            confirmationCode: "TESTCODE1",
            isActive: true,
            createdAt: "2026-03-24T10:00:00.000Z",
            updatedAt: "2026-03-24T10:00:00.000Z",
            cancelledAt: null
          }
        });
      }

      if (url.includes("/api/auth/status")) {
        return mockJsonResponse({ auth: { authenticated: false } });
      }

      return mockJsonResponse({});
    });
  });

  it("shows validation error when required fields are empty", async () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <RegistrationPage />
        </MemoryRouter>
      </AuthProvider>
    );

    await screen.findByRole("heading", { name: /Camp Registration/i });
    await userEvent.click(screen.getByRole("button", { name: /Submit Registration/i }));

    expect(await screen.findByText(/Full name is required/i)).toBeInTheDocument();
  });

  it("submits registration and shows confirmation code", async () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <RegistrationPage />
        </MemoryRouter>
      </AuthProvider>
    );

    await screen.findByRole("heading", { name: /Camp Registration/i });

    await userEvent.type(screen.getByLabelText(/Full Name/i), "Mariam Tarek");
    await userEvent.clear(screen.getByLabelText(/Age/i));
    await userEvent.type(screen.getByLabelText(/Age/i), "27");
    await userEvent.type(screen.getByLabelText(/Contact Number/i), "+20 100 555 6677");
    await userEvent.type(screen.getByLabelText(/Email/i), "mariam@example.com");

    await userEvent.click(screen.getByRole("button", { name: /Submit Registration/i }));

    await waitFor(() => {
      expect(screen.getByText(/confirmation code/i)).toBeInTheDocument();
      expect(screen.getByText(/TESTCODE1/i)).toBeInTheDocument();
    });
  });
});
