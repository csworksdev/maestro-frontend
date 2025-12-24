import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import Siswa from "../../../src/pages/masterdata/siswa/index";

const mockNavigate = vi.fn();

const { mockDeleteSiswa, mockGetSiswaAll, mockUseAuthStore } = vi.hoisted(
  () => ({
    mockDeleteSiswa: vi.fn(),
    mockGetSiswaAll: vi.fn(),
    mockUseAuthStore: vi.fn(),
  })
);

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

vi.mock("@/axios/masterdata/siswa", () => ({
  DeleteSiswa: (...args) => mockDeleteSiswa(...args),
  getSiswaAll: (...args) => mockGetSiswaAll(...args),
}));

vi.mock("@/redux/slicers/authSlice", () => ({
  useAuthStore: (selector) => mockUseAuthStore(selector),
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

vi.mock("@/components/ui/Card", () => ({
  default: ({ title, headerslot, children }) => (
    <section>
      <h1>{title}</h1>
      {headerslot}
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
        <div key={row.student_id}>
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

describe("Siswa list page", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockDeleteSiswa.mockReset();
    mockGetSiswaAll.mockReset();
    mockUseAuthStore.mockReset();
    mockSwalFire.mockReset();
    mockInvalidateQueries.mockReset();
    mockUseQuery.mockReset();
    mockUseMutation.mockReset();

    mockUseAuthStore.mockImplementation((selector) =>
      selector({ data: { roles: "Staff" } })
    );

    mockUseQuery.mockImplementation(() => {
      return {
        data: {
          count: 1,
          results: [
            {
              student_id: 11,
              fullname: "Siswa A",
              nickname: "SA",
              gender: "L",
              dob: "2020-01-01",
              branch_name: "Cabang A",
            },
          ],
        },
        isLoading: false,
      };
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

  it("navigates to edit when edit action clicked", async () => {
    render(<Siswa />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "edit" }));

    expect(mockNavigate).toHaveBeenCalledWith("edit", {
      state: {
        isupdate: "true",
        data: {
          student_id: 11,
          fullname: "Siswa A",
          nickname: "SA",
          gender: "L",
          dob: "2020-01-01",
          branch_name: "Cabang A",
        },
      },
    });
  });

  it("deletes siswa after confirmation", async () => {
    mockDeleteSiswa.mockResolvedValue({ status: true });
    mockSwalFire.mockResolvedValueOnce({ isConfirmed: true });

    render(<Siswa />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "delete" }));

    await waitFor(() => {
      expect(mockDeleteSiswa).toHaveBeenCalledWith(11);
    });
  });
});
