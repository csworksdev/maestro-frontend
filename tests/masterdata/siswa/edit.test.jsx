import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import Edit from "../../../src/pages/masterdata/siswa/edit";

const mockNavigate = vi.fn();
const mockLocation = { state: { isupdate: "false", data: {} } };

const { mockAddSiswa, mockEditSiswa, mockGetCabangAll } = vi.hoisted(() => ({
  mockAddSiswa: vi.fn(),
  mockEditSiswa: vi.fn(),
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

vi.mock("@/axios/masterdata/siswa", () => ({
  AddSiswa: (...args) => mockAddSiswa(...args),
  EditSiswa: (...args) => mockEditSiswa(...args),
}));

vi.mock("@/axios/referensi/cabang", () => ({
  getCabangAll: (...args) => mockGetCabangAll(...args),
}));

vi.mock("sweetalert2", () => ({
  default: {
    fire: (...args) => mockSwalFire(...args),
  },
}));

vi.mock("react-flatpickr", () => ({
  default: ({ onChange }) => (
    <input
      aria-label="Tanggal Lahir"
      type="text"
      onChange={(event) => onChange([new Date(event.target.value)])}
    />
  ),
}));

vi.mock("@/components/ui/Card", () => ({
  default: ({ title, children }) => (
    <section>
      <h1>{typeof title === "string" ? title : "Form Siswa"}</h1>
      {children}
    </section>
  ),
}));

vi.mock("@/components/ui/Button", () => ({
  default: ({ children, onClick }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
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

vi.mock("@/components/ui/Radio", () => ({
  default: ({ label, value, checked, onChange }) => (
    <label>
      <input
        type="radio"
        value={value}
        checked={checked}
        onChange={onChange}
      />
      {label}
    </label>
  ),
}));

describe("Siswa edit page", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockAddSiswa.mockReset();
    mockEditSiswa.mockReset();
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
    mockAddSiswa.mockResolvedValue({ status: true });
    mockSwalFire.mockResolvedValue({});

    render(<Edit />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Nama Lengkap"), "Siswa A");
    await user.clear(screen.getByLabelText("Panggilan"));
    await user.type(screen.getByLabelText("Panggilan"), "A");
    await user.clear(screen.getByLabelText("Nama orang tua"));
    await user.type(screen.getByLabelText("Nama orang tua"), "Ortu A");
    await user.type(screen.getByLabelText("Telephone"), "08123456789");
    await user.clear(screen.getByLabelText("Alamat"));
    await user.type(screen.getByLabelText("Alamat"), "Alamat A");
    await user.clear(screen.getByLabelText("Tempat Lahir"));
    await user.type(screen.getByLabelText("Tempat Lahir"), "Jakarta");
    await user.type(screen.getByLabelText("Tanggal Lahir"), "2020-01-01");
    await user.selectOptions(screen.getByLabelText("Cabang"), "1");

    await user.click(screen.getByRole("button", { name: /Add Siswa/i }));

    await waitFor(() => {
      expect(mockAddSiswa).toHaveBeenCalled();
    });

    const [payload] = mockAddSiswa.mock.calls[0];
    expect(payload).toMatchObject({
      fullname: "Siswa A",
      nickname: "A",
      parent: "Ortu A",
      phone: "08123456789",
      address: "Alamat A",
      pob: "Jakarta",
      branch: "1",
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  it("submits update flow", async () => {
    mockLocation.state = {
      isupdate: "true",
      data: {
        student_id: 9,
        fullname: "Siswa Lama",
        nickname: "SL",
        gender: "L",
        parent: "Ortu Lama",
        phone: "0811111111",
        address: "Alamat Lama",
        dob: "2020-01-01",
        pob: "Bandung",
        branch: "1",
      },
    };
    mockGetCabangAll.mockResolvedValue({
      data: { results: [{ branch_id: 1, name: "Cabang A" }] },
    });
    mockEditSiswa.mockResolvedValue({ status: true });
    mockSwalFire.mockResolvedValue({});

    render(<Edit />);

    const user = userEvent.setup();
    await user.clear(screen.getByLabelText("Nama Lengkap"));
    await user.type(screen.getByLabelText("Nama Lengkap"), "Siswa Baru");
    await user.clear(screen.getByLabelText("Telephone"));
    await user.type(screen.getByLabelText("Telephone"), "089999999");
    await user.selectOptions(screen.getByLabelText("Cabang"), "1");

    await user.click(screen.getByRole("button", { name: /Update Siswa/i }));

    await waitFor(() => {
      expect(mockEditSiswa).toHaveBeenCalled();
    });

    const [id, payload] = mockEditSiswa.mock.calls[0];
    expect(id).toBe(9);
    expect(payload).toMatchObject({
      fullname: "Siswa Baru",
      phone: "089999999",
      branch: "1",
      student_id: 9,
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });
});
