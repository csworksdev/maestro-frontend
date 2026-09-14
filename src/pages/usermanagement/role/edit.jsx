import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import { AddRoles, EditRoles } from "@/axios/userManagement/role";

const Edit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isupdate = "false", data = {} } = location.state ?? {};
  const isUpdate = isupdate === "true";

  const FormValidationSchema = yup
    .object({
      role_name: yup.string().required("Role name is required"),
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
    AddRoles(data)
      .then((res) => {
        if (res) {
          Swal.fire("Added!", "Role has been added.", "success").then(() =>
            navigate(-1)
          );
        }
      })
      .catch((error) => {
        Swal.fire("Error!", "There was an error adding the role.", "error");
      });
  };

  const handleUpdate = (updatedData) => {
    EditRoles(data.role_id, updatedData)
      .then((res) => {
        if (res) {
          Swal.fire("Edited!", "Role has been edited.", "success").then(() =>
            navigate(-1)
          );
        }
      })
      .catch((error) => {
        Swal.fire("Error!", "There was an error editing the role.", "error");
      });
  };

  const onSubmit = (newdata) => {
    const updatedData = {
      ...data,
      role_name: newdata.role_name,
    };
    if (isUpdate) {
      handleUpdate(updatedData);
    } else {
      handleAdd(updatedData);
    }
  };

  return (
    <div>
      <Card title={isUpdate ? "Update Role" : "Add Role"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Textinput
            name="role_name"
            label="Role"
            id="role_name"
            type="text"
            placeholder="Enter Name"
            register={register}
            error={errors.role_name}
            defaultValue={isUpdate ? data.role_name : ""}
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
              {isUpdate ? "Update" : "Add"} Role
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Edit;
