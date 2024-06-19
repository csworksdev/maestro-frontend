import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import { AddCabang, EditCabang } from "@/axios/referensi/cabang";

const Edit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isupdate = "false", data = {} } = location.state ?? {};
  const isUpdate = isupdate == "true";
  const FormValidationSchema = yup
    .object({
      name: yup.string().required("Nama Cabang is required"),
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

  const handleAdd = (data) => {
    AddCabang(data).then((res) => {
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
    EditCabang(data.branch_id, updatedData).then((res) => {
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
    const updatedEvent = {
      ...data,
      name: data.name,
    }; // Create the updated todo object

    if (isUpdate) {
      handleUpdate(updatedEvent);
    } else {
      handleAdd({
        name: data.name,
      });
    }
  };

  return (
    <div>
      <Card title={isUpdate ? "Update" : "Add" + " Cabang"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 ">
          <Textinput
            name="name"
            label="Nama Cabang"
            id={name}
            type="text"
            placeholder="Masukan Nama Cabang"
            register={register}
            error={errors.title}
            defaultValue={isUpdate ? data.name : ""}
          />
          <div className="ltr:text-right rtl:text-left  space-x-3">
            <button className="btn btn-dark  text-center">
              {isUpdate ? "Update" : "Add"} Cabang
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Edit;
