import React from "react";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import Edit from "../../../src/pages/order/active/edit";

const mockNavigate = vi.fn();
const { mockFormValues, mockSetValue } = vi.hoisted(() => ({
  mockFormValues: {
    order_date: new Date("2024-02-01"),
    start_date: new Date("2024-02-02"),
    trainer: "trainer-1",
    pool: "pool-1",
    branch: "b1",
    day: "Senin",
    jam: "09.00",
    promo: "PROMO",
    is_finish: false,
  },
  mockSetValue: vi.fn(),
}));

const {
  mockEditOrder,
  mockFindAvailableTrainer,
  mockGetProdukPool,
  mockGetSiswaAll,
  mockGetSiswaByBranch,
  mockSearchSiswa,
  mockGetKolamByBranch,
  mockGetCabangAll,
} = vi.hoisted(() => ({
  mockEditOrder: vi.fn(),
  mockFindAvailableTrainer: vi.fn(),
  mockGetProdukPool: vi.fn(),
  mockGetSiswaAll: vi.fn(),
  mockGetSiswaByBranch: vi.fn(),
  mockSearchSiswa: vi.fn(),
  mockGetKolamByBranch: vi.fn(),
  mockGetCabangAll: vi.fn(),
}));

const mockSwalFire = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
  };
});

vi.mock("react-hook-form", () => ({
  useForm: () => ({
    register: () => ({}),
    setValue: mockSetValue,
    handleSubmit: (callback) => () => callback(mockFormValues),
    formState: { errors: {} },
  }),
}));

vi.mock("@/axios/masterdata/order", () => ({
  EditOrder: (...args) => mockEditOrder(...args),
  FindAvailableTrainer: (...args) => mockFindAvailableTrainer(...args),
}));

vi.mock("@/axios/masterdata/produk", () => ({
  getProdukPool: (...args) => mockGetProdukPool(...args),
}));

vi.mock("@/axios/masterdata/siswa", () => ({
  getSiswaAll: (...args) => mockGetSiswaAll(...args),
  getSiswaByBranch: (...args) => mockGetSiswaByBranch(...args),
  searchSiswa: (...args) => mockSearchSiswa(...args),
}));

vi.mock("@/axios/referensi/kolam", () => ({
  getKolamByBranch: (...args) => mockGetKolamByBranch(...args),
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
  default: ({ children }) => <section>{children}</section>,
}));

vi.mock("@/components/ui/Textinput", () => ({
  default: ({ name, label, register, defaultValue, type = "text" }) => (
    <label>
      {label}
      <input
        aria-label={label}
        type={type}
        defaultValue={defaultValue}
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
    onChange,
  }) => {
    const registered = register ? register(name) : {};
    return (
      <label>
        {label}
        <select
          aria-label={label}
          defaultValue={defaultValue}
          {...registered}
          onChange={(event) => {
            registered.onChange?.(event);
            onChange?.(event);
          }}
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
    );
  },
}));

vi.mock("@/components/ui/Textarea", () => ({
  default: ({ label, register, name, value, defaultValue, disabled }) => (
    <label>
      {label}
      <textarea
        aria-label={label}
        value={value ?? defaultValue ?? ""}
        disabled={disabled}
        {...(register ? register(name) : {})}
      />
    </label>
  ),
}));

vi.mock("@/components/ui/Radio", () => ({
  default: ({ label, value, checked, onChange }) => (
    <label>
      <input
        aria-label={label}
        type="radio"
        value={value}
        checked={checked}
        onChange={onChange}
      />
      {label}
    </label>
  ),
}));

vi.mock("@/components/ui/Button", () => ({
  default: ({ text, children, onClick }) => (
    <button type="button" onClick={onClick}>
      {text ?? children}
    </button>
  ),
}));

vi.mock("react-flatpickr", () => ({
  default: ({ onChange, name, defaultValue, value }) => (
    <input
      aria-label={name}
      type="date"
      defaultValue={value ?? defaultValue}
      onChange={(event) => onChange([new Date(event.target.value)])}
    />
  ),
}));

vi.mock("react-select/async", () => ({
  default: ({ onChange }) => (
    <button
      type="button"
      onClick={() => onChange([{ value: "stu-1", label: "Student A" }])}
    >
      Select Students
    </button>
  ),
}));

describe("Edit order page", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockEditOrder.mockReset();
    mockFindAvailableTrainer.mockReset();
    mockGetProdukPool.mockReset();
    mockGetSiswaAll.mockReset();
    mockGetSiswaByBranch.mockReset();
    mockSearchSiswa.mockReset();
    mockGetKolamByBranch.mockReset();
    mockGetCabangAll.mockReset();
    mockSwalFire.mockReset();
    mockSetValue.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("submits update order flow", async () => {
    const orderData = {
      order_id: 42,
      branch: "b1",
      pool: "pool-1",
      day: "Senin",
      time: "09.00",
      trainer_gender: "L",
      promo: "PROMO",
      students: [{ student_id: "stu-1", student_fullname: "Student A" }],
      trainer: "trainer-1",
      trainer_name: "Trainer A",
      product: "prod-1",
      order_date: "2024-01-10",
      start_date: "2024-01-15",
      is_finish: false,
    };

    mockGetCabangAll.mockResolvedValue({
      data: { results: [{ branch_id: "b1", name: "Cabang A" }] },
    });
    mockGetKolamByBranch.mockResolvedValue({
      data: { results: [{ pool_id: "pool-1", name: "Kolam A", notes: "Note" }] },
    });
    mockGetSiswaByBranch.mockResolvedValue({
      data: { results: [{ student_id: "stu-1", fullname: "Student A" }] },
    });
    mockGetProdukPool.mockResolvedValue({
      data: {
        results: [
          {
            product_id: "prod-1",
            name: "Produk 1",
            price: 1000,
            package: "pkg-1",
            meetings: 2,
            max_student: 2,
          },
        ],
      },
    });
    mockFindAvailableTrainer.mockResolvedValue({
      data: {
        results: [
          {
            trainer_id: "trainer-1",
            fullname: "Trainer A",
            precentage_fee: 20,
          },
        ],
      },
    });
    mockGetSiswaAll.mockResolvedValue({
      data: { results: [{ student_id: "stu-1", fullname: "Student A" }] },
    });
    mockEditOrder.mockResolvedValue({ status: true });
    mockSwalFire.mockResolvedValue({});

    render(<Edit state={{ data: orderData }} onClose={vi.fn()} />);

    await screen.findByRole("button", { name: "Update Order" });
    await waitFor(() => {
      expect(mockGetProdukPool).toHaveBeenCalledWith("pool-1");
      expect(mockFindAvailableTrainer).toHaveBeenCalled();
    });

    const user = userEvent.setup();

    await user.selectOptions(screen.getByLabelText("Cabang"), "b1");
    await user.selectOptions(screen.getByLabelText("Kolam"), "pool-1");
    await user.selectOptions(screen.getByLabelText("Hari"), "Senin");
    await user.selectOptions(screen.getByLabelText("Jam"), "09.00");
    await user.click(screen.getByRole("radio", { name: /Produk 1/i }));
    await user.click(
      screen.getByRole("button", { name: "Select Students" })
    );
    await user.selectOptions(screen.getByLabelText("Pelatih"), "trainer-1");

    fireEvent.change(screen.getByLabelText("order_date"), {
      target: { value: "2024-02-01" },
    });
    fireEvent.change(screen.getByLabelText("start_date"), {
      target: { value: "2024-02-02" },
    });
    const submitButton = screen.getByRole("button", { name: "Update Order" });
    const form = submitButton.closest("form");
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(mockEditOrder).toHaveBeenCalledWith(
        42,
        expect.objectContaining({
          product: "prod-1",
          trainer: "trainer-1",
          pool: "pool-1",
          branch: "b1",
          grand_total: 1000,
          trainer_percentage: 20,
          company_percentage: 80,
        })
      );
    });
  });
});
