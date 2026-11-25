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
  buildTrainerTotalOrderWebSocketEndpoint,
  getDeviceTodayIndex,
  isOtherPoolConflict,
  mergeScheduleWithTrainerTotals,
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

  it("membentuk endpoint trainer total order hanya dengan token", () => {
    expect(
      buildTrainerTotalOrderWebSocketEndpoint({ token: "access+/=token" }),
    ).toBe("/ws/trainer-total-order/?token=access%2B%2F%3Dtoken");
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

  it("menutup availability saat pelatih sudah mengajar di kolam lain", () => {
    const selectedPool = { value: "pool-b", label: "Kolam B" };
    const orderAtPoolA = {
      order_id: "order-1",
      pool_id: "pool-a",
      pool_name: "Kolam A",
      p: [{ meet: 1, tgl: "24/11/2026" }],
    };

    expect(isOtherPoolConflict(orderAtPoolA, selectedPool)).toBe(true);
  });

  it("menutup tombol tambah order berdasarkan flag is_other_pool", () => {
    const selectedPool = {
      value: "pool-b",
      label: "Kolam B",
    };
    const otherPoolOrder = {
      jam: "07.00",
      is_free: false,
      is_other_pool: true,
      order_id: "d1870f62-c804-4570-b517-c52838b88ffc",
      student: ["Arsyad Muhammad Wibowo"],
      product: "jakarta14_baru",
      pool_name: "Homevisit Jakarta",
    };

    expect(isOtherPoolConflict(otherPoolOrder, selectedPool)).toBe(true);
  });

  it("menghormati is_other_pool false sebagai data kolam aktif", () => {
    expect(
      isOtherPoolConflict(
        {
          is_other_pool: false,
          order_id: "order-current-pool",
          pool_name: "Nama berbeda dari label",
        },
        { value: "pool-b", label: "Kolam B" },
      ),
    ).toBe(false);
  });

  it("tidak menganggap order di kolam aktif sebagai bentrok lintas kolam", () => {
    const selectedPool = { value: "pool-b", label: "Kolam B" };
    const orderAtPoolB = {
      order_id: "order-2",
      pool_id: "pool-b",
      pool_name: "Kolam B",
      p: [{ meet: 1, tgl: null }],
    };

    expect(isOtherPoolConflict(orderAtPoolB, selectedPool)).toBe(false);
  });

  it("menggabungkan jadwal global ke pelatih yang sama", () => {
    const selectedPoolSchedule = [
      {
        trainer_id: "trainer-wahyu",
        nickname: "C. Wahyu Jkt",
        total_order: 0,
        datahari: [{ hari: "Senin", data: { "11.00": [] } }],
      },
    ];
    const globalTrainerSchedule = [
      {
        trainer_id: "trainer-wahyu",
        total_order: 19,
        datahari: [
          {
            hari: "Senin",
            data: {
              "11.00": [
                {
                  order_id: "order-timbul",
                  pool_id: "de-entrance",
                  pool_name: "DE Entrance Arkadia",
                },
              ],
            },
          },
        ],
      },
    ];

    const [wahyu] = mergeScheduleWithTrainerTotals(
      selectedPoolSchedule,
      globalTrainerSchedule,
      "Senin",
    );

    expect(wahyu.total_order).toBe(19);
    expect(wahyu.datahari[0].data["11.00"][0].order_id).toBe("order-timbul");
  });
});
