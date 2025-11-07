import React, { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Textinput from "@/components/ui/Textinput";
import Loading from "@/components/Loading";
import Flatpickr from "react-flatpickr";
import Swal from "sweetalert2";
import { DateTime } from "luxon";
import { hari, jam } from "@/constant/jadwal-default";
import {
  getOrderFrequency,
  updateOrderFrequency,
} from "@/axios/masterdata/order";
import { toProperCase } from "@/utils";

const sanitizeTimeOptions = () =>
  jam.filter((option) => option.value && option.value !== "0");

const ensureSlotLength = (baseSlots = [], target = 1) => {
  if (!target || target < 1) return [{ day: "", time: "" }];
  const slots = baseSlots.length ? [...baseSlots] : [{ day: "", time: "" }];
  while (slots.length < target) {
    const last = slots[slots.length - 1] || { day: "", time: "" };
    slots.push({ day: last.day, time: last.time });
  }
  return slots.slice(0, target).map((slot) => ({
    day: slot?.day || "",
    time: slot?.time || "",
  }));
};

const FrequencyModal = ({ defaultOrder = {}, onClose, onSuccess }) => {
  const orderId = defaultOrder?.order_id;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [frequency, setFrequency] = useState(1);
  const [slots, setSlots] = useState([{ day: "", time: "" }]);
  const [startDate, setStartDate] = useState("");
  const [pendingMeets, setPendingMeets] = useState([]);
  const [orderMeta, setOrderMeta] = useState(null);
  const [trainerSlots, setTrainerSlots] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  const timeOptions = useMemo(() => sanitizeTimeOptions(), []);

  useEffect(() => {
    if (!orderId) return;

    const loadFrequencyData = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const response = await getOrderFrequency(orderId);
        const payload = response.data || {};
        const currentSlots = payload.current_weekly_slots || [];
        const initialFrequency = Math.max(currentSlots.length || 1, 1);
        const pending = payload.pending_meets || [];

        setOrderMeta(payload.order);
        setPendingMeets(pending);
        setTrainerSlots(payload.trainer_slots || []);
        setFrequency(initialFrequency);

        if (pending.length) {
          const defaultStart =
            pending[0]?.schedule_date ||
            DateTime.now().toFormat("yyyy-MM-dd");
          setStartDate(defaultStart);
        } else {
          setStartDate(DateTime.now().toFormat("yyyy-MM-dd"));
        }

        if (currentSlots.length) {
          setSlots(ensureSlotLength(currentSlots, initialFrequency));
        } else {
          const fallback = [];
          if (payload.order?.day && payload.order?.time) {
            fallback.push({
              day: payload.order.day,
              time: payload.order.time,
            });
          } else if (pending[0]?.day && pending[0]?.time) {
            fallback.push({
              day: pending[0].day,
              time: pending[0].time,
            });
          }
          setSlots(ensureSlotLength(fallback, initialFrequency));
        }
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Gagal memuat data frekuensi.";
        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    };

    loadFrequencyData();
  }, [orderId]);

  const handleFrequencyChange = (value) => {
    const parsed = parseInt(value, 10);
    const safeValue = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    setFrequency(safeValue);
    setSlots((prev) => ensureSlotLength(prev, safeValue));
  };

  const handleSlotChange = (index, field, value) => {
    setSlots((prev) =>
      prev.map((slot, idx) =>
        idx === index
          ? {
              ...slot,
              [field]: value,
            }
          : slot
      )
    );
  };

  const handleApply = async () => {
    setErrorMessage("");
    if (!pendingMeets.length) {
      setErrorMessage(
        "Tidak ada pertemuan tersisa yang bisa dijadwalkan ulang."
      );
      return;
    }

    const hasEmptySlot = slots.some(
      (slot) =>
        !slot.day ||
        !slot.time ||
        slot.time === "0" ||
        slot.day === "Pilih Hari"
    );
    if (hasEmptySlot) {
      setErrorMessage("Pastikan setiap slot memiliki hari dan jam yang valid.");
      return;
    }

    const payload = {
      frequency_per_week: frequency,
      slots: slots.map((slot) => ({
        day: slot.day,
        time: slot.time,
      })),
    };
    if (startDate) {
      payload.start_date = startDate;
    }

    setSubmitting(true);
    try {
      const response = await updateOrderFrequency(orderId, payload);
      Swal.fire({
        title: "Berhasil",
        text: "Jadwal latihan telah diperbarui.",
        icon: "success",
        timer: 1200,
        showConfirmButton: false,
      });
      onSuccess?.(response.data);
      onClose?.();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Gagal memperbarui frekuensi.";
      setErrorMessage(message);
      Swal.fire("Error", message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-6">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {orderMeta && (
        <Card title="Ringkasan Order">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Order ID</p>
              <p className="font-semibold">{orderMeta.order_id}</p>
            </div>
            <div>
              <p className="text-slate-500">Pelatih</p>
              <p className="font-semibold">
                {toProperCase(orderMeta.trainer_name || "-")}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Produk</p>
              <p className="font-semibold">{orderMeta.product_name || "-"}</p>
            </div>
            <div>
              <p className="text-slate-500">Siswa</p>
              <p className="font-semibold">
                {(orderMeta.students || [])
                  .map((student) => toProperCase(student.fullname))
                  .join(", ")}
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card title="Pertemuan Belum Diabsen">
        {pendingMeets.length ? (
          <div className="grid gap-2 max-h-60 overflow-y-auto pr-2">
            {pendingMeets.map((meet) => (
              <div
                key={meet.meet}
                className="flex items-center justify-between rounded border border-slate-200 px-3 py-2 text-sm"
              >
                <div className="font-semibold">Pertemuan {meet.meet}</div>
                <div className="text-slate-500">
                  {meet.day} • {meet.time}
                </div>
                <div className="text-slate-400">
                  {meet.schedule_date
                    ? DateTime.fromISO(meet.schedule_date).toFormat(
                        "dd LLL yyyy"
                      )
                    : "-"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Tidak ada pertemuan yang tersisa.
          </p>
        )}
      </Card>

      <Card title="Atur Frekuensi Baru">
        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Textinput
              label="Frekuensi per Minggu"
              type="number"
              min={1}
              value={frequency}
              onChange={(e) => handleFrequencyChange(e.target.value)}
            />
            <div className="md:col-span-2">
              <label className="form-label">Mulai Tanggal</label>
              <Flatpickr
                value={startDate}
                options={{
                  disableMobile: true,
                  allowInput: true,
                  altInput: true,
                  altFormat: "d F Y",
                }}
                className="form-control py-2"
                onChange={(dates) => {
                  if (dates && dates[0]) {
                    setStartDate(
                      DateTime.fromJSDate(dates[0]).toFormat("yyyy-MM-dd")
                    );
                  }
                }}
              />
            </div>
          </div>

          <div className="space-y-3">
            {slots.map((slot, index) => (
              <div
                key={`slot-${index}`}
                className="grid grid-cols-1 md:grid-cols-2 gap-3"
              >
                <Select
                  label={`Slot ${index + 1} - Hari`}
                  options={hari}
                  value={slot.day}
                  onChange={(e) => handleSlotChange(index, "day", e.target.value)}
                />
                <Select
                  label="Jam"
                  options={timeOptions}
                  value={slot.time}
                  onChange={(e) =>
                    handleSlotChange(index, "time", e.target.value)
                  }
                />
              </div>
            ))}
          </div>

          {trainerSlots.length > 0 && (
            <div>
              <p className="form-label">Slot Pelatih</p>
              <div className="flex flex-wrap gap-2">
                {trainerSlots.map((slot) => (
                  <span
                    key={`${slot.day}-${slot.time}-${slot.ts_id}`}
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      slot.is_avail
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    {slot.day} • {slot.time}
                  </span>
                ))}
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="rounded border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-600">
              {errorMessage}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="btn-light"
            >
              Batal
            </Button>
            <Button
              type="button"
              className="btn-dark"
              onClick={handleApply}
              disabled={submitting}
            >
              {submitting ? "Menyimpan..." : "Simpan Pengaturan"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FrequencyModal;
