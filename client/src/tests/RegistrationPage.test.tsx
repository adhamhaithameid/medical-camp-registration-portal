import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PatientsPage } from "../pages/PatientsPage";

const mockedFetch = vi.fn();
vi.stubGlobal("fetch", mockedFetch);

const mockJsonResponse = (body: unknown, ok = true, status = 200) =>
  Promise.resolve({
    ok,
    status,
    json: async () => body
  });

describe("PatientsPage", () => {
  beforeEach(() => {
    mockedFetch.mockReset();
    mockedFetch.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes("/api/patients") && (!options?.method || options.method === "GET")) {
        return mockJsonResponse({ patients: [] });
      }

      if (url.includes("/api/patients") && options?.method === "POST") {
        return mockJsonResponse({
          patient: {
            id: 5,
            fullName: "Mariam Tarek",
            dateOfBirth: "1995-07-17T00:00:00.000Z",
            gender: "Female",
            phone: "+20 100 555 6677",
            address: "Maadi",
            medicalHistory: "Allergy",
            isDeleted: false,
            deletedAt: null,
            createdAt: "2026-03-24T10:00:00.000Z",
            updatedAt: "2026-03-24T10:00:00.000Z"
          }
        });
      }

      return mockJsonResponse({});
    });
  });

  it("shows validation error when required fields are empty", async () => {
    render(
      <MemoryRouter>
        <PatientsPage />
      </MemoryRouter>
    );

    await screen.findByRole("heading", { name: /Patient Management/i });
    await userEvent.click(screen.getByRole("button", { name: /Add Patient/i }));

    expect(
      await screen.findByText(/Full name, date of birth, gender, phone, and address are required/i)
    ).toBeInTheDocument();
  });

  it("creates patient when form is valid", async () => {
    render(
      <MemoryRouter>
        <PatientsPage />
      </MemoryRouter>
    );

    await screen.findByRole("heading", { name: /Patient Management/i });

    await userEvent.type(screen.getByLabelText(/Full Name/i), "Mariam Tarek");
    await userEvent.type(screen.getByLabelText(/Date of Birth/i), "1995-07-17");
    await userEvent.type(screen.getByLabelText(/Gender/i), "Female");
    await userEvent.type(screen.getByLabelText(/Phone/i), "+20 100 555 6677");
    await userEvent.type(screen.getByLabelText(/Address/i), "Maadi, Cairo");

    await userEvent.click(screen.getByRole("button", { name: /Add Patient/i }));

    await waitFor(() => {
      expect(screen.getByText(/Patient added successfully/i)).toBeInTheDocument();
    });
  });
});
