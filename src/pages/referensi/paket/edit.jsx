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
  const isUpdate = isupdate === "true";

  const FormValidationSchema = yup
    .object({
      name: yup.string().required("Nama Paket is required"),
      expired_days: yup.number().required("Kadaluwarsa is required").min(1),
      duration: yup.number().required("Durasi is required").min(1),
      min_age: yup.number().min(0),
      max_age: yup.number().min(0),
      max_student: yup.number().min(1).required("Max student is required"),
    })
    .required();

  const {
    register,
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
        Swal.fire("Added!", "Your file has been Added.", "success").then(() =>
          navigate(-1)
        );
    });
  };

  const handleUpdate = (updatedData) => {
    EditPaket(data.package_id, updatedData)
      .then(() => {
        Swal.fire("Edited!", "Your file has been Edited.", "success").then(() =>
          navigate(-1)
        );
      })
      .catch((error) => {
        Swal.fire("Failed!", `${error}`, "error");
      });
  };

  const onSubmit = (newData) => {
    const updatedData = {
      ...data,
      name: newData.name,
      expired_days: newData.expired_days,
      duration: newData.duration,
      min_age: newData.min_age ?? 0,
      max_age: newData.max_age ?? 0,
      max_student: newData.max_student ?? 0,
    };

    if (isUpdate) {
      handleUpdate(updatedData);
    } else {
      handleAdd(updatedData);
    }
  };

  return (
    <div>
      <Card title={`${isUpdate ? "Update" : "Add"} Paket`}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Textinput
            name="name"
            label="Nama Paket"
            type="text"
            placeholder="Masukan Nama Paket"
            register={register}
            error={errors.name}
            defaultValue={isUpdate ? data.name : ""}
          />
          <Textinput
            name="expired_days"
            label="Kadaluwarsa (hari)"
            type="number"
            placeholder="Masukan jumlah hari"
            register={register}
            error={errors.expired_days}
            defaultValue={isUpdate ? data.expired_days : ""}
          />
          <Textinput
            name="duration"
            label="Durasi (menit)"
            type="number"
            placeholder="Masukan jumlah menit"
            register={register}
            error={errors.duration}
            defaultValue={isUpdate ? data.duration : ""}
          />
          <Textinput
            name="min_age"
            label="Minimal Usia (tahun)"
            type="number"
            placeholder="Usia minimal siswa"
            register={register}
            error={errors.min_age}
            defaultValue={isUpdate ? data.min_age : ""}
          />
          <Textinput
            name="max_age"
            label="Maksimal Usia (tahun)"
            type="number"
            placeholder="Usia maksimal siswa"
            register={register}
            error={errors.max_age}
            defaultValue={isUpdate ? data.max_age : ""}
          />
          <Textinput
            name="max_student"
            label="Batas Siswa"
            type="number"
            placeholder="Jumlah Maksimal siswa"
            register={register}
            error={errors.max_student}
            defaultValue={isUpdate ? data.max_student : ""}
          />
          <div className="ltr:text-right rtl:text-left space-x-3">
            <button
              type="button"
              className="btn text-center"
              onClick={handleCancel}
            >
              batal
            </button>
            <button className="btn btn-dark text-center">
              {isUpdate ? "Update" : "Add"} Paket
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Edit;
