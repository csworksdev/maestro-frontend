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

const LeaveForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isupdate = "false", data = {} } = location.state ?? {};
  const isUpdate = isupdate == "true";
  const FormValidationSchema = yup
    .object({
      name: yup.string().required("Nama Cabang is required"),
    })
    .required();

  const { user_id, user_name, roles } = useSelector((state) => state.auth.data);
  const today = new Date();
  const [picker3, setPicker3] = useState([null, null]);
  const [leaveRange, setLeaveRange] = useState(0);
  const [leaveDay, setLeaveDay] = useState([]);
  const [impactStudent, setImpactStudent] = useState([]);

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

        console.log(`Total hari: ${diffDays}`);
        console.log(`Hari-hari:`, hariArray);

        // Kalau tetap mau fetch data
        //   fetchData(start.toFormat("yyyy-MM-dd"), end.toFormat("yyyy-MM-dd"));
        let res = await getOrderAll({
          "search[trainer_id]": user_id,
          "search[is_finish]": false,
          "search[day]": hariArray.join(","),
        });
        console.log(res.data);
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

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 ">
        <h4>A. Pengajuan Cuti</h4>
        <Card>
          <>
            <label className="form-label" htmlFor="range-picker">
              Tanggal pengajuan cuti
            </label>
            <Flatpickr
              value={picker3}
              id="range-picker"
              // readonly
              className="w-full py-2 px-3 border border-gray-300 rounded-md bg-white text-gray-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onChange={(date) => {
                setPicker3(date);
              }}
              options={{
                minDate: "today",
                dateFormat: "Y-m-d",
                mode: "range",
                // defaultDate: [new Date(), new Date()],
                altInput: true,
                altFormat: "d/m/Y",
              }}
            />
          </>
          <Textarea
            name="reason"
            label="Keterangan Cuti"
            // placeholder="Ketera"
            register={register}
            error={errors.reason?.message}
            defaultValue="-"
          />
          <div className="ltr:text-right rtl:text-left space-x-3 mt-4">
            <button
              type="button"
              className="btn text-center"
              onClick={() => handleCancel()}
            >
              batal
            </button>
            <button className="btn btn-dark  text-center">Ajukan Cuti</button>
          </div>
        </Card>
        {leaveRange > 0 && impactStudent.results && (
          <>
            <h4>B. Penanganan Siswa</h4>
            {leaveDay.map((element, index) => (
              <Card key={index} title={`Hari ${element}`}>
                <div className="grid grid-cols-5" key={element + index}>
                  <Card subtitle={"Paket"}>
                    {impactStudent.results.map((item, i) => {
                      return (
                        <>
                          <span key={item.order_id + i}>
                            Tanggal Order : {item.order_date}
                          </span>
                          <div key={item.students + i}>
                            Siswa :{" "}
                            {item.students.map((x, idx) => (
                              <>{idx + 1 + ". " + x.student_fullname}</>
                            ))}
                          </div>
                        </>
                      );
                    })}
                  </Card>
                </div>
              </Card>
            ))}
          </>
        )}
      </form>
    </>
  );
};

export default LeaveForm;
