import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import Produk from "../../../src/pages/masterdata/produk/index";

const mockNavigate = vi.fn();

const {
  mockDeleteProduk,
  mockGetProdukPool,
  mockGetKolamByBranch,
  mockGetCabangAll,
} = vi.hoisted(() => ({
  mockDeleteProduk: vi.fn(),
  mockGetProdukPool: vi.fn(),
  mockGetKolamByBranch: vi.fn(),
  mockGetCabangAll: vi.fn(),
}));

const mockSwalFire = vi.fn();
const mockInvalidateQueries = vi.fn();
const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children }) => <div>{children}</div>,
  };
});

vi.mock("@/axios/masterdata/produk", () => ({
  DeleteProduk: (...args) => mockDeleteProduk(...args),
  getProdukPool: (...args) => mockGetProdukPool(...args),
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

vi.mock("@tanstack/react-query", () => ({
  useQuery: (options) => mockUseQuery(options),
  useMutation: (options) => mockUseMutation(options),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

vi.mock("@headlessui/react", () => {
  const Tab = ({ children }) =>
    typeof children === "function" ? children({ selected: false }) : children;
  Tab.Group = ({ children }) => <div>{children}</div>;
  Tab.List = ({ children }) => <div>{children}</div>;
  Tab.Panels = ({ children }) => <div>{children}</div>;
  Tab.Panel = ({ children }) => <div>{children}</div>;
  return { Tab };
});

vi.mock("react-select", () => ({
  default: ({ options = [], value, onChange }) => (
    <select
      aria-label="Cabang"
      value={value?.value ?? ""}
      onChange={(event) => {
        const selected = options.find(
          (option) => String(option.value) === event.target.value,
        );
        onChange?.(selected ?? null);
      }}
    >
      <option value="">Pilih Cabang</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
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

vi.mock("@/components/ui/Button", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock("@/components/skeleton/Table", () => ({
  default: () => <div>Skeleton</div>,
}));

vi.mock("@/components/globals/table/search", () => ({
  default: () => <div>Search</div>,
}));

vi.mock("@/components/globals/table/pagination", () => ({
  default: () => <div>Pagination</div>,
}));

vi.mock("@/components/globals/table/tableAction", () => ({
  default: ({ action, row }) => (
    <button onClick={() => action.onClick(row)}>{action.name}</button>
  ),
}));

vi.mock("@/components/globals/table/table", () => ({
  default: ({ listData, listColumn }) => (
    <div>
      {listData?.results?.map((row) => (
        <div key={row.product_id}>
          {listColumn.map((column) => (
            <div key={column.id || column.accessor}>
              {column.accessor === "action"
                ? column.Cell({ row: { original: row } })
                : null}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
}));

describe("Produk list page", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockDeleteProduk.mockReset();
    mockGetProdukPool.mockReset();
    mockGetKolamByBranch.mockReset();
    mockGetCabangAll.mockReset();
    mockSwalFire.mockReset();
    mockInvalidateQueries.mockReset();
    mockUseQuery.mockReset();
    mockUseMutation.mockReset();

    mockUseQuery.mockImplementation((options) => {
      if (options.enabled === false) {
        return { data: undefined, isLoading: false, isFetching: false };
      }
      const key = options.queryKey?.[0];
      if (key === "branches") {
        return {
          data: [{ value: 1, label: "Cabang A" }],
          isLoading: false,
        };
      }
      if (key === "pools") {
        return {
          data: [{ pool_id: 10, name: "Pool A" }],
          isLoading: false,
        };
      }
      if (key === "produkPool") {
        return {
          data: {
            count: 1,
            results: [
              {
                product_id: 11,
                name: "Produk A",
                package_name: "Paket A",
                meetings: 10,
                price: 1000,
                sellprice: 1200,
              },
            ],
          },
          isLoading: false,
          isFetching: false,
        };
      }
      return { data: undefined, isLoading: false, isFetching: false };
    });

    mockUseMutation.mockImplementation((options) => {
      return {
        mutate: (id, mutateOptions) => {
          Promise.resolve(options.mutationFn(id))
            .then((res) => {
              options.onSuccess?.(res);
              mutateOptions?.onSuccess?.(res);
            })
            .catch((error) => {
              mutateOptions?.onError?.(error);
            });
        },
      };
    });
  });

  afterEach(() => {
    cleanup();
  });

  // it("navigates to edit when edit action clicked", async () => {
  //   render(<Produk />);

  //   const user = userEvent.setup();
  //   await user.click(await screen.findByRole("button", { name: "Edit" }));

  //   expect(mockNavigate).toHaveBeenCalledWith("Edit", {
  //     state: {
  //       isupdate: "true",
  //       data: {
  //         product_id: 11,
  //         name: "Produk A",
  //         package_name: "Paket A",
  //         meetings: 10,
  //         price: 1000,
  //         sellprice: 1200,
  //       },
  //     },
  //   });
  // });

  it("deletes produk after confirmation", async () => {
    mockDeleteProduk.mockResolvedValue({ status: true });
    mockSwalFire.mockResolvedValueOnce({ isConfirmed: true });

    render(<Produk />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(mockDeleteProduk).toHaveBeenCalledWith(11);
    });
  });
});
