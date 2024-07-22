import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import Checkbox from "@/components/ui/Checkbox"; // Assuming there's a Checkbox component for handling boolean fields
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
      route: yup.string().required("Route is required"),
      icon: yup.string(),
      is_header: yup.boolean(),
      is_open: yup.boolean(),
      is_hide: yup.boolean(),
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

  const onSubmit = (newData) => {
    const updatedData = {
      ...data,
      menu_name: newData.menu_name,
      route: newData.route,
      icon: newData.icon,
      is_header: newData.is_header,
      is_open: newData.is_open,
      is_hide: newData.is_hide,
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
            label="Menu Name"
            id="menu_name"
            type="text"
            placeholder="Enter Menu Name"
            register={register}
            error={errors.menu_name}
            defaultValue={isUpdate ? data.menu_name : ""}
          />
          <Textinput
            name="route"
            label="Route"
            id="route"
            type="text"
            placeholder="Enter Route"
            register={register}
            error={errors.route}
            defaultValue={isUpdate ? data.route : ""}
          />
          <Textinput
            name="icon"
            label="Icon"
            id="icon"
            type="text"
            placeholder="Enter Icon"
            register={register}
            error={errors.icon}
            defaultValue={isUpdate ? data.icon : ""}
          />
          <Checkbox
            name="is_header"
            label="Is Header"
            id="is_header"
            register={register}
            error={errors.is_header}
            defaultChecked={isUpdate ? data.is_header : false}
          />
          <Checkbox
            name="is_open"
            label="Is Open"
            id="is_open"
            register={register}
            error={errors.is_open}
            defaultChecked={isUpdate ? data.is_open : false}
          />
          <Checkbox
            name="is_hide"
            label="Is Hide"
            id="is_hide"
            register={register}
            error={errors.is_hide}
            defaultChecked={isUpdate ? data.is_hide : false}
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
