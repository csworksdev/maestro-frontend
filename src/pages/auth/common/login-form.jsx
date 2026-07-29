import React, { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as yup from "yup";

import Textinput from "@/components/ui/Textinput";
import Button from "@/components/ui/Button";
import { setUser } from "@/redux/slicers/authSlice";
import { login } from "@/axios/auth/auth";

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
  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    getValues,
    formState: { errors, isSubmitting, isValid },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "all",
    defaultValues: {
      rememberMe: true,
    },
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
        // Simpan token ke store global
        setUser({ refresh, access, data, rememberMe: NewData.rememberMe });

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
            // console.log("✅ FCM token disimpan di server");
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
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Terjadi kesalahan saat masuk. Silakan coba lagi.";
      toast.error(message);
      console.error("Error:", error.response?.data || error.message);
    }
  };

  const isDisabled = !isValid || isSubmitting;

  const formRef = useRef(null);

  useEffect(() => {
    const syncAutofillValues = () => {
      if (!formRef.current) return;
      const fields = ["username", "password"];
      fields.forEach((field) => {
        const input = formRef.current.querySelector(`input[name="${field}"]`);
        if (input && input.value) {
          const currentValue = getValues(field);
          if (input.value === currentValue) {
            return;
          }
          setValue(field, input.value, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }
      });
      trigger();
    };

    const timeouts = [0, 80, 160, 320, 640].map((delay) =>
      setTimeout(syncAutofillValues, delay)
    );
    const intervalId = setInterval(syncAutofillValues, 500);

    return () => {
      timeouts.forEach(clearTimeout);
      clearInterval(intervalId);
    };
  }, [getValues, setValue, trigger]);

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 dark:border-slate-700 dark:bg-slate-900/80 sm:p-8">
        <form
          ref={formRef}
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate
        >
          <div className="space-y-4">
            <Textinput
              name="username"
              label="Username"
              type="text"
              placeholder="contoh: maestro.id"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoFocus
              register={register}
              error={errors.username}
              className="h-12 rounded-2xl border border-slate-200 bg-white/90 px-4 text-slate-900 placeholder:text-slate-400 transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-900/90 dark:text-white dark:placeholder:text-slate-500"
              aria-invalid={Boolean(errors.username)}
            />
            <Textinput
              name="password"
              label="Password"
              type="password"
              placeholder="Masukkan kata sandi"
              autoComplete="current-password"
              register={register}
              error={errors.password}
              className="h-12 rounded-2xl border border-slate-200 bg-white/90 px-4 pr-10 text-slate-900 placeholder:text-slate-400 transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-900/90 dark:text-white dark:placeholder:text-slate-500"
              aria-invalid={Boolean(errors.password)}
              hasicon
            />
          </div>

          <Button
            type="submit"
            text="Masuk"
            className={`btn-dark btn w-full rounded-2xl py-3 text-base font-semibold shadow-lg shadow-primary-500/10 transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${
              isDisabled ? "pointer-events-none" : ""
            }`}
            isLoading={isSubmitting}
            disabled={isDisabled}
          />
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
