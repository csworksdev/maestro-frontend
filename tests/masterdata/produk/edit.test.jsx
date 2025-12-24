import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import Edit from "../../../src/pages/masterdata/produk/edit";

const mockNavigate = vi.fn();
const mockLocation = { state: { isupdate: "false", data: {} } };

const {
  mockAddProduk,
  mockEditProduk,
  mockGetKolamAll,
  mockGetPaketAll,
} = vi.hoisted(() => ({
  mockAddProduk: vi.fn(),
  mockEditProduk: vi.fn(),
  mockGetKolamAll: vi.fn(),
  mockGetPaketAll: vi.fn(),
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

vi.mock("@/axios/masterdata/produk", () => ({
  AddProduk: (...args) => mockAddProduk(...args),
  EditProduk: (...args) => mockEditProduk(...args),
}));

vi.mock("@/axios/referensi/kolam", () => ({
  getKolamAll: (...args) => mockGetKolamAll(...args),
}));

vi.mock("@/axios/referensi/paket", () => ({
  getPaketAll: (...args) => mockGetPaketAll(...args),
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

describe("Produk edit page", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockAddProduk.mockReset();
    mockEditProduk.mockReset();
    mockGetKolamAll.mockReset();
    mockGetPaketAll.mockReset();
    mockSwalFire.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("submits add flow", async () => {
    mockLocation.state = { isupdate: "false", data: {} };
    mockGetKolamAll.mockResolvedValue({
      data: { results: [{ pool_id: 1, name: "Pool A" }] },
    });
    mockGetPaketAll.mockResolvedValue({
      data: { results: [{ package_id: 2, name: "Paket A" }] },
    });
    mockAddProduk.mockResolvedValue({ status: true });
    mockSwalFire.mockResolvedValue({});

    render(<Edit />);

    const user = userEvent.setup();
    await screen.findByLabelText("Nama Produk");

    await user.type(screen.getByLabelText("Nama Produk"), "Produk A");
    await user.selectOptions(screen.getByLabelText("Kolam"), "1");
    await user.selectOptions(screen.getByLabelText("Paket"), "2");
    await user.type(screen.getByLabelText("Pertemuan"), "10");
    await user.type(screen.getByLabelText("Harga"), "1000");
    await user.type(screen.getByLabelText("Harga Jual"), "1200");

    await user.click(screen.getByRole("button", { name: /Add Produk/i }));

    await waitFor(() => {
      expect(mockAddProduk).toHaveBeenCalled();
    });

    const [payload] = mockAddProduk.mock.calls[0];
    expect(payload).toMatchObject({
      name: "Produk A",
      pool: "1",
      package: "2",
      meetings: 10,
      price: 1000,
      sellprice: 1200,
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  it("submits update flow", async () => {
    mockLocation.state = {
      isupdate: "true",
      data: {
        product_id: 9,
        name: "Produk Lama",
        pool: "1",
        package: "2",
        meetings: 5,
        price: 500,
        sellprice: 700,
      },
    };
    mockGetKolamAll.mockResolvedValue({
      data: { results: [{ pool_id: 1, name: "Pool A" }] },
    });
    mockGetPaketAll.mockResolvedValue({
      data: { results: [{ package_id: 2, name: "Paket A" }] },
    });
    mockEditProduk.mockResolvedValue({ status: true });
    mockSwalFire.mockResolvedValue({});

    render(<Edit />);

    const user = userEvent.setup();
    await screen.findByLabelText("Nama Produk");

    await user.clear(screen.getByLabelText("Nama Produk"));
    await user.type(screen.getByLabelText("Nama Produk"), "Produk Baru");
    await user.selectOptions(screen.getByLabelText("Kolam"), "1");
    await user.selectOptions(screen.getByLabelText("Paket"), "2");
    await user.clear(screen.getByLabelText("Pertemuan"));
    await user.type(screen.getByLabelText("Pertemuan"), "12");
    await user.clear(screen.getByLabelText("Harga"));
    await user.type(screen.getByLabelText("Harga"), "1500");
    await user.clear(screen.getByLabelText("Harga Jual"));
    await user.type(screen.getByLabelText("Harga Jual"), "1800");

    await user.click(screen.getByRole("button", { name: /Update Produk/i }));

    await waitFor(() => {
      expect(mockEditProduk).toHaveBeenCalled();
    });

    const [id, payload] = mockEditProduk.mock.calls[0];
    expect(id).toBe(9);
    expect(payload).toMatchObject({
      name: "Produk Baru",
      pool: "1",
      package: "2",
      meetings: 12,
      price: 1500,
      sellprice: 1800,
      product_id: 9,
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });
});
