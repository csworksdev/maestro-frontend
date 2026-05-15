import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { DateTime } from "luxon";

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
let dateTimeNowSpy;

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

vi.mock("@/components/ui/Icon", () => ({
  default: ({ icon }) => <span data-testid="icon">{icon}</span>,
}));

describe("Trainer list page", () => {
  beforeEach(() => {
    dateTimeNowSpy = vi
      .spyOn(DateTime, "now")
      .mockReturnValue(DateTime.fromISO("2026-05-15T00:00:00.000"));

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
              reg_date: "2024-01-05",
              is_fulltime: true,
              avatar: null,
            },
            {
              trainer_id: 12,
              fullname: "Trainer B",
              nickname: "TB",
              gender: "P",
              dob: "1995-02-02",
              is_active: false,
              branch_name: "Cabang B",
              reg_date: "2025-02-10",
              is_fulltime: false,
              avatar: "https://example.com/trainer-b.jpg",
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
    dateTimeNowSpy?.mockRestore();
  });

  it("renders trainer cards with work type, registration date, and membership duration", async () => {
    render(<Trainer />);

    expect(await screen.findByText("Trainer A")).toBeInTheDocument();
    expect(screen.getByText("Trainer B")).toBeInTheDocument();
    expect(screen.getByText("Fulltime")).toBeInTheDocument();
    expect(screen.getByText("Freelance")).toBeInTheDocument();
    expect(screen.getByText("05 Jan 2024")).toBeInTheDocument();
    expect(screen.getByText("10 Feb 2025")).toBeInTheDocument();
    expect(screen.getByText("2 tahun, 4 bulan, 10 hari")).toBeInTheDocument();
    expect(screen.getByText("1 tahun, 3 bulan, 5 hari")).toBeInTheDocument();
  });

  it("shows avatar preview when trainer avatar is clicked", async () => {
    render(<Trainer />);

    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "Lihat avatar Trainer B" })
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getAllByAltText("Trainer B")).toHaveLength(2);
  });

  it("navigates to edit when edit action clicked", async () => {
    render(<Trainer />);

    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "Edit Trainer A" })
    );

    expect(mockNavigate).toHaveBeenCalledWith("Edit", {
      state: {
        isupdate: "true",
        data: expect.objectContaining({
          trainer_id: 11,
          fullname: "Trainer A",
          nickname: "TA",
          gender: "L",
          dob: "1990-01-01",
          is_active: true,
          branch_name: "Cabang A",
          reg_date: "2024-01-05",
          is_fulltime: true,
        }),
      },
    });
  });

  it("deletes trainer after confirmation", async () => {
    mockDeleteTrainer.mockResolvedValue({ status: true });
    mockSwalFire.mockResolvedValueOnce({ isConfirmed: true });

    render(<Trainer />);

    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "Hapus Trainer A" })
    );

    await waitFor(() => {
      expect(mockDeleteTrainer).toHaveBeenCalledWith(11);
    });
  });
});
