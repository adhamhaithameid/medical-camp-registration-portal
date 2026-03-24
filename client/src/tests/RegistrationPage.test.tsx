import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
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
    mockedFetch.mockImplementation((url: string) => {
      if (url.includes("/api/camps")) {
        return mockJsonResponse({
          camps: [
            {
              id: 1,
              name: "City General Health Camp",
              date: "2026-04-12T09:00:00.000Z",
              location: "Cairo Community Clinic",
              description: "General screening camp",
              capacity: 60,
              isActive: true
            }
          ]
        });
      }

      return mockJsonResponse({ message: "Registration submitted successfully" });
    });
  });

  it("shows validation errors when inputs are invalid", async () => {
    render(
      <MemoryRouter>
        <RegistrationPage />
      </MemoryRouter>
    );

    await screen.findByRole("heading", { name: /Registration/i });

    await userEvent.click(screen.getByRole("button", { name: /Submit Registration/i }));

    expect(
      await screen.findByText(/Full name must be at least 2 characters/i)
    ).toBeInTheDocument();
  });

  it("submits valid registration and shows confirmation", async () => {
    render(
      <MemoryRouter>
        <RegistrationPage />
      </MemoryRouter>
    );

    await screen.findByRole("option", { name: /City General Health Camp/i });

    await userEvent.type(screen.getByLabelText(/Full Name/i), "Nour Hassan");
    await userEvent.type(screen.getByLabelText(/^Age/i), "33");
    await userEvent.type(screen.getByLabelText(/Contact Number/i), "+20 101 234 7890");
    await userEvent.selectOptions(screen.getByLabelText(/Camp Selection/i), "1");

    await userEvent.click(screen.getByRole("button", { name: /Submit Registration/i }));

    await waitFor(() => {
      expect(screen.getByText(/Registration submitted successfully/i)).toBeInTheDocument();
    });
  });
});
