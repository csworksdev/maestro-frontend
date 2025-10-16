import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import LoginForm from "./common/login-form";
import Logo from "@/assets/images/logo/logo.png";

const Login = () => {
  const currentYear = new Date().getFullYear();
  const hubLabel = useMemo(() => {
    if (typeof window === "undefined") return "Maestro Hub";
    const hostname = window.location.hostname;
    const candidate = hostname.includes(".")
      ? hostname.split(".")[0]
      : hostname;
    const base =
      candidate && candidate !== "localhost" ? candidate : "maestro";
    const formatted = base
      .split(/[-_]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    return `${formatted || "Maestro"} Hub`;
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#f3f4ff] via-white to-[#eef5ff] dark:from-[#0f172a] dark:via-[#111827] dark:to-[#1e293b]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_55%)]" />
      <div className="absolute top-24 right-16 h-32 w-32 rounded-full bg-primary-400/10 blur-3xl dark:bg-primary-500/20" />
      <div className="absolute bottom-20 left-10 h-24 w-24 rounded-full bg-slate-400/10 blur-3xl dark:bg-slate-500/20" />

      <div className="relative z-10 flex w-full max-w-[420px] flex-col items-center px-6 pb-10 pt-16 sm:px-8">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link to="/" className="inline-flex items-center justify-center">
            <img
              src={Logo}
              alt="Maestro"
              className="h-32 w-auto drop-shadow-md"
            />
          </Link>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-primary-600 dark:text-primary-400">
            {hubLabel}
          </p>
        </div>
        <LoginForm />
        <p className="mt-10 text-xs font-medium tracking-wide text-slate-400 dark:text-slate-500">
          © {currentYear} Maestro Swim Bisa
        </p>
      </div>
    </div>
  );
};

export default Login;
