import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import Loker from "./index";
import store from "@/store";

vi.mock("@/axios/career/jobs", () => ({
  getDepartments: vi.fn().mockResolvedValue({ data: [] }),
  getBranches: vi.fn().mockResolvedValue({ data: [] }),
  getCareerJobs: vi.fn().mockResolvedValue({
    data: [{
      job_id: "job-1",
      title: "Swimming Coach",
      description: "<p>Deskripsi pertama</p>",
      requirements: "<p>Syarat pertama<br>Syarat kedua</p>",
      benefits: "<p>Benefit pertama</p>",
      status: "published",
    }],
  }),
  deleteCareerJob: vi.fn(),
  updateCareerJobStatus: vi.fn(),
  addCareerJob: vi.fn(),
  editCareerJob: vi.fn(),
  getCareerJob: vi.fn(),
}));

afterEach(cleanup);

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

it("renders the Loker page and job list", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <Loker />
      </QueryClientProvider>
    </Provider>,
  );

  expect((await screen.findAllByText("Swimming Coach")).length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole("button", { name: "Tambah" }));
  expect(await screen.findByLabelText("Deskripsi")).toBeInTheDocument();
});
