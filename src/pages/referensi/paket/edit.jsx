import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import { AddPaket, EditPaket } from "@/axios/referensi/paket";

const Edit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isupdate = "false", data = {} } = location.state ?? {};
  const isUpdate = isupdate == "true";
  const FormValidationSchema = yup
    .object({
      name: yup.string().required("Nama Paket is required"),
    })
    .required();

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
    AddPaket(data).then((res) => {
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
    console.log(updatedData);
    EditPaket(data.package_id, updatedData).then((res) => {
      if (res.status)
        Swal.fire(
          "Edited!",
          "Your file has been Edited.",
          "success",
          navigate(-1)
        );
    });
  };

  const onSubmit = (data) => {
    const updatedData = {
      ...data,
      name: data.name,
      expired_days: data.expired_days,
      duration: data.duration,
      min_age: data.min_age ?? 0,
      max_age: data.max_age ?? 0,
      max_student: data.max_student ?? 0,
    }; // Create the updated todo object

    if (isUpdate) {
      handleUpdate(updatedData);
    } else {
      handleAdd(updatedData);
    }
  };

  return (
    <div>
      <Card title={isUpdate ? "Update" : "Add" + " Paket"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 ">
          <Textinput
            name="name"
            label="Nama Paket"
            type="text"
            placeholder="Masukan Nama Paket"
            register={register}
            error={errors.title}
            defaultValue={isUpdate ? data.name : ""}
          />
          <Textinput
            name="expired_days"
            label="Kadaluwarsa (hari)"
            type="number"
            placeholder="Masukan jumlah hari"
            register={register}
            error={errors.title}
            options={{ numeral: true, numeralPositiveOnly: true }}
            defaultValue={isUpdate ? data.expired_days : ""}
          />
          <Textinput
            name="duration"
            label="Durasi"
            type="number"
            placeholder="Masukan jumlah menit"
            register={register}
            error={errors.title}
            options={{ numeral: true, numeralPositiveOnly: true }}
            defaultValue={isUpdate ? data.duration : ""}
          />
          <Textinput
            name="min_age"
            label="Minimal usia"
            type="number"
            // placeholder="Masukan minimal s"
            register={register}
            error={errors.title}
            options={{ numeral: true, numeralPositiveOnly: true }}
            defaultValue={isUpdate ? data.min_age : ""}
          />
          <Textinput
            name="max_age"
            label="Maksimal Usia"
            type="number"
            // placeholder="Masukan Nama Paket"
            register={register}
            error={errors.title}
            options={{ numeral: true, numeralPositiveOnly: true }}
            defaultValue={isUpdate ? data.max_age : ""}
          />
          <Textinput
            name="max_student"
            label="Batas Siswa"
            type="text"
            // placeholder="Masukan Nama Paket"
            register={register}
            error={errors.title}
            options={{ numeral: true, numeralPositiveOnly: true }}
            defaultValue={isUpdate ? data.max_student : ""}
          />
          <div className="ltr:text-right rtl:text-left  space-x-3">
            <button className="btn text-center" onClick={() => handleCancel()}>
              batal
            </button>
            <button className="btn btn-dark  text-center">
              {isUpdate ? "Update" : "Add"} Paket
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Edit;
