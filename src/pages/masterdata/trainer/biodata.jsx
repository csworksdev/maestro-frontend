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
import Button from "@/components/ui/Button";

const contractTypeOptions = [
  { value: "fulltime", label: "Fulltime" },
  { value: "hybrid", label: "Hybrid" },
  { value: "freelance", label: "Freelance" },
];

const normalizeContractType = (value, fallback = "freelance") => {
  const normalized = String(value ?? fallback ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "");

  if (normalized === "fulltime") return "fulltime";
  if (normalized === "hybrid") return "hybrid";
  if (normalized === "freelance") return "freelance";
  if (normalized === "true") return "fulltime";
  if (normalized === "false") return "freelance";

  return fallback === true
    ? "fulltime"
    : fallback === false
      ? "freelance"
      : "hybrid";
};

export const createTrainerNickname = (fullname = "") => {
  const firstName = String(fullname).trim().split(/\s+/)[0];

  return firstName ? `C. ${firstName.toUpperCase()}` : "";
};

export const getTrainerSubmitError = (error) => {
  const responseData = error?.response?.data;
  const candidate =
    responseData?.message ??
    responseData?.detail ??
    responseData?.error ??
    responseData;

  if (typeof candidate === "string" && candidate.trim()) {
    return candidate;
  }

  if (candidate && typeof candidate === "object") {
    const fieldMessages = Object.entries(candidate).flatMap(([field, value]) => {
      const messages = Array.isArray(value) ? value : [value];
      return messages
        .filter((message) => typeof message === "string" && message.trim())
        .map((message) => `${field}: ${message}`);
    });
    if (fieldMessages.length) return fieldMessages.join("\n");
  }

  return error?.message || "Terjadi kesalahan. Silakan coba kembali.";
};

const Biodata = ({ isupdate = "false", data = {}, updatedData }) => {
  const navigate = useNavigate();
  const isUpdate = isupdate === "true";
  const [selectOption, setSelectOption] = useState(false);
  const [mobileOption, setMobileOption] = useState(false);
  const [contractTypeOption, setContractTypeOption] = useState("freelance");
  const [branchOption, setBranchOption] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const FormValidationSchema = yup
    .object({
      fullname: yup.string().required("Nama Trainer is required"),
      nickname: yup.string().required("Panggilan is required"),
      email: yup
        .string()
        .trim()
        .email("Format email tidak valid")
        .required("Email is required"),
      gender: yup.string().required("Jenis Kelamin is required"),
      precentage_fee: yup.number().required("Bagi Hasil is required"),
    })
    .required();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(FormValidationSchema),
    mode: "all",
  });

  const fullname = watch("fullname", isUpdate ? data.fullname ?? "" : "");
  const nickname = watch("nickname", isUpdate ? data.nickname ?? "" : "");

  useEffect(() => {
    setValue("nickname", createTrainerNickname(fullname), {
      shouldValidate: Boolean(fullname),
    });
  }, [fullname, setValue]);

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
      setMobileOption(
        typeof data.is_fulltime === "string"
          ? normalizeContractType(data.is_fulltime) === "fulltime"
          : Boolean(data.is_fulltime),
      );
      setContractTypeOption(
        normalizeContractType(
          data.contract_type_display ?? data.contract_type,
          data.is_fulltime,
        ),
      );
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

  const handleAdd = async (data) => {
    const res = await AddTrainer(data);
    const isSuccess =
      res?.status === true || (res?.status >= 200 && res?.status < 300);
    if (!isSuccess) {
      throw new Error("Trainer gagal ditambahkan.");
    }
    await Swal.fire("Berhasil!", "Trainer berhasil ditambahkan.", "success");
    updatedData?.(data);
  };

  const handleUpdate = async (data) => {
    const res = await EditTrainer(data.trainer_id, data);
    const isSuccess =
      res?.status === true || (res?.status >= 200 && res?.status < 300);
    if (!isSuccess) {
      throw new Error("Trainer gagal diperbarui.");
    }
    await Swal.fire("Berhasil!", "Data trainer berhasil diperbarui.", "success");
    updatedData?.(data);
  };

  const handleOption = (e) => {
    setSelectOption(e.target.value !== "false");
  };
  const handleMobileOption = (e) => {
    setMobileOption(e.target.value !== "false");
  };
  const handleContractTypeOption = (e) => {
    setContractTypeOption(e.target.value);
  };

  const onSubmit = async (newData) => {
    setSubmitError("");
    setIsSubmitting(true);
    const contractType = normalizeContractType(
      contractTypeOption,
      mobileOption,
    );
    const updatedData = {
      ...data,
      fullname: newData.fullname,
      email: newData.email.trim(),
      dob: newData.dob
        ? DateTime.fromJSDate(newData.dob).toFormat("yyyy-MM-dd")
        : "",
      gender: newData.gender,
      account_number: newData.account_number,
      phone: newData.phone,
      precentage_fee: newData.precentage_fee,
      is_fulltime: contractType,
      contract_type: contractType,
      contract_type_display: contractType,
      is_active: selectOption,
      nickname: newData.nickname,
      bank_account: newData.bank_account,
      reg_date: newData.reg_date
        ? DateTime.fromJSDate(newData.reg_date).toFormat("yyyy-MM-dd")
        : "",
      branch: newData.branch,
      nik: "-",
    };

    try {
      if (isUpdate) {
        await handleUpdate(updatedData);
      } else {
        await handleAdd(updatedData);
      }
    } catch (error) {
      const message = getTrainerSubmitError(error);
      setSubmitError(message);
      await Swal.fire("Gagal!", message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalid = () => {
    setSubmitError("Periksa kembali data yang wajib diisi atau belum valid.");
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
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
        <Textinput
          name="fullname"
          label="Nama Trainer"
          type="text"
          placeholder="Masukan Nama Trainer"
          register={register}
          error={errors.fullname?.message}
          showValidationIcon={false}
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
          value={nickname}
          disabled={loading}
        />
        <Textinput
          name="email"
          label="Email"
          type="email"
          placeholder="Masukan email pelatih"
          register={register}
          error={errors.email?.message}
          defaultValue={isUpdate ? data.email ?? "" : ""}
          disabled={loading}
        />
        <Textinput
          name="phone"
          label="Phone"
          type="text"
          placeholder="Masukan nomor telepon"
          register={register}
          error={errors.phone?.message}
          defaultValue={isUpdate ? data.phone : ""}
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
        <div className="flex flex-wrap space-xy-5">
          <label className="form-label" htmlFor="contract_type">
            Tipe Kontrak
          </label>
          {contractTypeOptions.map((option) => (
            <Radio
              key={option.value}
              label={option.label}
              name="contract_type"
              value={option.value}
              checked={contractTypeOption === option.value}
              onChange={handleContractTypeOption}
              disabled={loading}
            />
          ))}
        </div>
        {submitError && (
          <div
            role="alert"
            aria-live="assertive"
            className="whitespace-pre-line rounded-md bg-danger-500 bg-opacity-10 px-4 py-3 text-sm text-danger-500"
          >
            {submitError}
          </div>
        )}
        <div className="ltr:text-right rtl:text-left space-x-3">
          <button
            type="button"
            className="btn text-center"
            onClick={handleCancel}
            disabled={loading || isSubmitting}
          >
            Batal
          </button>
          <Button
            type="submit"
            text={`${isUpdate ? "Update" : "Add"} Trainer`}
            isLoading={isSubmitting}
            disabled={loading || isSubmitting}
            className="btn-dark text-white"
            loadingClass="text-white"
          />
        </div>
      </form>
    </Card>
  );
};

export default Biodata;
