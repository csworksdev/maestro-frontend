import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Navigate, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import * as yup from "yup";

import Textinput from "@/components/ui/Textinput";
import Button from "@/components/ui/Button";
// import { setUser } from "@/store/api/auth/authSlice";
import { setUser } from "@/redux/slicers/authSlice";
import { login } from "@/axios/auth/auth";

import Menu from "@/constant/menu";
import { DateTime } from "luxon";
import Swal from "sweetalert2";

const schema = yup.object({
  username: yup.string().required("Username is required"),
  password: yup.string().required("Password is required"),
});

const LoginForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "all",
  });

  const onSubmit = async (NewData) => {
    try {
      const params = {
        username: NewData.username,
        password: NewData.password,
      };
      const response = await login(params);
      const { refresh, access, data } = response.data; // Ensure these fields exist

      if (response.data) {
        dispatch(setUser({ refresh, access, data })); // Ensure payload matches reducer structure
        Menu("Chief");
        localStorage.setItem(
          "presenceSelected",
          DateTime.now().toFormat("c") - 1
        );
        localStorage.setItem("access", access);
        navigate("/app/dashboard");
      } else {
        Swal.fire({
          title: "username or password invalid",
        });
      }
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Textinput
        name="username"
        label="Username"
        type="text"
        register={register}
        error={errors.username}
        className="h-[48px]"
      />
      <Textinput
        name="password"
        label="Password"
        type="password"
        register={register}
        error={errors.password}
        className="h-[48px]"
      />
      <div className="flex justify-between">
        <Link
          to="/forgot-password"
          className="text-sm text-slate-800 dark:text-slate-400 leading-6 font-medium"
        >
          Forgot Password?
        </Link>
      </div>
      <Button
        type="submit"
        text="Sign in"
        className="btn btn-dark block w-full text-center"
      />
    </form>
  );
};

export default LoginForm;
