import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import Edit from "../../../src/pages/masterdata/trainer/edit";

const mockNavigate = vi.fn();
const mockLocation = {
  state: { isupdate: "true", data: { trainer_id: 9, fullname: "Trainer A" } },
};

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

vi.mock("@headlessui/react", () => {
  const Tab = ({ children }) =>
    typeof children === "function" ? children({ selected: false }) : children;
  Tab.Group = ({ children }) => <div>{children}</div>;
  Tab.List = ({ children }) => <div>{children}</div>;
  Tab.Panels = ({ children }) => <div>{children}</div>;
  Tab.Panel = ({ children }) => <div>{children}</div>;
  return { Tab };
});

vi.mock("@/components/ui/Card", () => ({
  default: ({ children }) => <section>{children}</section>,
}));

vi.mock("@/components/ui/Button", () => ({
  default: ({ text, children, onClick }) => (
    <button type="button" onClick={onClick}>
      {text || children}
    </button>
  ),
}));

vi.mock("../../../src/pages/masterdata/trainer/biodata", () => ({
  default: () => <div>Biodata</div>,
}));

vi.mock("../../../src/pages/masterdata/trainer/jadwal-baru", () => ({
  default: () => <div>JadwalBaru</div>,
}));

vi.mock("@/pages/referensi/trainerSpesialisasi/index", () => ({
  default: ({ onAdd }) => (
    <div>
      <span>SpecList</span>
      <button
        type="button"
        onClick={() =>
          onAdd({
            data: { specialization_id: 1 },
            current_specializations: [],
          })
        }
      >
        Add Spec
      </button>
    </div>
  ),
}));

vi.mock("@/pages/referensi/trainerSpesialisasi/edit", () => ({
  default: ({ onCancel }) => (
    <div>
      <span>SpecForm</span>
      <button type="button" onClick={onCancel}>
        Cancel Spec
      </button>
    </div>
  ),
}));

describe("Trainer edit page", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("navigates back when clicking kembali", async () => {
    render(<Edit />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Kembali" }));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("switches specialization mode", async () => {
    render(<Edit />);

    const user = userEvent.setup();
    expect(screen.getByText("SpecList")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add Spec" }));
    expect(screen.getByText("SpecForm")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel Spec" }));
    expect(screen.getByText("SpecList")).toBeInTheDocument();
  });
});
