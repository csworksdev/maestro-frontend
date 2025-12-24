import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import Edit from "../../../src/pages/referensi/spesialisasi/edit";

const mockNavigate = vi.fn();
const mockLocation = { state: { isupdate: "false", data: {} } };

const { mockAddSpecialization, mockEditSpecialization } = vi.hoisted(() => ({
  mockAddSpecialization: vi.fn(),
  mockEditSpecialization: vi.fn(),
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

vi.mock("@/axios/referensi/specialization", () => ({
  AddSpecialization: (...args) => mockAddSpecialization(...args),
  EditSpecialization: (...args) => mockEditSpecialization(...args),
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

describe("Specialization edit page", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockAddSpecialization.mockReset();
    mockEditSpecialization.mockReset();
    mockSwalFire.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("submits add flow", async () => {
    mockLocation.state = { isupdate: "false", data: {} };
    mockAddSpecialization.mockResolvedValue({ status: true });
    mockSwalFire.mockResolvedValue({});

    render(<Edit />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Spesialisasi"), "Spec A");
    await user.type(screen.getByLabelText("Alias"), "SPC");

    await user.click(
      screen.getByRole("button", { name: /Add Specialization/i })
    );

    await waitFor(() => {
      expect(mockAddSpecialization).toHaveBeenCalledWith({
        name: "Spec A",
        alias: "SPC",
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  it("submits update flow", async () => {
    mockLocation.state = {
      isupdate: "true",
      data: { specialization_id: 9, name: "Spec Lama", alias: "OLD" },
    };
    mockEditSpecialization.mockResolvedValue({ status: true });
    mockSwalFire.mockResolvedValue({});

    render(<Edit />);

    const user = userEvent.setup();
    await user.clear(screen.getByLabelText("Spesialisasi"));
    await user.type(screen.getByLabelText("Spesialisasi"), "Spec Baru");
    await user.clear(screen.getByLabelText("Alias"));
    await user.type(screen.getByLabelText("Alias"), "NEW");

    await user.click(
      screen.getByRole("button", { name: /Update Specialization/i })
    );

    await waitFor(() => {
      expect(mockEditSpecialization).toHaveBeenCalled();
    });

    const [id, payload] = mockEditSpecialization.mock.calls[0];
    expect(id).toBe(9);
    expect(payload).toMatchObject({
      name: "Spec Baru",
      alias: "NEW",
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });
});
