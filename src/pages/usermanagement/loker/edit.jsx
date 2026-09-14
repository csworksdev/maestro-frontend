import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import {
  AddJob,
  EditJob,
  getJobBranchesAll,
  getJobDepartmentsAll,
} from "@/axios/career/job";

const dropdownParams = { page: 1, page_size: 200 };

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "closed", label: "Closed" },
];

const extractResults = (response) => {
  const data = response?.data ?? response;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data?.results)) return data.data.results;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
};

const toSlug = (value = "") =>
  String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getApiErrorMessage = (error) => {
  const responseData = error?.response?.data;

  if (!responseData) return "Gagal menyimpan loker.";
  if (typeof responseData === "string") return responseData;
  if (responseData.detail) return responseData.detail;

  const messages = Object.entries(responseData)
    .map(([field, value]) => {
      const message = Array.isArray(value)
        ? value.join(", ")
        : typeof value === "object" && value
          ? JSON.stringify(value)
          : String(value);

      return `${field}: ${message}`;
    })
    .filter(Boolean);

  return messages.length ? messages.join("\n") : "Gagal menyimpan loker.";
};

const FormValidationSchema = yup
  .object({
    title: yup.string().required("Judul loker wajib diisi"),
    department: yup.string().required("Department wajib dipilih"),
    branch: yup.string().required("Cabang wajib dipilih"),
    description: yup.string().required("Deskripsi wajib diisi"),
    requirements: yup.string().required("Requirements wajib diisi"),
    benefits: yup.string().required("Benefits wajib diisi"),
    status: yup.string().required("Status wajib dipilih"),
  })
  .required();

const Edit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isupdate = "false", data = {} } = location.state ?? {};
  const isUpdate = isupdate === "true";
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [isDropdownLoading, setIsDropdownLoading] = useState(false);

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm({
    resolver: yupResolver(FormValidationSchema),
    mode: "all",
    defaultValues: {
      title: data.title || "",
      department: data.department || "",
      branch: data.branch || "",
      description: data.description || "",
      requirements: data.requirements || "",
      benefits: data.benefits || "",
      status: data.status || "draft",
    },
  });

  const departmentOptions = useMemo(
    () =>
      departments.map((department) => ({
        value: department.department_id,
        label: department.name,
      })),
    [departments],
  );

  const branchOptions = useMemo(
    () =>
      branches.map((branch) => ({
        value: branch.branch_id,
        label: branch.name,
      })),
    [branches],
  );

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        setIsDropdownLoading(true);
        const [departmentResponse, branchResponse] = await Promise.all([
          getJobDepartmentsAll(dropdownParams),
          getJobBranchesAll(dropdownParams),
        ]);

        setDepartments(extractResults(departmentResponse));
        setBranches(extractResults(branchResponse));
      } catch (error) {
        console.error("Error fetching loker dropdowns", error);
        Swal.fire("Error!", "Gagal memuat data department atau cabang.", "error");
      } finally {
        setIsDropdownLoading(false);
      }
    };

    fetchDropdowns();
  }, []);

  const handleCancel = () => {
    navigate(-1);
  };

  const onSubmit = async (values) => {
    const title = values.title?.trim();
    const payload = {
      title,
      slug: toSlug(title) || data.slug,
      department: values.department,
      branch: values.branch,
      description: values.description?.trim(),
      requirements: values.requirements?.trim(),
      benefits: values.benefits?.trim(),
      status: values.status,
    };

    try {
      const res = isUpdate
        ? await EditJob(data.job_id, payload)
        : await AddJob(payload);

      if (res?.status) {
        Swal.fire(
          "Berhasil!",
          `Loker berhasil ${isUpdate ? "diperbarui" : "ditambahkan"}.`,
          "success",
        ).then(() => navigate(-1));
      }
    } catch (error) {
      console.error("Error saving loker", {
        payload,
        response: error?.response?.data,
      });
      Swal.fire("Error!", getApiErrorMessage(error), "error");
    }
  };

  return (
    <>
      <Button
        text="Kembali"
        onClick={(event) => {
          event.preventDefault();
          navigate(-1);
        }}
        type="button"
        className="bg-primary-500 text-white mb-4"
        icon="heroicons-outline:arrow-uturn-left"
      />
      <Card title={isUpdate ? "Update Loker" : "Add Loker"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Textinput
              name="title"
              label="Judul Loker"
              id="title"
              type="text"
              placeholder="Contoh: Swimming Coach Bandung"
              register={register}
              error={errors.title}
            />
            <Select
              name="status"
              label="Status"
              id="status"
              placeholder="Pilih status"
              register={register}
              error={errors.status}
              options={statusOptions}
              disabled={isDropdownLoading}
            />
            <Select
              name="department"
              label="Department"
              id="department"
              placeholder="Pilih department"
              register={register}
              error={errors.department}
              options={departmentOptions}
              disabled={isDropdownLoading}
            />
            <Select
              name="branch"
              label="Cabang"
              id="branch"
              placeholder="Pilih cabang"
              register={register}
              error={errors.branch}
              options={branchOptions}
              disabled={isDropdownLoading}
            />
          </div>
          <Textarea
            name="description"
            label="Deskripsi"
            id="description"
            placeholder="Masukkan deskripsi loker"
            register={register}
            error={errors.description}
            row={6}
          />
          <Textarea
            name="requirements"
            label="Requirements"
            id="requirements"
            placeholder="Masukkan requirements loker"
            register={register}
            error={errors.requirements}
            row={6}
          />
          <Textarea
            name="benefits"
            label="Benefits"
            id="benefits"
            placeholder="Masukkan benefit loker"
            register={register}
            error={errors.benefits}
            row={6}
          />
          <div className="ltr:text-right rtl:text-left space-x-3">
            <button
              type="button"
              className="btn text-center"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              className="btn btn-dark text-center"
              type="submit"
              disabled={isSubmitting}
            >
              {isUpdate ? "Update" : "Add"} Loker
            </button>
          </div>
        </form>
      </Card>
    </>
  );
};

export default Edit;
