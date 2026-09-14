import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import {
  AddDepartment,
  EditDepartment,
} from "@/axios/userManagement/department";
import { getRolesAll } from "@/axios/userManagement/role";

const Edit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isupdate = "false", data = {} } = location.state ?? {};
  const isUpdate = isupdate === "true";
  const [roleOptions, setRoleOptions] = useState([]);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const response = await getRolesAll({ page: 1, page_size: 100 });
        const responseData = response?.data;
        const roles = Array.isArray(responseData?.results)
          ? responseData.results
          : Array.isArray(responseData)
            ? responseData
            : [];
        setRoleOptions(
          roles
            .filter((role) => role?.role_id ?? role?.id)
            .sort((firstRole, secondRole) =>
              (firstRole.role_name || "").localeCompare(
                secondRole.role_name || "",
              ),
            )
            .map((role) => ({
              value: role.role_id ?? role.id,
              label: role.role_name || role.name || `Role ${role.role_id ?? role.id}`,
            })),
        );
      } catch (error) {
        console.error("Error fetching roles", error);
      }
    };

    loadRoles();
  }, []);

  const FormValidationSchema = yup
    .object({
      name: yup.string().required("Department name is required"),
      description: yup.string().required("Description is required"),
      group: yup.string().required("Role is required"),
    })
    .required();

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm({
    resolver: yupResolver(FormValidationSchema),
    mode: "all",
    defaultValues: {
      name: data.name || "",
      description: data.description || "",
      group: "",
    },
  });

  const handleCancel = () => {
    navigate(-1);
  };

  const onSubmit = async (newData) => {
    const payload = {
      name: newData.name,
      description: newData.description,
      group: newData.group ? Number(newData.group) : newData.group,
    };

    try {
      const res = isUpdate
        ? await EditDepartment(data.department_id, payload)
        : await AddDepartment(payload);

      if (res?.status) {
        Swal.fire(
          "Berhasil!",
          `Department berhasil ${isUpdate ? "diperbarui" : "ditambahkan"}.`,
          "success",
        ).then(() => navigate(-1));
      }
    } catch (error) {
      Swal.fire("Error!", "Gagal menyimpan department.", "error");
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
      <Card title={isUpdate ? "Update Department" : "Add Department"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Textinput
            name="name"
            label="Department"
            id="name"
            type="text"
            placeholder="Enter department name"
            register={register}
            error={errors.name}
          />
          <Textarea
            name="description"
            label="Description"
            id="description"
            placeholder="Enter department description"
            register={register}
            error={errors.description}
          />
          <Select
            name="group"
            label="Role"
            placeholder="Pilih role"
            register={register}
            error={errors.group}
            options={roleOptions}
            defaultValue=""
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
              {isUpdate ? "Update" : "Add"} Department
            </button>
          </div>
        </form>
      </Card>
    </>
  );
};

export default Edit;
