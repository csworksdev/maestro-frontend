import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import { AddUsers, EditUsers } from "@/axios/userManagement/user";
import Select from "@/components/ui/Select";
import { getRolesAll } from "@/axios/userManagement/role";
import Loading from "@/components/Loading";

const Edit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [roleOption, setRoleOption] = useState([]);
  const { isupdate = "false", data = {} } = location.state ?? {};
  const isUpdate = isupdate === "true";
  const [loading, setLoading] = useState(true);

  const FormValidationSchema = yup
    .object({
      username: yup.string().required("Username is required"),
      email: yup
        .string()
        .email("Invalid email format")
        .required("Email is required"),
    })
    .required();

  const {
    register,
    control,
    reset,
    formState: { errors },
    handleSubmit,
  } = useForm({
    resolver: yupResolver(FormValidationSchema),
    mode: "all",
  });

  const loadReference = () => {
    try {
      getRolesAll().then((res) => {
        const fetched = res.data.results;
        const mappedOption = fetched
          .sort(function (a, b) {
            return a.role_name.localeCompare(b.role_name);
          })
          .map((item) => ({
            value: item.role_id,
            label: item.role_name,
          }));
        setRoleOption(mappedOption);
      });
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReference();
  }, []);

  const handleCancel = () => {
    navigate(-1);
  };

  const handleAdd = (data) => {
    AddUsers(data)
      .then((res) => {
        if (res) {
          Swal.fire("Added!", "User has been added.", "success").then(() =>
            navigate(-1)
          );
        }
      })
      .catch((error) => {
        Swal.fire("Error!", "There was an error adding the user.", "error");
      });
  };

  const handleUpdate = (updatedData) => {
    EditUsers(data.user_id, updatedData)
      .then((res) => {
        if (res) {
          Swal.fire("Edited!", "User has been edited.", "success").then(() =>
            navigate(-1)
          );
        }
      })
      .catch((error) => {
        Swal.fire("Error!", "There was an error editing the user.", "error");
      });
  };

  const onSubmit = (newdata) => {
    const updatedData = {
      ...data,
      username: newdata.username,
      email: newdata.email,
      password: newdata.password,
      role: newdata.role,
    };
    if (isUpdate) {
      handleUpdate(updatedData);
    } else {
      handleAdd(updatedData);
    }
  };

  if (loading) {
    return <Loading />; // Show a loading spinner while data is being fetched
  }

  return (
    <>
      <Card title={isUpdate ? "Update User" : "Add User"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Textinput
            name="username"
            label="Username"
            id="username"
            type="text"
            placeholder="Enter Username"
            register={register}
            error={errors.username}
            defaultValue={isUpdate ? data.username : ""}
          />
          <Textinput
            name="email"
            label="Email"
            id="email"
            type="email"
            placeholder="Enter Email"
            register={register}
            error={errors.email}
            defaultValue={isUpdate ? data.email : ""}
          />
          <Textinput
            name="password"
            label="Password"
            id="password"
            type="password"
            placeholder="Enter Password"
            register={register}
            error={errors.password}
            defaultValue={""}
          />
          <Select
            name="role"
            label="Role"
            placeholder="Pilih role"
            register={register}
            error={errors.role}
            options={roleOption}
            defaultValue={isUpdate ? data.role : ""}
          />
          <div className="ltr:text-right rtl:text-left space-x-3">
            <button
              type="button"
              className="btn text-center"
              onClick={handleCancel}
            >
              Batal
            </button>
            <button className="btn btn-dark text-center">
              {isUpdate ? "Update" : "Add"} User
            </button>
          </div>
        </form>
      </Card>
    </>
  );
};

export default Edit;
