import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import Edit from "../../../../src/pages/referensi/cabang/edit";

const mockNavigate = vi.fn();
const mockLocation = { state: { isupdate: "false", data: {} } };

const { mockAddCabang, mockEditCabang } = vi.hoisted(() => ({
  mockAddCabang: vi.fn(),
  mockEditCabang: vi.fn(),
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

vi.mock("@/axios/referensi/cabang", () => ({
  AddCabang: (...args) => mockAddCabang(...args),
  EditCabang: (...args) => mockEditCabang(...args),
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

describe("Cabang edit page", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockAddCabang.mockReset();
    mockEditCabang.mockReset();
    mockSwalFire.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("submits add flow", async () => {
    mockLocation.state = { isupdate: "false", data: {} };
    mockAddCabang.mockResolvedValue({ status: true });
    mockSwalFire.mockResolvedValue({});

    render(<Edit />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Nama Cabang"), "Cabang A");
    await user.click(screen.getByRole("button", { name: /Add Cabang/i }));

    await waitFor(() => {
      expect(mockAddCabang).toHaveBeenCalledWith({ name: "Cabang A" });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  it("submits update flow", async () => {
    mockLocation.state = {
      isupdate: "true",
      data: { branch_id: 5, name: "Cabang Lama" },
    };
    mockEditCabang.mockResolvedValue({ status: true });
    mockSwalFire.mockResolvedValue({});

    render(<Edit />);

    const user = userEvent.setup();
    await user.clear(screen.getByLabelText("Nama Cabang"));
    await user.type(screen.getByLabelText("Nama Cabang"), "Cabang Baru");
    await user.click(screen.getByRole("button", { name: /Update Cabang/i }));

    await waitFor(() => {
      expect(mockEditCabang).toHaveBeenCalled();
      const [id, payload] = mockEditCabang.mock.calls[0];
      expect(id).toBe(5);
      expect(payload).toMatchObject({ name: "Cabang Baru" });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });
});
