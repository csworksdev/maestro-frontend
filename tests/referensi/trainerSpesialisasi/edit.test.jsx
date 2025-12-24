import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import Edit from "../../../src/pages/referensi/trainerSpesialisasi/edit";

const mockNavigate = vi.fn();

const {
  mockAddTrainerSpecialization,
  mockEditTrainerSpecialization,
  mockGetSpecializationAll,
} = vi.hoisted(() => ({
  mockAddTrainerSpecialization: vi.fn(),
  mockEditTrainerSpecialization: vi.fn(),
  mockGetSpecializationAll: vi.fn(),
}));

const mockSwalFire = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: {} }),
  };
});

vi.mock("@/axios/referensi/trainerSpecialization", () => ({
  AddTrainerSpecialization: (...args) =>
    mockAddTrainerSpecialization(...args),
  EditTrainerSpecialization: (...args) =>
    mockEditTrainerSpecialization(...args),
}));

vi.mock("@/axios/referensi/specialization", () => ({
  getSpecializationAll: (...args) => mockGetSpecializationAll(...args),
}));

vi.mock("sweetalert2", () => ({
  default: {
    fire: (...args) => mockSwalFire(...args),
  },
}));

vi.mock("@/components/ui/Button", () => ({
  default: ({ text, children, onClick }) => (
    <button type="button" onClick={onClick}>
      {text || children}
    </button>
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

describe("Trainer specialization edit", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockAddTrainerSpecialization.mockReset();
    mockEditTrainerSpecialization.mockReset();
    mockGetSpecializationAll.mockReset();
    mockSwalFire.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("submits add flow", async () => {
    const onSaved = vi.fn();
    mockGetSpecializationAll.mockResolvedValue({
      data: { results: [{ specialization_id: 1, name: "Spec A" }] },
    });
    mockAddTrainerSpecialization.mockResolvedValue({ status: true });
    mockSwalFire.mockResolvedValue({});

    render(
      <Edit
        trainerId={7}
        isupdate="false"
        selectedSpecializations={[{ specialization_id: 1 }]}
        onSaved={onSaved}
      />
    );

    const user = userEvent.setup();
    await screen.findByText("Spec A");
    await user.click(
      screen.getByRole("button", { name: /Simpan Spesialisasi/i })
    );

    await waitFor(() => {
      expect(mockAddTrainerSpecialization).toHaveBeenCalled();
    });

    const [id, payload] = mockAddTrainerSpecialization.mock.calls[0];
    expect(id).toBe(7);
    expect(payload).toMatchObject({
      specialization: "1",
      specialization_id: "1",
    });

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalled();
    });
  });

  it("submits update flow", async () => {
    const onSaved = vi.fn();
    mockGetSpecializationAll.mockResolvedValue({
      data: { results: [{ specialization_id: 2, name: "Spec B" }] },
    });
    mockEditTrainerSpecialization.mockResolvedValue({ status: true });
    mockSwalFire.mockResolvedValue({});

    render(
      <Edit
        trainerId={9}
        isupdate="true"
        data={{ specialization_id: 2 }}
        selectedSpecializations={[{ specialization_id: 2 }]}
        onSaved={onSaved}
      />
    );

    const user = userEvent.setup();
    await screen.findByText("Spec B");

    await user.click(
      screen.getByRole("button", { name: /Update Spesialisasi/i })
    );

    await waitFor(() => {
      expect(mockEditTrainerSpecialization).toHaveBeenCalled();
    });

    const [id, payload] = mockEditTrainerSpecialization.mock.calls[0];
    expect(id).toBe(9);
    expect(payload).toMatchObject({
      specialization: "2",
      specialization_id: "2",
    });

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalled();
    });
  });
});
