import { describe, expect, it } from "vitest";
import { getBlogErrorMessage } from "./blogAlerts";

describe("getBlogErrorMessage", () => {
  it("does not expose an HTML error response", () => {
    const error = {
      response: {
        status: 404,
        data: "<!DOCTYPE html><html><body>ERR_NGROK_3200</body></html>",
      },
    };

    expect(getBlogErrorMessage(error, "Data blog gagal dimuat.")).toBe(
      "Data blog gagal dimuat.",
    );
  });

  it("returns friendly messages for server and network errors", () => {
    expect(
      getBlogErrorMessage(
        { response: { status: 503, data: "Internal Server Error" } },
        "Data blog gagal dimuat.",
      ),
    ).toBe("Server sedang mengalami gangguan. Silakan coba lagi beberapa saat.");

    expect(getBlogErrorMessage({ code: "ERR_NETWORK" }, "Fallback")).toBe(
      "Tidak dapat terhubung ke server. Periksa koneksi internet Anda lalu coba lagi.",
    );
  });

  it("keeps useful validation messages without exposing technical payloads", () => {
    expect(
      getBlogErrorMessage(
        { response: { status: 400, data: { name: ["This field is required."] } } },
        "Gagal menyimpan.",
      ),
    ).toBe("Kolom ini wajib diisi.");

    expect(
      getBlogErrorMessage(
        { response: { status: 400, data: "Traceback: SQLSTATE error" } },
        "Gagal menyimpan.",
      ),
    ).toBe("Gagal menyimpan.");
  });
});
