import { describe, expect, it } from "vitest";
import getCareerErrorMessage from "./careerErrorMessage";

describe("getCareerErrorMessage", () => {
  it("hides Django HTML and database tracebacks", () => {
    const error = {
      response: {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
        data: "<!doctype html><html><body>OperationalError at /api/career/jobs/ Traceback connection to server at 127.0.0.1 failed</body></html>",
      },
    };

    expect(getCareerErrorMessage(error)).toBe(
      "Server sedang mengalami gangguan. Silakan coba lagi beberapa saat."
    );
  });

  it("uses a clear message when the server cannot be reached", () => {
    const error = {
      isAxiosError: true,
      code: "ERR_NETWORK",
      message: "Network Error",
    };

    expect(getCareerErrorMessage(error)).toBe(
      "Tidak dapat terhubung ke server. Periksa koneksi Anda lalu coba lagi."
    );
  });

  it("keeps safe validation messages from the API", () => {
    const error = {
      response: {
        status: 400,
        data: { message: "Judul loker wajib diisi." },
      },
    };

    expect(getCareerErrorMessage(error)).toBe("Judul loker wajib diisi.");
  });

  it("does not expose long technical responses without a status", () => {
    const error = {
      response: {
        data: `OperationalError ${"database traceback ".repeat(40)}`,
      },
    };

    expect(getCareerErrorMessage(error, "Data loker gagal dimuat.")).toBe(
      "Data loker gagal dimuat."
    );
  });
});
