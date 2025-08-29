import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Swal from "sweetalert2";
import { DateTime } from "luxon";

import Card from "@/components/ui/Card";
import Textarea from "@/components/ui/Textarea";
import Flatpickr from "react-flatpickr";
import Select from "@/components/ui/Select";
import Fileinput from "@/components/ui/Fileinput";
import { jam } from "@/constant/jadwal-default";

import { createTrainerLeave, getImpactedStudent } from "@/axios/cuti";
import { getOrderAll } from "@/axios/masterdata/order";
import { axiosConfig } from "@/axios/config";

// =====================
// VALIDATION SCHEMA
// =====================
const schema = yup.object({
  reason: yup.string().required("Keterangan izin wajib diisi"),
});

const LeaveForm = () => {
  const navigate = useNavigate();
  const today = new Date();
  const { user_id } = useSelector((state) => state.auth.data);

  const [picker3, setPicker3] = useState([today, today]);
  const [leaveRange, setLeaveRange] = useState(0);
  const [leaveDay, setLeaveDay] = useState([]);
  const [impactStudent, setImpactStudent] = useState([]);
  const [openDays, setOpenDays] = useState([]);
  const [files, setFiles] = useState([]);

  const [leaveData, setLeaveData] = useState({
    leave: {
      trainer: user_id,
      start_date: today,
      end_date: today,
      reason: null,
      status: "pending",
    },
    leaveImpact: [],
  });

  const treatmentOptions = [
    { value: "reschedule", label: "Reschedule" },
    { value: "inval", label: "Inval" },
    { value: "normal", label: "Latihan biasa" },
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "all",
  });

  // Toggle collapse per hari
  const toggleDay = (index) => {
    setOpenDays((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // Update leaveImpact item tertentu
  const updateLeaveImpact = (index, key, value) => {
    setLeaveData((prev) => {
      const updated = [...prev.leaveImpact];
      updated[index] = { ...updated[index], [key]: value };
      return { ...prev, leaveImpact: updated };
    });
  };

  const handleCancel = () => navigate(-1);

  const onSubmit = (formData) => {
    const payload = {
      trainer: user_id,
      start_date: DateTime.fromJSDate(picker3[0]).toFormat("yyyy-MM-dd"),
      end_date: DateTime.fromJSDate(picker3[1]).toFormat("yyyy-MM-dd"),
      reason: formData.reason,
      status: "pending",
      replacements: leaveData.leaveImpact.filter(
        (li) =>
          li.replacement_type !==
          treatmentOptions.find((t) => t.value === "normal").value
      ),
    };

    createTrainerLeave(user_id, payload).then((res) => {
      if (res.status) {
        Swal.fire({
          title: "Berhasil",
          text: "Pengajuan izin berhasil dikirim",
          icon: "success",
          timer: 1000,
        }).then(navigate(-1));
      }
    });
  };

  // Fetch impact student tiap kali tanggal berubah
  useEffect(() => {
    const fetchImpactStudent = async () => {
      const [from, to] = picker3;
      if (
        !(
          from instanceof Date &&
          !isNaN(from) &&
          to instanceof Date &&
          !isNaN(to)
        )
      )
        return;

      const start = DateTime.fromJSDate(from);
      const end = DateTime.fromJSDate(to);
      const diffDays = end.diff(start, "days").days + 1;

      const hariArray = Array.from({ length: diffDays }, (_, i) =>
        start.plus({ days: i }).setLocale("id").toFormat("cccc")
      );

      setLeaveRange(diffDays);
      setLeaveDay(hariArray);

      try {
        const params = {
          trainer_id: "308eaea0-6c09-423c-bb35-a68a7029164c", //user_id,
          is_finish: "false",
          day: hariArray.join(","),
        };

        const res = await getImpactedStudent(params);

        if (res) {
          setLeaveData((prev) => ({ ...prev, leaveImpact: res }));
          setImpactStudent(res); // optional
        }
      } catch (err) {
        console.error("Error fetching impact student:", err);
      }
    };

    fetchImpactStudent();
  }, [picker3, user_id]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Bagian A */}
      <h4 className="text-lg font-semibold">A. Pengajuan Izin</h4>
      <Card>
        <div className="space-y-4">
          <div>
            <label className="form-label" htmlFor="range-picker">
              Tanggal pengajuan izin
            </label>
            <Flatpickr
              value={picker3}
              id="range-picker"
              className="w-full py-2 px-3 border border-gray-300 rounded-md bg-white"
              onChange={(date) => setPicker3(date)}
              options={{
                minDate: "today",
                dateFormat: "Y-m-d",
                mode: "range",
                altInput: true,
                altFormat: "d/m/Y",
              }}
            />
          </div>
          <Textarea
            name="reason"
            label="Keterangan Izin"
            register={register}
            error={errors.reason?.message}
          />
        </div>
      </Card>

      {/* Bagian B */}
      {leaveRange > 0 && impactStudent && (
        <>
          <h4 className="text-lg font-semibold">B. Penanganan Siswa</h4>
          {leaveDay.map((day, dayIndex) => {
            const dayItems = leaveData.leaveImpact.filter(
              (i) => i.day.toLowerCase() === day.toLowerCase()
            );
            if (!dayItems.length) return null;

            return (
              <div key={dayIndex} className="border rounded-lg overflow-hidden">
                {/* Toggle hari */}
                <button
                  type="button"
                  onClick={() => toggleDay(dayIndex)}
                  className="w-full flex justify-between items-center p-4 bg-gray-100 hover:bg-gray-200"
                >
                  <span className="font-medium">Hari {day}</span>
                  <svg
                    className={`w-5 h-5 transition-transform ${
                      openDays.includes(dayIndex) ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* List siswa per jam */}
                {openDays.includes(dayIndex) && (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {dayItems.map((item, i) => (
                      <Card
                        key={`${item.meet}-${i}`}
                        subtitle={
                          <>
                            <span className="block font-medium">
                              Jam: {item.new_time}
                            </span>
                            {item.students?.length > 0 && (
                              <div className="mt-2 space-y-1">
                                <p className="font-semibold">Siswa : </p>
                                {item.students.map((student, idx) => (
                                  <div key={idx} className="pl-2 text-gray-600">
                                    {idx + 1}. {student.fullname}
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        }
                      >
                        <div className="flex flex-col gap-4">
                          <Select
                            label="Penanganan"
                            options={treatmentOptions}
                            defaultValue={treatmentOptions[2].value}
                            value={item.replacement_type}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              const idx = leaveData.leaveImpact.findIndex(
                                (li) => li === item
                              );

                              updateLeaveImpact(
                                idx,
                                "replacement_type",
                                newValue
                              );

                              if (newValue === "inval") {
                                // kasih default langsung
                                if (item.available_trainer?.length > 0) {
                                  updateLeaveImpact(
                                    idx,
                                    "substitute_trainer",
                                    item.available_trainer[0].trainer_id
                                  );
                                }
                                if (item.missed_meet?.length > 0) {
                                  updateLeaveImpact(
                                    idx,
                                    "meet",
                                    item.missed_meet[0]
                                  );
                                }
                              }
                            }}
                          />
                          {(() => {
                            switch (item.replacement_type) {
                              case "reschedule":
                                return (
                                  <>
                                    <div>
                                      <label className="form-label">
                                        Tanggal Pengganti
                                      </label>
                                      <Flatpickr
                                        value={item.new_date}
                                        onChange={(date) =>
                                          updateLeaveImpact(
                                            leaveData.leaveImpact.findIndex(
                                              (li) => li === item
                                            ),
                                            "new_date",
                                            DateTime.fromJSDate(
                                              date[0]
                                            ).toFormat("yyyy-MM-dd")
                                          )
                                        }
                                        options={{
                                          minDate: "today",
                                          altInput: true,
                                          altFormat: "d F Y",
                                        }}
                                        className="form-control py-2 w-full"
                                      />
                                    </div>
                                    <Select
                                      label="Jam Pengganti"
                                      options={jam}
                                      value={item.new_time}
                                      onChange={(e) =>
                                        updateLeaveImpact(
                                          leaveData.leaveImpact.findIndex(
                                            (li) => li === item
                                          ),
                                          "new_time",
                                          e.target.value
                                        )
                                      }
                                    />
                                    {/* <Fileinput
                                placeholder="Bukti Chat"
                                multiple
                                preview
                                selectedFiles={files}
                                onChange={(e) =>
                                  setFiles(Array.from(e.target.files))
                                }
                                onRemove={(index) =>
                                  setFiles((prev) =>
                                    prev.filter((_, idx) => idx !== index)
                                  )
                                }
                              /> */}
                                  </>
                                );
                              case "inval":
                                return (
                                  <>
                                    <Select
                                      label="Pelatih Inval"
                                      options={item.available_trainer.map(
                                        (trainer) => ({
                                          value: trainer.trainer_id,
                                          label: trainer.nickname,
                                        })
                                      )}
                                      // defaultValue supaya langsung muncul kalau ada data
                                      defaultValue={
                                        item.substitute_trainer
                                          ? item.available_trainer
                                              .map((trainer) => ({
                                                value: trainer.trainer_id,
                                                label: trainer.nickname,
                                              }))
                                              .find(
                                                (opt) =>
                                                  opt.value ===
                                                  item.substitute_trainer
                                              )
                                          : null
                                      }
                                      onChange={(option) =>
                                        updateLeaveImpact(
                                          leaveData.leaveImpact.findIndex(
                                            (li) => li === item
                                          ),
                                          "substitute_trainer",
                                          option?.value || null
                                        )
                                      }
                                    />

                                    <Select
                                      label="Pertemuan Inval"
                                      options={item.missed_meet.map((m) => ({
                                        value: m,
                                        label: "Ke - " + m,
                                      }))}
                                      defaultValue={
                                        item.meet
                                          ? {
                                              value: item.meet,
                                              label: "Ke - " + item.meet,
                                            }
                                          : null
                                      }
                                      onChange={(option) =>
                                        updateLeaveImpact(
                                          leaveData.leaveImpact.findIndex(
                                            (li) => li === item
                                          ),
                                          "meet",
                                          option?.value || null
                                        )
                                      }
                                    />
                                  </>
                                );
                              case "normal":
                                return (
                                  <div>
                                    {/* UI default latihan biasa */}
                                    Tetap latihan seperti biasa.
                                  </div>
                                );
                              default:
                                return null;
                            }
                          })()}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* Tombol Aksi */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end mt-4">
        <button
          type="button"
          className="btn w-full sm:w-auto"
          onClick={handleCancel}
        >
          Batal
        </button>
        <button className="btn btn-dark w-full sm:w-auto">Ajukan Izin</button>
      </div>
    </form>
  );
};

export default LeaveForm;
