import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import {
  AddSpecialization,
  EditSpecialization,
} from "@/axios/referensi/specialization";
import Flatpickr from "react-flatpickr";
import { DateTime } from "luxon";
import Button from "@/components/ui/Button";

const Edit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isupdate = "false", data = {} } = location.state ?? {};
  const isUpdate = isupdate === "true";
  const FormValidationSchema = yup
    .object({
      name: yup.string().required("Nama Specialization is required"),
      alias: yup.string().required("Alias tidak boleh kosong"),
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
    AddSpecialization(data).then((res) => {
      if (res.status)
        Swal.fire("Added!", "Your file has been Added.", "success").then(() =>
          navigate(-1)
        );
    });
  };

  // edit event
  const handleUpdate = (updatedData) => {
    EditSpecialization(data.specialization_id, updatedData).then((res) => {
      if (res.status)
        Swal.fire("Edited!", "Your file has been Edited.", "success").then(() =>
          navigate(-1)
        );
    });
  };

  const onSubmit = (newData) => {
    const updatedData = {
      ...data,
      name: newData.name,
      alias: newData.alias,
    }; // Create the updated todo object

    if (isUpdate) {
      handleUpdate(updatedData);
    } else {
      handleAdd(updatedData);
    }
  };

  return (
    <>
      <Button
        text="Kembali"
        onClick={(e) => {
          e.preventDefault();
          navigate(-1);
        }}
        type="button"
        className="bg-primary-500 text-white mb-4"
        icon="heroicons-outline:arrow-uturn-left"
      />
      <Card title={`${isUpdate ? "Update" : "Add"} Specialization`}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 ">
          <Textinput
            name="name"
            label="Spesialisasi"
            type="text"
            placeholder="Masukan Nama Spesialisasi"
            register={register}
            error={errors.name}
            defaultValue={isUpdate ? data.name : ""}
          />
          <Textinput
            name="alias"
            label="Alias"
            type="text"
            placeholder="Masukan singkatan, maks. 3 huruf, contoh : ABK"
            register={register}
            error={errors.alias}
            defaultValue={isUpdate ? data.alias : ""}
          />
          <div className="ltr:text-right rtl:text-left  space-x-3">
            <button
              type="button"
              className="btn text-center"
              onClick={() => handleCancel()}
            >
              batal
            </button>
            <button className="btn btn-dark  text-center">
              {isUpdate ? "Update" : "Add"} Specialization
            </button>
          </div>
        </form>
      </Card>
    </>
  );
};

export default Edit;
