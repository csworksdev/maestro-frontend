import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  CJCompletedSchedule,
  CJGetBranchDay,
} from "../../src/axios/schedule/cekJadwal";
import {
  createScheduleCacheKey,
  createScheduleOwnerScope,
  sanitizeScheduleCacheData,
} from "../../src/utils/scheduleCache";
import {
  buildCompletedScheduleWebSocketEndpoint,
  buildScheduleWebSocketEndpoint,
  getDeviceTodayIndex,
} from "../../src/pages/order/cekJadwal/utils/scheduleHelpers";

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }));

vi.mock("../../src/axios/config", () => ({
  axiosConfig: { get: (...args) => mockGet(...args) },
}));

describe("cek jadwal filtered API", () => {
  beforeEach(() => mockGet.mockReset());

  it("mengirim filter dan ETag saat mengambil jadwal", async () => {
    const response = { status: 304 };
    const controller = new AbortController();
    mockGet.mockResolvedValue(response);

    const result = await CJGetBranchDay("branch-1", "pool-2", "Senin", {
      signal: controller.signal,
      etag: '"schedule-v4"',
    });

    expect(result).toBe(response);
    expect(mockGet).toHaveBeenCalledWith(
      "/api/cekjadwal/getschedule/",
      expect.objectContaining({
        params: { branch: "branch-1", pool: "pool-2", day: "Senin" },
        signal: controller.signal,
        headers: expect.objectContaining({
          "Cache-Control": "no-cache",
          "If-None-Match": '"schedule-v4"',
        }),
      }),
    );
  });

  it("mengirim filter yang sama untuk jadwal selesai", async () => {
    mockGet.mockResolvedValue({ status: 200, data: [] });

    await CJCompletedSchedule("branch-1", "pool-2", "Selasa");

    expect(mockGet).toHaveBeenCalledWith(
      "/api/cekjadwal/gecompleted-schedule/",
      expect.objectContaining({
        params: { branch: "branch-1", pool: "pool-2", day: "Selasa" },
      }),
    );
  });

  it("membentuk endpoint websocket jadwal dengan token", () => {
    const endpoint = buildScheduleWebSocketEndpoint({
      branch: "branch-1",
      pool: "Pool Utama",
      day: "Senin",
      token: "access+/=token",
    });

    expect(endpoint).toBe(
      "/ws/schedule/?branch=branch-1&pool=Pool+Utama&day=Senin&token=access%2B%2F%3Dtoken",
    );
  });

  it("tidak membentuk endpoint websocket jadwal tanpa token", () => {
    expect(
      buildScheduleWebSocketEndpoint({
        branch: "branch-1",
        pool: "pool-2",
        day: "Senin",
        token: "",
      }),
    ).toBeNull();
  });

  it("membentuk endpoint websocket completed schedule dengan token", () => {
    const endpoint = buildCompletedScheduleWebSocketEndpoint({
      branch: "branch-1",
      pool: "Pool Utama",
      day: "Senin",
      token: "access+/=token",
    });

    expect(endpoint).toBe(
      "/ws/completed-schedule/?branch=branch-1&pool=Pool+Utama&day=Senin&token=access%2B%2F%3Dtoken",
    );
  });

  it("tidak membentuk endpoint completed schedule tanpa token", () => {
    expect(
      buildCompletedScheduleWebSocketEndpoint({
        branch: "branch-1",
        pool: "pool-2",
        day: "Senin",
        token: "",
      }),
    ).toBeNull();
  });

  it("memisahkan cache berdasarkan jenis, cabang, kolam, dan hari", () => {
    const owner = createScheduleOwnerScope({
      userId: "user-7",
      tenantId: "tenant-2",
    });
    expect(
      createScheduleCacheKey({
        owner,
        type: "schedule",
        branch: "Branch 1",
        pool: "Pool A",
        day: "Senin",
      }),
    ).toBe("tenant-2%3A%3Auser-7::schedule::branch%201::pool%20a::senin");
  });

  it("tidak membuat cache tanpa identitas pengguna", () => {
    expect(
      createScheduleCacheKey({
        owner: "",
        type: "schedule",
        branch: "branch-1",
        pool: "pool-1",
        day: "Senin",
      }),
    ).toBe("");
  });

  it("membuang field sensitif dan mempertahankan field tampilan", () => {
    const sanitized = sanitizeScheduleCacheData([
      {
        trainer_id: "trainer-1",
        nickname: "Budi",
        phone: "08123456789",
        internal_notes: "rahasia",
        datahari: [
          {
            hari: "Senin",
            data: [
              {
                jam: "08.00",
                orders: [
                  {
                    order_id: "order-1",
                    student: ["Ani"],
                    product: "Private 8",
                    medical_notes: "sensitif",
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);

    expect(sanitized[0]).not.toHaveProperty("phone");
    expect(sanitized[0]).not.toHaveProperty("internal_notes");
    expect(sanitized[0].datahari[0].data[0].orders[0]).toEqual({
      order_id: "order-1",
      student: ["Ani"],
      product: "Private 8",
    });
  });

  it("memetakan kalender lokal perangkat ke urutan tab hari", () => {
    expect(getDeviceTodayIndex(new Date(2026, 10, 9))).toBe(0); // Senin
    expect(getDeviceTodayIndex(new Date(2026, 10, 14))).toBe(5); // Sabtu
    expect(getDeviceTodayIndex(new Date(2026, 10, 15))).toBe(6); // Minggu
  });
});
