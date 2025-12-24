import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import Edit from "../../../src/pages/referensi/paket/edit";

const mockNavigate = vi.fn();
const mockLocation = { state: { isupdate: "false", data: {} } };

const { mockAddPaket, mockEditPaket } = vi.hoisted(() => ({
  mockAddPaket: vi.fn(),
  mockEditPaket: vi.fn(),
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

vi.mock("@/axios/referensi/paket", () => ({
  AddPaket: (...args) => mockAddPaket(...args),
  EditPaket: (...args) => mockEditPaket(...args),
}));

vi.mock("sweetalert2", () => ({
  default: {
    fire: (...args) => mockSwalFire(...args),
  },
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

describe("Edit paket page", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockAddPaket.mockReset();
    mockEditPaket.mockReset();
    mockSwalFire.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("submits add flow", async () => {
    mockLocation.state = { isupdate: "false", data: {} };
    mockAddPaket.mockResolvedValue({ status: true });
    mockSwalFire.mockResolvedValue({});

    render(<Edit />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Nama Paket"), "Paket A");
    await user.type(screen.getByLabelText("Kadaluwarsa (hari)"), "30");
    await user.type(screen.getByLabelText("Durasi (menit)"), "60");
    await user.type(screen.getByLabelText("Minimal Usia (tahun)"), "7");
    await user.type(screen.getByLabelText("Maksimal Usia (tahun)"), "12");
    await user.type(screen.getByLabelText("Batas Siswa"), "20");

    await user.click(screen.getByRole("button", { name: /Add Paket/i }));

    await waitFor(() => {
      expect(mockAddPaket).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Paket A",
          expired_days: 30,
          duration: 60,
          min_age: 7,
          max_age: 12,
          max_student: 20,
        })
      );
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  it("submits update flow", async () => {
    mockLocation.state = {
      isupdate: "true",
      data: { package_id: 9, name: "Old Paket" },
    };
    mockEditPaket.mockResolvedValue({ status: true });
    mockSwalFire.mockResolvedValue({});

    render(<Edit />);

    const user = userEvent.setup();
    await user.clear(screen.getByLabelText("Nama Paket"));
    await user.type(screen.getByLabelText("Nama Paket"), "Paket Baru");
    await user.type(screen.getByLabelText("Kadaluwarsa (hari)"), "15");
    await user.type(screen.getByLabelText("Durasi (menit)"), "45");
    await user.type(screen.getByLabelText("Minimal Usia (tahun)"), "0");
    await user.type(screen.getByLabelText("Maksimal Usia (tahun)"), "0");
    await user.type(screen.getByLabelText("Batas Siswa"), "10");

    await user.click(screen.getByRole("button", { name: /Update Paket/i }));

    await waitFor(() => {
      expect(mockEditPaket).toHaveBeenCalled();
      const [id, payload] = mockEditPaket.mock.calls[0];
      expect(id).toBe(9);
      expect(payload).toMatchObject({
        name: "Paket Baru",
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });
});
