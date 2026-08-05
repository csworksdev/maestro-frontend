import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DateTime } from "luxon";
import { Icon } from "@iconify/react";
import Badge from "@/components/ui/Badge";
import Tooltip from "@/components/ui/Tooltip";
import Icons from "@/components/ui/Icon";
import { toProperCase } from "@/utils";
import {
  checkProduct,
  columnHeader,
  formatCompletedScheduleDate,
  getCompletedOrderKey,
  getCompletedScheduleLastTrainingDate,
  getCompletedScheduleOrderDate,
  getCompletedScheduleProductLabel,
  getCompletedSchedulesForSlot,
  getStudentNames,
  getTrainerWorkStatus,
  getTrainerWorkStatusClassName,
} from "../utils/scheduleHelpers";

const STATUS_MAP = {
  pending: {
    label: "Pending",
    className: "bg-amber-500 text-white",
  },
  paid: {
    label: "Paid",
    className: "bg-emerald-500 text-white",
  },
  expired: {
    label: "Expired",
    className: "bg-danger-500 text-white",
  },
};

const PaymentStatusBadge = React.memo(({ status }) => {
  const statusKey = status?.toLowerCase();
  const { label, className } = STATUS_MAP[statusKey] || {
    label: status,
    className: "bg-gray-300 text-white",
  };

  if (statusKey === "settled") return null;

  return (
    <Badge
      label={label}
      className={
        className +
        " animate-bounce justify-center text-[clamp(8px,0.7vw,10px)] p-1"
      }
    />
  );
});

const PelatihLibur = React.memo(() => {
  return (
    <div className="flex w-full justify-center">
      <span className="inline-flex min-w-[60px] items-center justify-center rounded bg-white/75 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-rose-700 shadow-sm">
        Libur
      </span>
    </div>
  );
});

const PelatihAdaJadwal = React.memo(({ poolNames = [], count = 0 }) => {
  const list = poolNames.length ? poolNames : ["kolam lain"];
  const heading = count > 1 ? `Sudah ada ${count} jadwal` : "Sudah ada jadwal";

  return (
    <div className="flex justify-center items-center">
      <Tooltip
        placement="top"
        arrow
        content={
          <div className="whitespace-pre-line text-sm text-white">
            {`${heading}\n${list.join("\n")}`}
          </div>
        }
      >
        <div className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition duration-200 ease-in-out shadow-sm cursor-default">
          <Icon
            icon="heroicons-outline:hand-raised"
            width="20"
            height="20"
            className="text-slate-600"
          />
        </div>
      </Tooltip>
    </div>
  );
});

const CompletedScheduleHint = React.memo(({ schedules = [] }) => {
  if (!schedules.length) return null;

  const visibleSchedules = schedules.slice(0, 5);
  const hiddenCount = schedules.length - visibleSchedules.length;

  return (
    <div className="flex w-full justify-center">
      <Tooltip
        placement="top"
        arrow
        interactive
        theme="custom-light"
        maxWidth={420}
        content={
          <div className="w-[320px] max-w-[calc(100vw-48px)] text-left">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-1 pb-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Icon
                    icon="heroicons-outline:archive-box"
                    width="17"
                    height="17"
                    className="shrink-0 text-sky-600"
                  />
                  <span>Latest slot ini</span>
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  Order selesai di pelatih dan jam yang sama.
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-200">
                {schedules.length}
              </span>
            </div>
            <div className="mt-2 max-h-[260px] space-y-2 overflow-y-auto pr-1">
              {visibleSchedules.map((schedule, index) => {
                const students = getStudentNames(schedule);
                const orderDate = getCompletedScheduleOrderDate(schedule);
                const lastTrainingDate =
                  getCompletedScheduleLastTrainingDate(schedule);

                return (
                  <div
                    key={`${getCompletedOrderKey(schedule)}-${index}`}
                    className="rounded-lg border border-slate-200 bg-slate-50/80 p-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="inline-flex min-w-[38px] justify-center rounded-md bg-primary-500 px-2 py-1 text-xs font-semibold text-white">
                        {getCompletedScheduleProductLabel(schedule)}
                      </span>
                      {lastTrainingDate ? (
                        <span className="whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500 ring-1 ring-slate-200">
                          {formatCompletedScheduleDate(lastTrainingDate)}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 text-xs font-medium leading-snug text-slate-700">
                      {students.length
                        ? students.map((name) => toProperCase(name)).join(", ")
                        : "Siswa tidak tersedia"}
                    </div>
                    <div className="mt-2 grid gap-1 border-t border-slate-200 pt-2 text-[11px] text-slate-500">
                      <div className="flex items-center justify-between gap-2">
                        <span>Order</span>
                        <span className="font-semibold text-slate-700">
                          {orderDate
                            ? formatCompletedScheduleDate(orderDate)
                            : "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span>Latihan terakhir</span>
                        <span className="font-semibold text-slate-700">
                          {lastTrainingDate
                            ? formatCompletedScheduleDate(lastTrainingDate)
                            : "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {hiddenCount > 0 ? (
              <div className="mt-2 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500">
                +{hiddenCount} order lainnya
              </div>
            ) : null}
          </div>
        }
      >
        <div className="mx-auto flex w-[104px] max-w-full flex-col justify-center gap-1.5 overflow-hidden rounded-md border-2 border-sky-300 bg-sky-50 p-1.5 text-slate-700 shadow-md shadow-sky-200/60 transition hover:border-sky-400 hover:bg-white">
          <Badge
            label="Riwayat"
            className="justify-center rounded-full border border-sky-200 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-sky-700 shadow-sm"
          />
        </div>
      </Tooltip>
    </div>
  );
});

const EmptyScheduleButton = React.memo(
  ({ pool, trainer, hari, jam, onCreateOrder }) => {
    return (
      <div className="flex justify-center items-center">
        <Tooltip placement="top" arrow content="Buat Order">
          <button
            onClick={() => onCreateOrder({ pool, trainer, hari, jam })}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 hover:bg-emerald-100 transition duration-200 ease-in-out transform hover:scale-105 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70"
          >
            <Icon
              icon="heroicons-outline:plus"
              width="12"
              height="12"
              className="text-emerald-600"
            />
          </button>
        </Tooltip>
      </div>
    );
  },
);

const PendingReschedule = React.memo(() => {
  return (
    <div className="flex justify-center items-center">
      <Tooltip placement="top" arrow content="Sedang menunggu reschedule">
        <button className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-50 hover:bg-yellow-100 transition duration-200 ease-in-out transform hover:scale-105 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/70">
          <Icon
            icon="heroicons-outline:x-circle"
            width="12"
            height="12"
            className="text-yellow-600"
          />
        </button>
      </Tooltip>
    </div>
  );
});

const PerpanjangPaket = React.memo(
  ({ orderId, slot, onPerpanjang, buttonClassName = "", iconClassName = "" }) => {
    return (
      <div className="flex justify-center items-center">
        <Tooltip placement="top" arrow content="Perpanjang Paket">
          <button
            onClick={(event) => {
              event.preventDefault();
              onPerpanjang(orderId, slot);
            }}
            className={
              buttonClassName ||
              "p-2 rounded-full bg-pink-50 hover:bg-pink-100 transition duration-200 ease-in-out transform hover:scale-105 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300/70"
            }
          >
            <Icon
              icon="heroicons-outline:heart"
              width="20"
              height="20"
              className={iconClassName || "text-pink-600"}
            />
          </button>
        </Tooltip>
      </div>
    );
  },
);

const getCardColor = (slot) => {
  let cardColor =
    "bg-white border-2 border-green-500 shadow-md shadow-lime-200/50";

  const pLastRaw = slot.p?.[slot.p.length - 1]?.tgl;
  if (pLastRaw) {
    const pLast = DateTime.fromFormat(pLastRaw, "dd/MM/yyyy");
    const diff = DateTime.now().diff(pLast, "days").days;

    if (diff > 2) cardColor = "bg-red-200 shadow-md shadow-red-500/50";
    else if (diff > 0)
      cardColor = "bg-yellow-500 shadow-md shadow-lime-500/50";
  }

  return cardColor;
};

const getSlotStatus = (slot) => {
  const pLastRaw = slot.p?.[slot.p.length - 1]?.tgl;
  if (!pLastRaw) {
    return {
      label: "Aktif",
      className: "bg-emerald-500",
      textClassName: "text-emerald-700",
    };
  }

  const pLast = DateTime.fromFormat(pLastRaw, "dd/MM/yyyy");
  const diff = DateTime.now().diff(pLast, "days").days;

  if (diff > 2) {
    return {
      label: "Paket selesai Lewat dari 2 hari",
      className: "bg-red-500",
      textClassName: "text-red-700",
    };
  }
  if (diff > 0) {
    return {
      label: "Perlu follow up",
      className: "bg-yellow-500",
      textClassName: "text-yellow-700",
    };
  }

  return {
    label: "Aktif",
    className: "bg-emerald-500",
    textClassName: "text-emerald-700",
  };
};

const OrderDetail = React.memo(({ slot, detailKey, checked, userId, onPerpanjang }) => {
  const students = slot.student?.filter(Boolean) ?? [];
  const studentText = students.length
    ? students.map(toProperCase).join(", ")
    : "Tanpa nama siswa";
  const status = getSlotStatus(slot);

  return (
    <div
      key={detailKey}
      className={`${getCardColor(slot)} rounded-lg border p-2.5 text-slate-700`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border border-pink-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-pink-700 shadow-sm">
              {toProperCase(slot.admin)}
            </span>
            <Badge
              label={checkProduct(slot.product)}
              className="bg-primary-500 text-white justify-center text-[10px]"
            />
            {!checked ? <PaymentStatusBadge status={slot.is_paid} /> : null}
          </div>
          <div className="mt-2 text-xs font-semibold leading-relaxed text-slate-700">
            {studentText}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
            {slot.frequency_per_week > 1 ? (
              <span>{slot.frequency_per_week}x / minggu</span>
            ) : null}
            <span
              className={`inline-flex items-center gap-1 font-semibold ${status.textClassName}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${status.className}`} />
              {status.label}
            </span>
          </div>
          {slot?.is_paid !== "pending" && slot.p?.length ? (
            <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] text-slate-600">
              {slot.p.slice(-4).map((pItem, idx) => (
                <span
                  key={`${pItem.meet}-${idx}`}
                  className="rounded bg-white/70 px-1.5 py-0.5"
                >
                  P{pItem.meet}: {pItem.tgl || "-"}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-center gap-2">
          {userId === "f7d9fff1-5455-4cb5-bb92-9bea6a61b447" && (
            <button
              onClick={() => {
                const text = `order_id = '${slot.order_id}'`;
                navigator.clipboard.writeText(text);
              }}
              className="rounded-full bg-white/80 p-1 text-blue-500 shadow-sm hover:text-blue-700"
            >
              <Icons
                icon="heroicons-outline:clipboard-copy"
                className="h-4 w-4"
              />
            </button>
          )}
          <PerpanjangPaket
            orderId={slot.order_id}
            slot={slot}
            onPerpanjang={onPerpanjang}
            buttonClassName="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-pink-600 shadow-sm transition hover:bg-pink-50"
            iconClassName="text-pink-600"
          />
        </div>
      </div>
    </div>
  );
});

const SamePoolOrders = React.memo(
  ({ slots, tooltipKey, trainer, jam, checked, userId, onPerpanjang }) => {
    if (!slots.length) return null;

    const products = Array.from(
      new Set(slots.map((slot) => checkProduct(slot.product))),
    );
    const studentPreview =
      slots[0].student?.filter(Boolean).slice(0, 2).map(toProperCase) ?? [];

    return (
      <Tooltip
        key={tooltipKey}
        placement="top"
        arrow
        interactive
        theme="custom-light"
        maxWidth={420}
        content={
          <div className="w-[360px] max-w-[calc(100vw-48px)] text-left">
            <div className="mb-2 flex items-start justify-between gap-3 border-b border-slate-200 pb-2">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {slots.length > 1
                    ? `${slots.length} jadwal di slot ini`
                    : "Detail jadwal"}
                </div>
                <div className="text-[11px] text-slate-500">
                  {toProperCase(trainer.nickname)} - {jam}
                </div>
              </div>
              <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-700 ring-1 ring-primary-100">
                {products.join(", ")}
              </span>
            </div>
            <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
              {slots.map((slot, detailIndex) => (
                <OrderDetail
                  key={`${tooltipKey}-${detailIndex}`}
                  detailKey={`${tooltipKey}-${detailIndex}`}
                  slot={slot}
                  checked={checked}
                  userId={userId}
                  onPerpanjang={onPerpanjang}
                />
              ))}
            </div>
          </div>
        }
      >
        <button
          type="button"
          className="mx-auto flex w-full max-w-[96px] items-center justify-center rounded-lg border border-primary-100 bg-white px-2 py-1.5 text-center shadow-sm transition hover:border-primary-300 hover:bg-primary-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
        >
          {studentPreview.length ? (
            <div className="line-clamp-2 text-[11px] font-semibold leading-[1.15] text-slate-600">
              {studentPreview.join(", ")}
            </div>
          ) : null}
        </button>
      </Tooltip>
    );
  },
);

const ScheduleSlot = React.memo(
  ({
    trainer,
    pool,
    timeSlot,
    slotObj,
    slotIndex,
    completedScheduleIndex,
    checked,
    userId,
    onCreateOrder,
    onPerpanjang,
  }) => {
    const orders = Array.isArray(slotObj.orders) ? slotObj.orders : [];
    const completedOrders = getCompletedSchedulesForSlot(
      completedScheduleIndex,
      trainer,
      slotObj.jam,
    );

    if (orders[0]?.is_free) {
      return (
        <div className="flex min-h-[56px] flex-col items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/80 p-1.5 shadow-sm shadow-rose-100/60">
          <CompletedScheduleHint schedules={completedOrders} />
          <PelatihLibur />
          {orders[orders.length - 1]?.is_pending_reschedule ? (
            <div>{orders[orders.length - 1]?.status}</div>
          ) : (
            <EmptyScheduleButton
              pool={pool}
              trainer={trainer}
              hari={timeSlot.hari}
              jam={slotObj.jam}
              onCreateOrder={onCreateOrder}
            />
          )}
        </div>
      );
    }

    const isOtherPoolSlot = (slot) =>
      slot.order_id &&
      slot.pool_name !== pool.label &&
      Array.isArray(slot.p) &&
      slot.p.every((item) => item.tgl === null);

    const samePoolOrders = orders.filter(
      (slot) => slot.order_id && slot.pool_name === pool.label,
    );
    const otherPoolOrders = orders.filter(isOtherPoolSlot);
    const otherPoolNames = Array.from(
      new Set(otherPoolOrders.map((slot) => slot.pool_name).filter(Boolean)),
    );

    return (
      <div
        className="flex min-h-[56px] flex-col justify-center gap-1.5"
      >
        <SamePoolOrders
          slots={samePoolOrders}
          tooltipKey={`${timeSlot.hari}-${slotIndex}`}
          trainer={trainer}
          jam={slotObj.jam}
          checked={checked}
          userId={userId}
          onPerpanjang={onPerpanjang}
        />

        <CompletedScheduleHint schedules={completedOrders} />

        {otherPoolOrders.length > 0 && (
          <PelatihAdaJadwal
            poolNames={otherPoolNames}
            count={otherPoolOrders.length}
          />
        )}

        {orders[orders.length - 1]?.is_pending_reschedule ? (
          <PendingReschedule />
        ) : (
          <EmptyScheduleButton
            pool={pool}
            trainer={trainer}
            hari={timeSlot.hari}
            jam={slotObj.jam}
            onCreateOrder={onCreateOrder}
          />
        )}
      </div>
    );
  },
);

const ScheduleRow = React.memo(
  ({
    trainer,
    pool,
    selectedDay,
    completedScheduleIndex,
    checked,
    userId,
    onCreateOrder,
    onPerpanjang,
  }) => {
    const workStatus = getTrainerWorkStatus(trainer);
    const filteredDataHari =
      trainer.datahari?.filter((item) => item.hari === selectedDay) || [];

    return (
      <div className="grid grid-cols-15 gap-2 w-full border-b border-slate-100 px-2 py-1 transition hover:bg-white dark:border-slate-800 dark:hover:bg-slate-900/70">
        <div
          className={`p-2 min-h-[78px] flex flex-col rounded-xl border border-white/50 shadow-sm sticky left-0 z-20 justify-center gap-1 ${
            trainer.gender === "L"
              ? "bg-blue-100 text-blue-900 ring-1 ring-blue-200/70"
              : "bg-pink-100 text-pink-900 ring-1 ring-pink-200/70"
          }`}
        >
          <span className="text-[clamp(8px,0.7vw,10px)] p-1 font-semibold leading-tight">
            {trainer.nickname && (
              <>
                {toProperCase(trainer.nickname)}
                <br />({trainer.total_order})
              </>
            )}
          </span>
          {workStatus && (
            <span
              className={`mx-1 inline-flex max-w-full items-center justify-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold leading-none ${getTrainerWorkStatusClassName(
                workStatus,
              )}`}
              title={`Status kerja: ${workStatus}`}
            >
              {workStatus}
            </span>
          )}
        </div>

        {filteredDataHari.flatMap((timeSlot) =>
          timeSlot.data.map((slotObj, slotIndex) => (
            <ScheduleSlot
              key={`${timeSlot.hari}-${slotObj.jam}-${slotIndex}`}
              trainer={trainer}
              pool={pool}
              timeSlot={timeSlot}
              slotObj={slotObj}
              slotIndex={slotIndex}
              completedScheduleIndex={completedScheduleIndex}
              checked={checked}
              userId={userId}
              onCreateOrder={onCreateOrder}
              onPerpanjang={onPerpanjang}
            />
          )),
        )}
      </div>
    );
  },
);

const ScheduleTable = React.memo(
  ({
    pool,
    day,
    jadwal,
    filteredPelatih,
    filteredGender,
    completedScheduleIndex,
    checked,
    userId,
    onCreateOrder,
    onPerpanjang,
  }) => {
    const scrollContainerRef = useRef(null);
    const [scrollHeight, setScrollHeight] = useState(null);

    const dataJadwal = useMemo(
      () =>
        jadwal.filter((trainer) => {
          const matchesTrainer =
            !filteredPelatih || trainer.trainer_id === filteredPelatih;
          const matchesGender =
            !filteredGender || trainer.gender === filteredGender;
          return matchesTrainer && matchesGender;
        }),
      [filteredGender, filteredPelatih, jadwal],
    );

    const updateScrollHeight = useCallback(() => {
      if (!scrollContainerRef.current) return;
      const { top } = scrollContainerRef.current.getBoundingClientRect();
      const paddingBottom = 24;
      const calculatedHeight = window.innerHeight - top - paddingBottom;
      if (calculatedHeight > 0) {
        setScrollHeight(Math.max(calculatedHeight, 200));
      }
    }, []);

    useEffect(() => {
      updateScrollHeight();
      window.addEventListener("resize", updateScrollHeight);
      return () => window.removeEventListener("resize", updateScrollHeight);
    }, [updateScrollHeight]);

    useEffect(() => {
      updateScrollHeight();
    }, [dataJadwal, updateScrollHeight]);

    return (
      <div className="w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/70 dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
        <div className="overflow-x-auto bg-slate-50/70 dark:bg-slate-950/20">
          <div className="min-w-[1200px]">
            <div className="grid grid-cols-15 gap-2 w-full sticky top-0 z-20 bg-slate-100/95 backdrop-blur border-b border-slate-200/70 dark:bg-slate-900/95 dark:border-slate-700">
              <div className="border-b border-slate-200/70 p-2 min-h-[40px] text-center text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center justify-center sticky left-0 top-0 bg-slate-100/95 z-30 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200">
                Pelatih
              </div>
              {columnHeader.slice(1).map((header) => (
                <div
                  key={header}
                  className="border-b border-slate-200/70 p-2 min-h-[58px] text-center text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center justify-center sticky top-0 bg-slate-100/95 z-20 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200"
                >
                  {header}
                </div>
              ))}
            </div>

            <div
              ref={scrollContainerRef}
              className="overflow-y-auto"
              style={
                scrollHeight ? { maxHeight: `${scrollHeight}px` } : undefined
              }
            >
              {dataJadwal.map((trainer) => (
                <ScheduleRow
                  key={trainer.trainer_id}
                  trainer={trainer}
                  pool={pool}
                  selectedDay={day}
                  completedScheduleIndex={completedScheduleIndex}
                  checked={checked}
                  userId={userId}
                  onCreateOrder={onCreateOrder}
                  onPerpanjang={onPerpanjang}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export default ScheduleTable;
