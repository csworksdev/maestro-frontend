import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import Edit from "../../../../src/pages/referensi/kolam/edit";

const mockNavigate = vi.fn();
const mockLocation = { state: { isupdate: "false", data: {} } };

const { mockAddKolam, mockEditKolam, mockGetCabangAll } = vi.hoisted(() => ({
  mockAddKolam: vi.fn(),
  mockEditKolam: vi.fn(),
  mockGetCabangAll: vi.fn(),
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

vi.mock("@/axios/referensi/kolam", () => ({
  AddKolam: (...args) => mockAddKolam(...args),
  EditKolam: (...args) => mockEditKolam(...args),
}));

vi.mock("@/axios/referensi/cabang", () => ({
  getCabangAll: (...args) => mockGetCabangAll(...args),
}));

vi.mock("sweetalert2", () => ({
  default: {
    fire: (...args) => mockSwalFire(...args),
  },
}));

vi.mock("@/components/Loading", () => ({
  default: () => <div>Loading</div>,
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

vi.mock("@/components/ui/Textarea", () => ({
  default: ({
    name,
    label,
    register,
    defaultValue,
    placeholder,
  }) => (
    <label>
      {label}
      <textarea
        aria-label={label}
        defaultValue={defaultValue}
        placeholder={placeholder}
        {...(register ? register(name) : {})}
      />
    </label>
  ),
}));

vi.mock("@/components/ui/Select", () => ({
  default: ({
    name,
    label,
    register,
    options = [],
    defaultValue,
    placeholder = "Select",
  }) => (
    <label>
      {label}
      <select
        aria-label={label}
        defaultValue={defaultValue}
        {...(register ? register(name) : {})}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option
            key={option.value ?? option}
            value={option.value ?? option}
          >
            {option.label ?? option}
          </option>
        ))}
      </select>
    </label>
  ),
}));

describe("Kolam edit page", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockAddKolam.mockReset();
    mockEditKolam.mockReset();
    mockGetCabangAll.mockReset();
    mockSwalFire.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("submits add flow", async () => {
    mockLocation.state = { isupdate: "false", data: {} };
    mockGetCabangAll.mockResolvedValue({
      data: { results: [{ branch_id: 1, name: "Cabang A" }] },
    });
    mockAddKolam.mockResolvedValue({ status: true });
    mockSwalFire.mockResolvedValue({});

    render(<Edit />);

    const user = userEvent.setup();
    await screen.findByLabelText("Nama Kolam");

    await user.type(screen.getByLabelText("Nama Kolam"), "Kolam A");
    await user.type(screen.getByLabelText("Alamat Kolam"), "Alamat A");
    await user.type(screen.getByLabelText("No. Telepon"), "08123456789");
    await user.selectOptions(screen.getByLabelText("Cabang"), "1");
    await user.type(screen.getByLabelText("Catatan"), "Catatan A");

    await user.click(screen.getByRole("button", { name: /Add Kolam/i }));

    await waitFor(() => {
      expect(mockAddKolam).toHaveBeenCalled();
    });

    const [payload] = mockAddKolam.mock.calls[0];
    expect(payload).toMatchObject({
      name: "Kolam A",
      address: "Alamat A",
      phone: "08123456789",
      branch: "1",
      notes: "Catatan A",
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  it("submits update flow", async () => {
    mockLocation.state = {
      isupdate: "true",
      data: {
        pool_id: 9,
        name: "Kolam Lama",
        address: "Alamat Lama",
        phone: "0811111111",
        branch: "1",
        notes: "Catatan Lama",
      },
    };
    mockGetCabangAll.mockResolvedValue({
      data: { results: [{ branch_id: 1, name: "Cabang A" }] },
    });
    mockEditKolam.mockResolvedValue({ status: true });
    mockSwalFire.mockResolvedValue({});

    render(<Edit />);

    const user = userEvent.setup();
    await screen.findByLabelText("Nama Kolam");

    await user.clear(screen.getByLabelText("Nama Kolam"));
    await user.type(screen.getByLabelText("Nama Kolam"), "Kolam Baru");
    await user.clear(screen.getByLabelText("Alamat Kolam"));
    await user.type(screen.getByLabelText("Alamat Kolam"), "Alamat Baru");
    await user.clear(screen.getByLabelText("No. Telepon"));
    await user.type(screen.getByLabelText("No. Telepon"), "089999999");
    await user.selectOptions(screen.getByLabelText("Cabang"), "1");
    await user.clear(screen.getByLabelText("Catatan"));
    await user.type(screen.getByLabelText("Catatan"), "Catatan Baru");

    await user.click(screen.getByRole("button", { name: /Update Kolam/i }));

    await waitFor(() => {
      expect(mockEditKolam).toHaveBeenCalled();
    });

    const [id, payload] = mockEditKolam.mock.calls[0];
    expect(id).toBe(9);
    expect(payload).toMatchObject({
      name: "Kolam Baru",
      address: "Alamat Baru",
      phone: "089999999",
      branch: "1",
      notes: "Catatan Baru",
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });
});
