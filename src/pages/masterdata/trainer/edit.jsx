import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import { AddTrainer, EditTrainer } from "@/axios/masterdata/trainer";
import Select from "@/components/ui/Select";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_green.css";
import { DateTime } from "luxon";
import Radio from "@/components/ui/Radio";

const Edit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isupdate = "false", data = {} } = location.state ?? {};
  const isUpdate = isupdate === "true";
  const [selectOption, setSelectOption] = useState("false");

  const FormValidationSchema = yup
    .object({
      fullname: yup.string().required("Nama Trainer is required"),
      nickname: yup.string().required("Panggilan is required"),
      gender: yup.string().required("Jenis Kelamin is required"),
      precentage_fee: yup.number().required("Bagi Hasil is required"),
    })
    .required();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: yupResolver(FormValidationSchema),
    mode: "all",
  });

  useEffect(() => {
    if (isUpdate) {
      if (data.dob) setValue("dob", DateTime.fromISO(data.dob).toJSDate());
      if (data.reg_date)
        setValue("reg_date", DateTime.fromISO(data.reg_date).toJSDate());
    }
  }, [isUpdate, data, setValue]);

  const gender = [
    { value: "L", label: "Laki-laki" },
    { value: "P", label: "Perempuan" },
  ];

  const options = [
    {
      value: "true",
      label: "Aktif",
    },
    {
      value: "false",
      label: "Tidak Aktif",
    },
  ];

  const handleCancel = () => {
    navigate(-1);
  };

  const handleAdd = (data) => {
    AddTrainer(data).then((res) => {
      if (res.status) {
        Swal.fire("Added!", "Your file has been added.", "success").then(() =>
          navigate(-1)
        );
      }
    });
  };

  const handleUpdate = (updatedData) => {
    EditTrainer(data.trainer_id, updatedData).then((res) => {
      if (res.status) {
        Swal.fire("Edited!", "Your file has been edited.", "success").then(() =>
          navigate(-1)
        );
      }
    });
  };

  const handleOption = (e) => {
    setSelectOption(e.target.value);
  };

  const onSubmit = (newData) => {
    const updatedData = {
      ...data,
      fullname: newData.fullname,
      dob: DateTime.fromJSDate(newData.dob).toFormat("yyyy-MM-dd"),
      gender: newData.gender,
      account_number: newData.account_number,
      precentage_fee: newData.precentage_fee,
      is_active: selectOption,
      nickname: newData.nickname,
      bank_account: newData.bank_account,
      reg_date: DateTime.fromJSDate(newData.reg_date).toFormat("yyyy-MM-dd"),
    };

    if (isUpdate) {
      handleUpdate(updatedData);
    } else {
      handleAdd(updatedData);
    }
  };

  return (
    <div>
      <Card title={`${isUpdate ? "Update" : "Add"} Trainer`}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Textinput
            name="fullname"
            label="Nama Trainer"
            type="text"
            placeholder="Masukan Nama Trainer"
            register={register}
            error={errors.fullname?.message}
            defaultValue={isUpdate ? data.fullname : ""}
          />
          <Textinput
            name="nickname"
            label="Panggilan"
            type="text"
            placeholder="Masukan Panggilan"
            register={register}
            error={errors.nickname?.message}
            defaultValue={isUpdate ? data.nickname : ""}
          />
          <Select
            name="gender"
            label="Jenis Kelamin"
            placeholder="Pilih gender"
            register={register}
            error={errors.gender?.message}
            defaultValue={isUpdate ? data.gender : ""}
            options={gender}
          />
          <div>
            <label className="form-label" htmlFor="dob">
              Tanggal Lahir
            </label>
            <Flatpickr
              defaultValue={
                isUpdate
                  ? DateTime.fromISO(data.dob).toFormat("yyyy-MM-dd")
                  : ""
              }
              name="dob"
              options={{
                dateFormat: "Y-m-d",
              }}
              className="form-control py-2"
              onChange={(date) => setValue("dob", date[0])}
            />
            {errors.dob && (
              <p className="error-message">{errors.dob.message}</p>
            )}
          </div>
          <div>
            <label className="form-label" htmlFor="reg_date">
              Tanggal Registrasi
            </label>
            <Flatpickr
              defaultValue={
                isUpdate
                  ? DateTime.fromISO(data.reg_date).toFormat("yyyy-MM-dd")
                  : ""
              }
              name="reg_date"
              options={{
                dateFormat: "Y-m-d",
              }}
              className="form-control py-2"
              onChange={(date) => setValue("reg_date", date[0])}
            />
            {errors.reg_date && (
              <p className="error-message">{errors.reg_date.message}</p>
            )}
          </div>
          <Textinput
            name="precentage_fee"
            label="Bagi Hasil"
            type="number"
            placeholder="Masukan bagi hasil"
            register={register}
            error={errors.precentage_fee?.message}
            defaultValue={isUpdate ? data.precentage_fee : ""}
          />
          <div className="flex flex-wrap space-xy-5">
            {options.map((option) => (
              <Radio
                label={option.label}
                name="is_active"
                value={option.value}
                checked={selectOption === option.value}
                onChange={handleOption}
              />
            ))}
          </div>
          <div className="ltr:text-right rtl:text-left space-x-3">
            <button
              type="button"
              className="btn text-center"
              onClick={handleCancel}
            >
              Batal
            </button>
            <button type="submit" className="btn btn-dark text-center">
              {isUpdate ? "Update" : "Add"} Trainer
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Edit;
