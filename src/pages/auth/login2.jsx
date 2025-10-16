import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import LoginForm from "./common/login-coach";
import Logo from "@/assets/images/logo/logo.png";

const LoginCoach = () => {
  const currentYear = 2024;
  const hubLabel = useMemo(() => {
    if (typeof window === "undefined") return "Maestro Hub";
    const hostname = window.location.hostname;
    const candidate = hostname.includes(".")
      ? hostname.split(".")[0]
      : hostname;
    const base = candidate && candidate !== "localhost" ? candidate : "maestro";
    const formatted = base
      .split(/[-_]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    return `${formatted || "Maestro"} Hub`;
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#1f2937]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.15),_transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(236,72,153,0.12),_transparent_55%)]" />
      <div className="absolute top-24 left-16 h-32 w-32 rounded-full bg-primary-400/20 blur-3xl" />
      <div className="absolute bottom-24 right-10 h-28 w-28 rounded-full bg-slate-300/10 blur-3xl" />

      <div className="relative z-10 flex w-full max-w-[420px] flex-col items-center px-6 pb-10 pt-16 sm:px-8">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link to="/" className="inline-flex items-center justify-center">
            <img
              src={Logo}
              alt="Maestro"
              className="h-32 w-auto drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
            />
          </Link>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-slate-200/80">
            {hubLabel}
          </p>
        </div>
        <LoginForm />
        <p className="mt-10 text-xs font-medium tracking-wide text-slate-500">
          © {currentYear} CV. Maestro Bisa
        </p>
      </div>
    </div>
  );
};

export default LoginCoach;
