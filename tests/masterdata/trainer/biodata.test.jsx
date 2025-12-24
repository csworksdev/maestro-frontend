import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import Biodata from "../../../src/pages/masterdata/trainer/biodata";

const mockNavigate = vi.fn();

const { mockAddTrainer, mockEditTrainer, mockGetCabangAll } = vi.hoisted(
  () => ({
    mockAddTrainer: vi.fn(),
    mockEditTrainer: vi.fn(),
    mockGetCabangAll: vi.fn(),
  })
);

const mockSwalFire = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/axios/masterdata/trainer", () => ({
  AddTrainer: (...args) => mockAddTrainer(...args),
  EditTrainer: (...args) => mockEditTrainer(...args),
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

describe("Trainer biodata form", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockAddTrainer.mockReset();
    mockEditTrainer.mockReset();
    mockGetCabangAll.mockReset();
    mockSwalFire.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("submits add flow", async () => {
    const updatedData = vi.fn();
    mockGetCabangAll.mockResolvedValue({
      data: { results: [{ branch_id: 1, name: "Cabang A" }] },
    });
    mockAddTrainer.mockResolvedValue({ status: true });
    mockSwalFire.mockResolvedValue({});

    render(<Biodata isupdate="false" data={{}} updatedData={updatedData} />);

    const user = userEvent.setup();
    await screen.findByLabelText("Nama Trainer");

    await user.type(screen.getByLabelText("Nama Trainer"), "Trainer A");
    await user.type(screen.getByLabelText("Panggilan"), "TA");
    await user.selectOptions(screen.getByLabelText("Jenis Kelamin"), "L");
    await user.type(screen.getByLabelText("Tanggal Lahir"), "1990-01-01");
    await user.type(
      screen.getByLabelText("Tanggal Registrasi"),
      "2024-01-05"
    );
    await user.type(screen.getByLabelText("Bagi Hasil"), "10");
    await user.selectOptions(screen.getByLabelText("Cabang"), "1");

    await user.click(screen.getByRole("button", { name: /Add Trainer/i }));

    await waitFor(() => {
      expect(mockAddTrainer).toHaveBeenCalled();
    });

    const [payload] = mockAddTrainer.mock.calls[0];
    expect(payload).toMatchObject({
      fullname: "Trainer A",
      nickname: "TA",
      gender: "L",
      precentage_fee: 10,
      is_active: false,
      is_fulltime: false,
      branch: "1",
      dob: "1990-01-01",
      reg_date: "2024-01-05",
    });

    await waitFor(() => {
      expect(updatedData).toHaveBeenCalledWith(expect.objectContaining(payload));
    });
  });

  it("submits update flow", async () => {
    const updatedData = vi.fn();
    mockGetCabangAll.mockResolvedValue({
      data: { results: [{ branch_id: 1, name: "Cabang A" }] },
    });
    mockEditTrainer.mockResolvedValue({ status: true });
    mockSwalFire.mockResolvedValue({});

    render(
      <Biodata
        isupdate="true"
        data={{
          trainer_id: 9,
          fullname: "Trainer Lama",
          nickname: "TL",
          gender: "P",
          dob: "1989-01-01",
          reg_date: "2024-01-01",
          precentage_fee: 5,
          is_active: true,
          is_fulltime: false,
          branch: "1",
        }}
        updatedData={updatedData}
      />
    );

    const user = userEvent.setup();
    await screen.findByLabelText("Nama Trainer");

    await user.clear(screen.getByLabelText("Nama Trainer"));
    await user.type(screen.getByLabelText("Nama Trainer"), "Trainer Baru");
    await user.clear(screen.getByLabelText("Bagi Hasil"));
    await user.type(screen.getByLabelText("Bagi Hasil"), "15");
    await user.selectOptions(screen.getByLabelText("Jenis Kelamin"), "P");
    await user.type(screen.getByLabelText("Tanggal Lahir"), "1989-02-01");
    await user.type(
      screen.getByLabelText("Tanggal Registrasi"),
      "2024-02-01"
    );

    await user.click(screen.getByRole("button", { name: /Update Trainer/i }));

    await waitFor(() => {
      expect(mockEditTrainer).toHaveBeenCalled();
    });

    const [id, payload] = mockEditTrainer.mock.calls[0];
    expect(id).toBe(9);
    expect(payload).toMatchObject({
      trainer_id: 9,
      fullname: "Trainer Baru",
      gender: "P",
      precentage_fee: 15,
      is_active: true,
      is_fulltime: false,
      branch: "1",
      dob: "1989-02-01",
      reg_date: "2024-02-01",
    });

    await waitFor(() => {
      expect(updatedData).toHaveBeenCalledWith(expect.objectContaining(payload));
    });
  });
});
