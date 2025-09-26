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
import { requestAndSendToken } from "@/utils/fcm";
import { axiosConfig } from "@/axios/config";

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
      const { refresh, access, data } = response.data;

      if (response.data) {
        // Simpan token di Redux
        dispatch(setUser({ refresh, access, data }));

        // Simpan token ke storage
        localStorage.setItem("access_token", access);
        localStorage.setItem("refresh_token", refresh);

        // ✅ Simpan presence default
        localStorage.setItem(
          "presenceSelected",
          DateTime.now().toFormat("c") - 1
        );

        // ✅ Kirim FCM token setelah login berhasil
        await requestAndSendToken(async (token) => {
          try {
            await axiosConfig.post(
              "/api/notifikasi/save-token/",
              {
                token,
                device_type: "web",
                origin: window.location.hostname,
              },
              {
                headers: {
                  Authorization: `Bearer ${access}`,
                },
              }
            );
            console.log("✅ FCM token disimpan di server");
            localStorage.setItem("fcm_token", token);
          } catch (err) {
            console.error(
              "❌ Gagal simpan FCM token:",
              err.response?.data || err.message
            );
          }
        });

        // ✅ Baru pindah ke dashboard
        navigate("/");
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
