import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import Edit from "../../../src/pages/referensi/periodisasi/edit";

const mockNavigate = vi.fn();
const mockLocation = { state: { isupdate: "false", data: {} } };

const { mockAddPeriodisasi, mockEditPeriodisasi } = vi.hoisted(() => ({
  mockAddPeriodisasi: vi.fn(),
  mockEditPeriodisasi: vi.fn(),
}));

const mockSwalFire = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

vi.mock("@/axios/referensi/periodisasi", () => ({
  AddPeriodisasi: (...args) => mockAddPeriodisasi(...args),
  EditPeriodisasi: (...args) => mockEditPeriodisasi(...args),
}));

vi.mock("sweetalert2", () => ({
  default: {
    fire: (...args) => mockSwalFire(...args),
  },
}));

vi.mock("react-flatpickr", () => ({
  default: ({ name, onChange }) => (
    <input
      id={name}
      type="date"
      onChange={(event) => onChange([new Date(event.target.value)])}
    />
  ),
}));

vi.mock("@/components/ui/Card", () => ({
  default: ({ title, children }) => (
    <section>
      <h1>{title}</h1>
      {children}
    </section>
  ),
}));

vi.mock("@/components/ui/Textinput", () => ({
  default: ({
    name,
    label,
    register,
    defaultValue,
    type = "text",
    placeholder,
  }) => (
    <label>
      {label}
      <input
        aria-label={label}
        defaultValue={defaultValue}
        placeholder={placeholder}
        type={type}
        {...(register ? register(name) : {})}
      />
    </label>
  ),
}));

describe("Periodisasi edit page", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockAddPeriodisasi.mockReset();
    mockEditPeriodisasi.mockReset();
    mockSwalFire.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("submits add flow", async () => {
    mockLocation.state = { isupdate: "false", data: {} };
    mockAddPeriodisasi.mockResolvedValue({ status: true });
    mockSwalFire.mockResolvedValue({});

    render(<Edit />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Periode"), "Periode A");
    await user.type(screen.getByLabelText("Bulan"), "2024-01");
    await user.type(screen.getByLabelText("Tanggal Mulai"), "2024-01-05");
    await user.type(screen.getByLabelText("Tanggal Selesai"), "2024-01-31");

    await user.click(
      screen.getByRole("button", { name: /Add Periodisasi/i })
    );

    await waitFor(() => {
      expect(mockAddPeriodisasi).toHaveBeenCalled();
    });

    const [payload] = mockAddPeriodisasi.mock.calls[0];
    expect(payload).toMatchObject({
      name: "Periode A",
      month: "2024-01",
      start_date: "2024-01-05",
      end_date: "2024-01-31",
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  it("submits update flow", async () => {
    mockLocation.state = {
      isupdate: "true",
      data: {
        periode_id: 9,
        name: "Periode Lama",
        month: "2023-12",
        start_date: "2023-12-01",
        end_date: "2023-12-31",
      },
    };
    mockEditPeriodisasi.mockResolvedValue({ status: true });
    mockSwalFire.mockResolvedValue({});

    render(<Edit />);

    const user = userEvent.setup();
    await user.clear(screen.getByLabelText("Periode"));
    await user.type(screen.getByLabelText("Periode"), "Periode Baru");
    await user.clear(screen.getByLabelText("Bulan"));
    await user.type(screen.getByLabelText("Bulan"), "2024-02");
    await user.type(screen.getByLabelText("Tanggal Mulai"), "2024-02-01");
    await user.type(screen.getByLabelText("Tanggal Selesai"), "2024-02-28");

    await user.click(
      screen.getByRole("button", { name: /Update Periodisasi/i })
    );

    await waitFor(() => {
      expect(mockEditPeriodisasi).toHaveBeenCalled();
    });

    const [id, payload] = mockEditPeriodisasi.mock.calls[0];
    expect(id).toBe(9);
    expect(payload).toMatchObject({
      name: "Periode Baru",
      month: "2024-02",
      start_date: "2024-02-01",
      end_date: "2024-02-28",
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });
});
