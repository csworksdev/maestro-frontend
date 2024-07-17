import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import { AddMenus, EditMenus } from "@/axios/userManagement/menu";

const Edit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isupdate = "false", data = {} } = location.state ?? {};
  const isUpdate = isupdate === "true";

  const FormValidationSchema = yup
    .object({
      menu_name: yup.string().required("Menu name is required"),
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
    AddMenus(data)
      .then((res) => {
        if (res) {
          Swal.fire("Added!", "Menu has been added.", "success").then(() =>
            navigate(-1)
          );
        }
      })
      .catch((error) => {
        Swal.fire("Error!", "There was an error adding the menu.", "error");
      });
  };

  const handleUpdate = (updatedData) => {
    EditMenus(data.menu_id, updatedData)
      .then((res) => {
        if (res) {
          Swal.fire("Edited!", "Menu has been edited.", "success").then(() =>
            navigate(-1)
          );
        }
      })
      .catch((error) => {
        Swal.fire("Error!", "There was an error editing the menu.", "error");
      });
  };

  const onSubmit = (newdata) => {
    const updatedData = {
      ...data,
      menu_name: newdata.menu_name,
    };
    if (isUpdate) {
      handleUpdate(updatedData);
    } else {
      handleAdd(updatedData);
    }
  };

  return (
    <div>
      <Card title={isUpdate ? "Update Menu" : "Add Menu"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Textinput
            name="menu_name"
            label="Menu"
            id="menu_name"
            type="text"
            placeholder="Enter Name"
            register={register}
            error={errors.menu_name}
            defaultValue={isUpdate ? data.menu_name : ""}
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
              {isUpdate ? "Update" : "Add"} Menu
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Edit;
