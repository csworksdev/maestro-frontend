import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import { AddPeriodisasi, EditPeriodisasi } from "@/axios/referensi/periodisasi";
import Flatpickr from "react-flatpickr";
import { DateTime } from "luxon";

const Edit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isupdate = "false", data = {} } = location.state ?? {};
  const isUpdate = isupdate == "true";
  const FormValidationSchema = yup
    .object({
      name: yup.string().required("Nama Periodisasi is required"),
    })
    .required();

  const {
    register,
    control,
    reset,
    formState: { errors },
    handleSubmit,
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(FormValidationSchema),
    mode: "all",
  });

  const handleCancel = () => {
    navigate(-1);
  };

  const handleAdd = (data) => {
    AddPeriodisasi(data).then((res) => {
      if (res.status)
        Swal.fire(
          "Added!",
          "Your file has been Added.",
          "success",
          navigate(-1)
        );
    });
  };

  // edit event
  const handleUpdate = (updatedData) => {
    EditPeriodisasi(data.periode_id, updatedData).then((res) => {
      if (res.status)
        Swal.fire(
          "Edited!",
          "Your file has been Edited.",
          "success",
          navigate(-1)
        );
    });
  };

  const onSubmit = (newData) => {
    console.log(data);
    const updatedData = {
      ...data,
      name: newData.name,
      month: newData.month,
      start_date: isUpdate
        ? data.start_date
        : DateTime.fromJSDate(newData.start_date).toFormat("yyyy-MM-dd"),
      end_date: isUpdate
        ? data.end_date
        : DateTime.fromJSDate(newData.end_date).toFormat("yyyy-MM-dd"),
    }; // Create the updated todo object

    if (isUpdate) {
      handleUpdate(updatedData);
    } else {
      handleAdd(updatedData);
    }
  };

  return (
    <div>
      <Card title={isUpdate ? "Update" : "Add" + " Periodisasi"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 ">
          <Textinput
            name="name"
            label="Periode"
            type="text"
            placeholder="Masukan Nama Periode"
            register={register}
            error={errors.title}
            defaultValue={isUpdate ? data.name : ""}
          />
          <div className="grid grid-cols-3 gap-5">
            <Textinput
              name="month"
              label="Bulan"
              type="month"
              placeholder="Masukan jumlah hari"
              register={register}
              error={errors.title}
              // options={{ numeral: true, numeralPositiveOnly: true }}
              defaultValue={isUpdate ? data.month : ""}
            />
            <div>
              <label className="form-label" htmlFor="start_date">
                Tanggal Mulai
              </label>
              <Flatpickr
                defaultValue={isUpdate ? data.start_date : ""}
                name="start_date"
                options={{
                  dateFormat: "Y-m-d",
                  minDate: data.end_date - 30,
                }}
                className="py-2"
                onChange={(date) => setValue("start_date", date[0])}
              />
              {errors.start_date && (
                <p className="error-message">{errors.start_date.message}</p>
              )}
            </div>
            <div>
              <label className="form-label" htmlFor="end_date">
                Tanggal Selesai
              </label>
              <Flatpickr
                defaultValue={isUpdate ? data.end_date : ""}
                name="end_date"
                options={{
                  dateFormat: "Y-m-d",
                  minDate: data.start_date,
                }}
                className="py-2"
                onChange={(date) => setValue("end_date", date[0])}
              />
              {errors.end_date && (
                <p className="error-message">{errors.end_date.message}</p>
              )}
            </div>
          </div>
          <div className="ltr:text-right rtl:text-left  space-x-3">
            <button className="btn text-center" onClick={() => handleCancel()}>
              batal
            </button>
            <button className="btn btn-dark  text-center">
              {isUpdate ? "Update" : "Add"} Periodisasi
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Edit;
