import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import * as yup from "yup";

import Textinput from "@/components/ui/Textinput";
import Button from "@/components/ui/Button";
import { setUser } from "@/store/api/auth/authSlice";
import { login } from "@/axios/auth/auth";
import Menu from "@/constant/menu";

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
      const response = await login(NewData);
      const { refresh, access, data: data } = response.data;

      // // Dispatch to Redux store without storing in localStorage
      // dispatch(setUser({ refresh, access, data: userData }));
      localStorage.setItem("refresh", refresh);
      localStorage.setItem("access", access);
      localStorage.setItem("user", JSON.stringify(data));
      localStorage.setItem("userid", data.user_id);
      localStorage.setItem("username", data.user_name);
      localStorage.setItem("roles", data.roles);

      // Update the menu based on user roles
      Menu(data.roles);

      // Navigate to dashboard upon successful login
      navigate("/app/dashboard");
      toast.success("Login Successful");
    } catch (error) {
      toast.error("Login failed. Please check your credentials.");
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
