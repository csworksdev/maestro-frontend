import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import Trainer from "../../../src/pages/masterdata/trainer/index";

const mockNavigate = vi.fn();

const { mockDeleteTrainer, mockGetTrainerAll } = vi.hoisted(() => ({
  mockDeleteTrainer: vi.fn(),
  mockGetTrainerAll: vi.fn(),
}));

const mockSwalFire = vi.fn();
const mockInvalidateQueries = vi.fn();
const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();
const mockSetLoading = vi.fn();
const mockUseLoadingStore = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children }) => <div>{children}</div>,
  };
});

vi.mock("@/axios/masterdata/trainer", () => ({
  DeleteTrainer: (...args) => mockDeleteTrainer(...args),
  getTrainerAll: (...args) => mockGetTrainerAll(...args),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: (options) => mockUseQuery(options),
  useMutation: (options) => mockUseMutation(options),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

vi.mock("@/redux/slicers/loadingSlice", () => ({
  setLoading: (...args) => mockSetLoading(...args),
  useLoadingStore: (selector) => mockUseLoadingStore(selector),
}));

vi.mock("sweetalert2", () => ({
  default: {
    fire: (...args) => mockSwalFire(...args),
  },
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
        <div key={row.trainer_id}>
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

describe("Trainer list page", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockDeleteTrainer.mockReset();
    mockGetTrainerAll.mockReset();
    mockSwalFire.mockReset();
    mockInvalidateQueries.mockReset();
    mockUseQuery.mockReset();
    mockUseMutation.mockReset();
    mockSetLoading.mockReset();
    mockUseLoadingStore.mockReset();

    mockUseLoadingStore.mockImplementation((selector) =>
      selector({ isLoading: false })
    );

    mockUseQuery.mockImplementation(() => {
      return {
        data: {
          count: 1,
          results: [
            {
              trainer_id: 11,
              fullname: "Trainer A",
              nickname: "TA",
              gender: "L",
              dob: "1990-01-01",
              is_active: true,
              branch_name: "Cabang A",
            },
          ],
        },
        isLoading: false,
        isFetching: false,
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
    render(<Trainer />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Edit" }));

    expect(mockNavigate).toHaveBeenCalledWith("Edit", {
      state: {
        isupdate: "true",
        data: {
          trainer_id: 11,
          fullname: "Trainer A",
          nickname: "TA",
          gender: "L",
          dob: "1990-01-01",
          is_active: true,
          branch_name: "Cabang A",
        },
      },
    });
  });

  it("deletes trainer after confirmation", async () => {
    mockDeleteTrainer.mockResolvedValue({ status: true });
    mockSwalFire.mockResolvedValueOnce({ isConfirmed: true });

    render(<Trainer />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(mockDeleteTrainer).toHaveBeenCalledWith(11);
    });
  });
});
