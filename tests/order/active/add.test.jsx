import React from "react";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import Add from "../../../src/pages/order/active/add";

const mockNavigate = vi.fn();
const mockLocation = { state: { isupdate: "false", data: {} } };

const {
  mockAddOrder,
  mockEditOrder,
  mockFindAvailableTrainer,
  mockGetProdukPool,
  mockGetSiswaAll,
  mockGetSiswaByBranch,
  mockSearchSiswa,
  mockGetKolamByBranch,
  mockAddOrderDetail,
  mockUpdateTrainerSchedule,
  mockGetCabangAll,
} = vi.hoisted(() => ({
  mockAddOrder: vi.fn(),
  mockEditOrder: vi.fn(),
  mockFindAvailableTrainer: vi.fn(),
  mockGetProdukPool: vi.fn(),
  mockGetSiswaAll: vi.fn(),
  mockGetSiswaByBranch: vi.fn(),
  mockSearchSiswa: vi.fn(),
  mockGetKolamByBranch: vi.fn(),
  mockAddOrderDetail: vi.fn(),
  mockUpdateTrainerSchedule: vi.fn(),
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

vi.mock("@/axios/masterdata/order", () => ({
  AddOrder: (...args) => mockAddOrder(...args),
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

vi.mock("@/axios/masterdata/orderDetail", () => ({
  AddOrderDetail: (...args) => mockAddOrderDetail(...args),
}));

vi.mock("@/axios/masterdata/trainerSchedule", () => ({
  UpdateTrainerSchedule: (...args) => mockUpdateTrainerSchedule(...args),
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
  default: ({ label, register, name, value, disabled }) => (
    <label>
      {label}
      <textarea
        aria-label={label}
        value={value ?? ""}
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

vi.mock("@/components/ui/Modal", () => ({
  default: ({ activeModal, children }) => (activeModal ? <div>{children}</div> : null),
}));

vi.mock("@/pages/masterdata/siswa/edit", () => ({
  default: () => <div>Student Edit</div>,
}));

vi.mock("react-flatpickr", () => ({
  default: ({ onChange, name, defaultValue }) => (
    <input
      aria-label={name}
      type="date"
      defaultValue={defaultValue}
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

describe("Add order page", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockAddOrder.mockReset();
    mockEditOrder.mockReset();
    mockFindAvailableTrainer.mockReset();
    mockGetProdukPool.mockReset();
    mockGetSiswaAll.mockReset();
    mockGetSiswaByBranch.mockReset();
    mockSearchSiswa.mockReset();
    mockGetKolamByBranch.mockReset();
    mockAddOrderDetail.mockReset();
    mockUpdateTrainerSchedule.mockReset();
    mockGetCabangAll.mockReset();
    mockSwalFire.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("submits add order flow", async () => {
    mockLocation.state = { isupdate: "false", data: {} };
    mockGetCabangAll.mockResolvedValue({
      data: { results: [{ branch_id: "b1", name: "Cabang A" }] },
    });
    mockGetSiswaAll.mockResolvedValue({
      data: { results: [{ student_id: "stu-1", fullname: "Student A" }] },
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
            unfinished_order_count: 0,
          },
        ],
      },
    });
    mockAddOrder.mockResolvedValue({ data: { order_id: 77 } });
    mockAddOrderDetail.mockResolvedValue({ status: "success" });
    mockUpdateTrainerSchedule.mockResolvedValue({});
    mockSwalFire.mockResolvedValue({});

    render(<Add />);

    await screen.findByRole("heading", { name: "Add Order" });

    const user = userEvent.setup();

    await user.selectOptions(screen.getByLabelText("Cabang"), "b1");
    await waitFor(() => {
      expect(mockGetKolamByBranch).toHaveBeenCalledWith("b1", {
        page: 1,
        page_size: 50,
      });
    });

    await user.selectOptions(screen.getByLabelText("Kolam"), "pool-1");
    await waitFor(() => {
      expect(mockGetProdukPool).toHaveBeenCalledWith("pool-1");
    });

    await user.click(screen.getByRole("radio", { name: /Produk 1/i }));

    fireEvent.change(screen.getByLabelText("order_date"), {
      target: { value: "2024-02-01" },
    });

    await user.click(screen.getByRole("button", { name: "Select Students" }));

    await waitFor(() => {
      expect(mockFindAvailableTrainer).toHaveBeenCalled();
    });

    await user.selectOptions(screen.getByLabelText("Pelatih"), "trainer-1");

    await user.click(screen.getByRole("button", { name: "Add Order" }));

    await waitFor(() => {
      expect(mockAddOrder).toHaveBeenCalled();
    });

    const [payload] = mockAddOrder.mock.calls[0];
    expect(payload).toMatchObject({
      product: "prod-1",
      trainer: "trainer-1",
      pool: "pool-1",
      branch: "b1",
      students: [{ student_id: "stu-1" }],
      grand_total: 1000,
      trainer_percentage: 20,
      company_percentage: 80,
    });

    await waitFor(() => {
      expect(mockAddOrderDetail).toHaveBeenCalled();
      expect(mockUpdateTrainerSchedule).toHaveBeenCalledWith({
        coach: "trainer-1",
        day: "Senin",
        time: "09.00",
        is_free: false,
      });
    });
  });
});
