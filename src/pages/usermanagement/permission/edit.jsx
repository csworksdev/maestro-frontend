import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import {
  AddPermissions,
  EditPermissions,
} from "@/axios/userManagement/permission";

const Edit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isupdate = "false", data = {} } = location.state ?? {};
  const isUpdate = isupdate === "true";

  const FormValidationSchema = yup
    .object({
      permission_name: yup.string().required("Permission name is required"),
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
    AddPermissions(data)
      .then((res) => {
        if (res) {
          Swal.fire("Added!", "Permission has been added.", "success").then(
            () => navigate(-1)
          );
        }
      })
      .catch((error) => {
        Swal.fire(
          "Error!",
          "There was an error adding the permission.",
          "error"
        );
      });
  };

  const handleUpdate = (updatedData) => {
    EditPermissions(data.permission_id, updatedData)
      .then((res) => {
        if (res) {
          Swal.fire("Edited!", "Permission has been edited.", "success").then(
            () => navigate(-1)
          );
        }
      })
      .catch((error) => {
        Swal.fire(
          "Error!",
          "There was an error editing the permission.",
          "error"
        );
      });
  };

  const onSubmit = (newdata) => {
    const updatedData = {
      ...data,
      permission_name: newdata.permission_name,
    };
    if (isUpdate) {
      handleUpdate(updatedData);
    } else {
      handleAdd(updatedData);
    }
  };

  return (
    <div>
      <Card title={isUpdate ? "Update Permission" : "Add Permission"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Textinput
            name="permission_name"
            label="Permission"
            id="permission_name"
            type="text"
            placeholder="Enter permission name"
            register={register}
            error={errors.permission_name}
            defaultValue={isUpdate ? data.permission_name : ""}
          />
          <div className="ltr:text-right rtl:text-left space-x-3">
            <button
              type="button"
              className="btn text-center"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button className="btn btn-dark text-center" type="submit">
              {isUpdate ? "Update" : "Add"} Permission
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Edit;
