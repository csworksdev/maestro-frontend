import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { getCabangAll } from "@/axios/referensi/cabang";
import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";

const Biodata = ({ isupdate = "false", data = {}, updatedData }) => {
  const navigate = useNavigate();
  const isUpdate = isupdate === "true";
  const [selectOption, setSelectOption] = useState(false);
  const [mobileOption, setMobileOption] = useState(false);
  const [branchOption, setBranchOption] = useState([]);
  const [loading, setLoading] = useState(true);

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
    const params = {
      page: 1,
      page_size: 50,
    };
    getCabangAll(params)
      .then((res) => {
        const fetchedBranch = res.data.results;
        const mappedOption = fetchedBranch.map((item) => ({
          value: item.branch_id,
          label: item.name,
        }));
        setBranchOption(mappedOption);

        if (isUpdate && data.branch) {
          setValue("branch", data.branch);
        }
      })
      .finally(() => {
        setLoading(false);
      });

    if (isUpdate) {
      if (data.dob) setValue("dob", DateTime.fromISO(data.dob).toJSDate());
      if (data.reg_date)
        setValue("reg_date", DateTime.fromISO(data.reg_date).toJSDate());
      setSelectOption(data.is_active);
      setMobileOption(data.is_fulltime);
    }
  }, [isUpdate, data, setValue]);

  const gender = [
    { value: "L", label: "Laki-laki" },
    { value: "P", label: "Perempuan" },
  ];

  const options = [
    {
      value: true,
      label: "Aktif",
    },
    {
      value: false,
      label: "Tidak Aktif",
    },
  ];

  const mobile = [
    {
      value: true,
      label: "Ya",
    },
    {
      value: false,
      label: "Tidak",
    },
  ];

  const handleCancel = () => {
    navigate(-1);
  };

  const handleAdd = (data) => {
    AddTrainer(data).then((res) => {
      if (res.status) {
        Swal.fire("Added!", "Your file has been added.", "success").then(() =>
          // navigate(-1)
          updatedData(data)
        );
      }
    });
  };

  const handleUpdate = (data) => {
    EditTrainer(data.trainer_id, data).then((res) => {
      if (res.status) {
        Swal.fire("Edited!", "Your file has been edited.", "success").then(() =>
          // navigate(-1)
          updatedData(data)
        );
      }
    });
  };

  const handleOption = (e) => {
    setSelectOption(e.target.value == "false" ? false : true);
  };
  const handleMobileOption = (e) => {
    setMobileOption(e.target.value == "false" ? false : true);
  };

  const onSubmit = (newData) => {
    const updatedData = {
      ...data,
      fullname: newData.fullname,
      dob: DateTime.fromJSDate(newData.dob).toFormat("yyyy-MM-dd"),
      gender: newData.gender,
      account_number: newData.account_number,
      precentage_fee: newData.precentage_fee,
      is_fulltime: mobileOption,
      is_active: selectOption,
      nickname: newData.nickname,
      bank_account: newData.bank_account,
      reg_date: DateTime.fromJSDate(newData.reg_date).toFormat("yyyy-MM-dd"),
      branch: newData.branch,
      nik: "-",
    };

    if (isUpdate) {
      handleUpdate(updatedData);
    } else {
      handleAdd(updatedData);
    }
  };

  if (loading) {
    return (
      <Card title="Biodata">
        <p>Loading...</p>
      </Card>
    );
  }

  return (
    <Card title="Biodata">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Textinput
          name="fullname"
          label="Nama Trainer"
          type="text"
          placeholder="Masukan Nama Trainer"
          register={register}
          error={errors.fullname?.message}
          defaultValue={isUpdate ? data.fullname : ""}
          disabled={loading}
        />
        <Textinput
          name="nickname"
          label="Panggilan"
          type="text"
          placeholder="Masukan Panggilan"
          register={register}
          error={errors.nickname?.message}
          defaultValue={isUpdate ? data.nickname : ""}
          disabled={loading}
        />
        <Select
          name="gender"
          label="Jenis Kelamin"
          placeholder="Pilih gender"
          register={register}
          error={errors.gender?.message}
          defaultValue={isUpdate ? data.gender : ""}
          options={gender}
          disabled={loading}
        />
        <div>
          <label className="form-label" htmlFor="dob">
            Tanggal Lahir
          </label>
          <Flatpickr
            defaultValue={
              isUpdate ? DateTime.fromISO(data.dob).toFormat("yyyy-MM-dd") : ""
            }
            name="dob"
            options={{
              disableMobile: true,
              allowInput: true,
              altInput: true,
              altFormat: "d F Y",
            }}
            className="form-control py-2"
            onChange={(date) => setValue("dob", date[0])}
            // disabled={loading}
            readOnly={false}
          />
          {errors.dob && <p className="error-message">{errors.dob.message}</p>}
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
              disableMobile: true,
              allowInput: true,
              altInput: true,
              altFormat: "d F Y",
            }}
            className="form-control py-2"
            onChange={(date) => setValue("reg_date", date[0])}
            // disabled={loading}
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
          disabled={loading}
        />

        <Select
          name="branch"
          label="Cabang"
          placeholder="Pilih Cabang"
          register={register}
          error={errors.branch?.message}
          options={branchOption}
          defaultValue={isUpdate ? data.branch : ""}
          disabled={loading}
        />
        <div className="flex flex-wrap space-xy-5">
          <label className="form-label" htmlFor="mobile">
            Mobile
          </label>
          {mobile.map((option) => (
            <Radio
              key={option.value}
              label={option.label}
              name="mobile"
              value={option.value}
              checked={mobileOption === option.value}
              onChange={handleMobileOption}
              disabled={loading}
            />
          ))}
        </div>
        <div className="flex flex-wrap space-xy-5">
          <label className="form-label" htmlFor="is_active">
            Status Pelatih
          </label>
          {options.map((option) => (
            <Radio
              key={option.value}
              label={option.label}
              name="is_active"
              value={option.value}
              checked={selectOption === option.value}
              onChange={handleOption}
              disabled={loading}
            />
          ))}
        </div>
        <div className="ltr:text-right rtl:text-left space-x-3">
          <button
            type="button"
            className="btn text-center"
            onClick={handleCancel}
            disabled={loading}
          >
            Batal
          </button>
          <button
            type="submit"
            className="btn btn-dark text-center"
            disabled={loading}
          >
            {isUpdate ? "Update" : "Add"} Trainer
          </button>
        </div>
      </form>
    </Card>
  );
};

export default Biodata;
