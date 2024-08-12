import React, { useState } from "react";
import Textinput from "@/components/ui/Textinput";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import Checkbox from "@/components/ui/Checkbox";
import Button from "@/components/ui/Button";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useLoginMutation } from "@/store/api/auth/authApiSlice";
import { setUser } from "@/store/api/auth/authSlice";
import { toast } from "react-toastify";
import { login } from "@/axios/auth/auth";
import Menu from "@/constant/menu";

const schema = yup
  .object({
    // email: yup.string().email("Invalid email").required("Email is Required"),
    password: yup.string().required("Password is Required"),
  })
  .required();
const LoginForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm({
    resolver: yupResolver(schema),
    //
    mode: "all",
  });

  const onSubmit = async (data) => {
    try {
      const response = await login(data);

      dispatch(setUser(data));
      // dispatch(setUser(response));
      Menu(response.data.data.roles);
      localStorage.setItem("user", JSON.stringify(response.data.access));
      localStorage.setItem("userid", response.data.data.user_id);
      localStorage.setItem("username", response.data.data.user_name);
      localStorage.setItem("roles", response.data.data.roles);
      navigate("/app/dashboard"); // Redirect to dashboard after successful login
      toast.success("Login Successful");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const [checked, setChecked] = useState(false);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 ">
      <Textinput
        name="username"
        label="username"
        defaultValue=""
        type="text"
        register={register}
        error={errors.email}
        className="h-[48px]"
      />
      <Textinput
        name="password"
        label="password"
        type="password"
        defaultValue=""
        register={register}
        error={errors.password}
        className="h-[48px]"
      />
      <div className="flex justify-between">
        <Checkbox
          value={checked}
          onChange={() => setChecked(!checked)}
          label="Keep me signed in"
        />
        <Link
          to="/forgot-password"
          className="text-sm text-slate-800 dark:text-slate-400 leading-6 font-medium"
        >
          Forgot Password?{" "}
        </Link>
      </div>

      <Button
        type="submit"
        text="Sign in"
        className="btn btn-dark block w-full text-center "
        // isLoading={isLoading}
      />
    </form>
  );
};

export default LoginForm;
