import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import { AddSiswa, EditSiswa } from "@/axios/masterdata/siswa";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Flatpickr from "react-flatpickr";
import { DateTime } from "luxon";
import { getCabangAll } from "@/axios/referensi/cabang";
import { brands } from "@/constant/data";

const Edit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isupdate = "false", data = {} } = location.state ?? {};
  const isUpdate = isupdate === "true";
  const [branchOption, setBranchOption] = useState([]);

  const FormValidationSchema = yup
    .object({
      fullname: yup.string().required("Nama Lengkap is required"),
      gender: yup.string().required("Jenis Kelamin is required"),
      // phone: yup.string().required("Telephone is required").max(13),
      address: yup.string().required("Alamat is required"),
      pob: yup.string().required("Tempat Lahir is required"),
      dob: yup.date().required("Tanggal Lahir is required"),
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

  useEffect(() => {
    if (branchOption.length == 0) {
      const params = {
        page: 1,
        page_size: 50,
      };
      getCabangAll(params).then((res) => {
        const fetchedBranch = res.data.results;
        const mappedOption = fetchedBranch.map((item) => ({
          value: item.branch_id,
          label: item.name,
        }));
        setBranchOption(mappedOption);
      });
    }
    if (isUpdate && data.dob) {
      setValue("dob", data.dob);
    }
  }, [isUpdate, data, setValue]);

  const gender = [
    { value: "L", label: "Laki-laki" },
    { value: "P", label: "Perempuan" },
  ];

  const handleCancel = () => {
    navigate(-1);
  };

  const handleAdd = (data) => {
    AddSiswa(data).then((res) => {
      if (res.status) {
        Swal.fire("Added!", "Your file has been added.", "success").then(() =>
          navigate(-1)
        );
      }
    });
  };

  const handleUpdate = (updatedData) => {
    EditSiswa(data.student_id, updatedData).then((res) => {
      if (res.status) {
        Swal.fire("Edited!", "Your file has been edited.", "success").then(() =>
          navigate(-1)
        );
      }
    });
  };

  const onSubmit = (newData) => {
    const updatedData = {
      ...data,
      fullname: newData.fullname,
      nickname: newData.nickname,
      gender: newData.gender,
      parent: newData.parent,
      phone: newData.phone,
      address: newData.address,
      dob: isUpdate
        ? DateTime.fromJSDate(newData.dob).toFormat("yyyy-MM-dd")
        : data.dob,
      pob: newData.pob,
      branch: newData.branch,
    };

    if (isUpdate) {
      handleUpdate(updatedData);
    } else {
      handleAdd(updatedData);
    }
  };

  return (
    <div>
      <Card title={`${isUpdate ? "Update" : "Add"} Siswa`}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Textinput
            name="fullname"
            label="Nama Lengkap"
            type="text"
            placeholder="Masukan Nama Siswa"
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
          <Textinput
            name="parent"
            label="Nama orang tua"
            type="text"
            placeholder="Masukan Nama orang tua"
            register={register}
            error={errors.parent?.message}
            defaultValue={isUpdate ? data.parent : ""}
          />
          <Textinput
            name="phone"
            label="Telephone"
            type="tel"
            placeholder="Masukan Telephone"
            register={register}
            error={errors.phone?.message}
            defaultValue={isUpdate ? data.phone : ""}
            isMask={true}
            options={{
              blocks: [4, 4, 5],
              delimiter: " ",
              numericOnly: true,
            }}
          />
          <Textarea
            name="address"
            label="Alamat"
            placeholder="Masukan Alamat"
            register={register}
            error={errors.address?.message}
            defaultValue={isUpdate ? data.address : ""}
          />
          <Textinput
            name="pob"
            label="Tempat Lahir"
            type="text"
            placeholder="Masukan Tempat Lahir"
            register={register}
            error={errors.pob?.message}
            defaultValue={isUpdate ? data.pob : ""}
          />
          <div>
            <label className="form-label" htmlFor="dob">
              Tanggal Lahir
            </label>
            <Flatpickr
              defaultValue={isUpdate ? data.dob : ""}
              name="dob"
              options={{
                dateFormat: "Y-m-d",
                disableMobile: "true",
              }}
              className="form-control py-2"
              onChange={(date) => setValue("dob", date[0])}
            />
            {errors.dob && (
              <p className="error-message">{errors.dob.message}</p>
            )}
          </div>
          <Select
            name="branch"
            label="Cabang"
            placeholder="Pilih Cabang"
            register={register}
            error={errors.branch?.message}
            options={branchOption}
            defaultValue={isUpdate ? data.branch : ""}
          />
          <div className="ltr:text-right rtl:text-left space-x-3">
            <button
              type="button"
              className="btn text-center"
              onClick={handleCancel}
            >
              Batal
            </button>
            <button type="submit" className="btn btn-dark text-center">
              {isUpdate ? "Update" : "Add"} Siswa
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Edit;
