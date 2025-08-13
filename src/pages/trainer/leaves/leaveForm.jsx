import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import { createTrainerLeave } from "@/axios/cuti";
import Textarea from "@/components/ui/Textarea";
import Flatpickr from "react-flatpickr";
import { useSelector } from "react-redux";
import { useState } from "react";
import HomeBredCurbs from "@/pages/dashboard/HomeBredCurbs";
import { DateTime } from "luxon";
import { getOrderAll } from "@/axios/masterdata/order";
import Select from "@/components/ui/Select";
import { jam } from "@/constant/jadwal-default";
import Fileinput from "@/components/ui/Fileinput";

const LeaveForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const today = new Date();
  const FormValidationSchema = yup
    .object({
      name: yup.string().required("Nama Cabang is required"),
    })
    .required();
  const [files, setFiles] = React.useState([]);
  const { user_id, user_name, roles } = useSelector((state) => state.auth.data);
  const [picker3, setPicker3] = useState([today, today]);
  const [leaveRange, setLeaveRange] = useState(0);
  const [leaveDay, setLeaveDay] = useState([]);
  const [impactStudent, setImpactStudent] = useState([]);
  const treatment = [
    { value: "reschedule", label: "Reschedule" },
    { value: "inval", label: "Inval" },
  ];
  const [selectedTreatment, setSelectedTreatment] = useState("");
  const [openDays, setOpenDays] = useState([]);
  const {
    register,
    control,
    reset,
    formState: { errors },
    handleSubmit,
  } = useForm({
    resolver: yupResolver(FormValidationSchema),
    mode: "all",
  });

  const handleCancel = () => {
    navigate(-1);
  };

  const handleAdd = (data) => {
    createTrainerLeave(data).then((res) => {
      if (res.status)
        Swal.fire(
          "Added!",
          "Your file has been Added.",
          "success",
          navigate(-1)
        );
    });
  };

  useEffect(() => {
    const impactStudent = async () => {
      const isValidDate = (date) => date instanceof Date && !isNaN(date);

      const from = picker3[0];
      const to = picker3[1];

      if (isValidDate(from) && isValidDate(to)) {
        const start = DateTime.fromJSDate(from);
        const end = DateTime.fromJSDate(to);

        // Hitung jumlah hari (termasuk hari pertama dan terakhir)
        const diffDays = end.diff(start, "days").days + 1;

        // List hari dalam bahasa Indonesia
        const hariArray = [];
        let current = start;
        while (current <= end) {
          hariArray.push(current.setLocale("id").toFormat("cccc")); // cccc = nama hari lengkap
          current = current.plus({ days: 1 });
        }

        setLeaveRange(diffDays);
        setLeaveDay(hariArray);

        // Kalau tetap mau fetch data
        //   fetchData(start.toFormat("yyyy-MM-dd"), end.toFormat("yyyy-MM-dd"));
        let res = await getOrderAll({
          "search[trainer_id]": user_id,
          "search[is_finish]": false,
          "search[day]": hariArray.join(","),
        });

        setImpactStudent(res.data);
      }
    };

    impactStudent();
  }, [JSON.stringify(picker3)]);

  const onSubmit = (data) => {
    console.log(data);
    // handleAdd({
    //   trainer: user_id,
    //   start_date: data.,
    //   end_date: null,
    //   reason: data.reason,
    //   status: "pending",
    // });
  };

  const toggleDay = (index) => {
    setOpenDays((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

        {leaveRange > 0 && impactStudent.results && (
          <>
            <h4 className="text-lg font-semibold">B. Penanganan Siswa</h4>
            {leaveDay
              .filter((day) =>
                impactStudent.results.some((res) =>
                  res.detail.some(
                    (d) =>
                      d.day.trim().toLowerCase() === day.trim().toLowerCase()
                  )
                )
              )
              .map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleDay(dayIndex)}
                    className="w-full flex justify-between items-center p-4 bg-gray-100 hover:bg-gray-200 text-left"
                  >
                    <span className="font-medium">Hari {day}</span>
                    <svg
                      className={`w-5 h-5 transform transition-transform ${
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

                  {openDays.includes(dayIndex) && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      {impactStudent.results
                        .filter((f) => f.day === day)
                        .map((item, i) => (
                          <div key={`${item.order_id}-${i}`} className="">
                            {/* Paket */}
                            <Card
                              subtitle={
                                <div className="border-b last:border-b-0">
                                  <span className="block font-medium text-gray-700">
                                    Tanggal Order: {item.order_date}
                                  </span>
                                  <span className="block font-medium text-gray-700">
                                    Jam: {item.time}
                                  </span>
                                  <div className="mt-2 space-y-1">
                                    <p className="font-semibold">Siswa:</p>
                                    {item.students.map((student, idx) => (
                                      <div
                                        key={`${item.order_id}-student-${idx}`}
                                        className="pl-2 text-gray-600"
                                      >
                                        {idx + 1}. {student.student_fullname}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              }
                            >
                              <div className="flex flex-col gap-4">
                                <Select
                                  name="treatment"
                                  label="Penanganan"
                                  placeholder="Pilih Penanganan"
                                  register={register}
                                  error={errors.branch?.message}
                                  options={treatment}
                                  defaultValue=""
                                  onChange={(e) =>
                                    setSelectedTreatment(e.target.value)
                                  }
                                />

                                {selectedTreatment === "reschedule" && (
                                  <>
                                    {/* Tanggal Pengganti */}
                                    <div className="flex flex-col w-full">
                                      <label
                                        className="form-label font-medium text-gray-700"
                                        htmlFor="real_date"
                                      >
                                        Tanggal Pengganti
                                      </label>
                                      <Flatpickr
                                        id="real_date"
                                        name="real_date"
                                        defaultValue={DateTime.now().toFormat(
                                          "yyyy-MM-dd"
                                        )}
                                        options={{
                                          minDate: "today",
                                          disableMobile: true,
                                          allowInput: true,
                                          altInput: true,
                                          altFormat: "d F Y",
                                        }}
                                        register={register}
                                        className="form-control py-2 w-full"
                                      />
                                    </div>

                                    {/* Jam Pengganti */}
                                    <div className="flex flex-col w-full">
                                      <Select
                                        name="real_time"
                                        label="Jam Pengganti"
                                        placeholder="Pilih Jam"
                                        options={jam}
                                        className="form-select w-full"
                                        register={register}
                                      />
                                    </div>
                                    <Fileinput
                                      id={item.order_id}
                                      placeholder="Bukti Chat"
                                      multiple
                                      preview
                                      selectedFiles={files}
                                      onChange={(e) =>
                                        setFiles(Array.from(e.target.files))
                                      }
                                      onRemove={(index) =>
                                        setFiles((prev) =>
                                          prev.filter((_, i) => i !== index)
                                        )
                                      }
                                    />
                                  </>
                                )}

                                {selectedTreatment &&
                                  selectedTreatment !== "reschedule" && (
                                    <div className="text-gray-500 italic">
                                      Invalid treatment
                                    </div>
                                  )}
                              </div>
                            </Card>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
          </>
        )}
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
    </>
  );
};

export default LeaveForm;
