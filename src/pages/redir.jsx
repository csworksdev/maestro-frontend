import React from "react";

import ErrorImage from "@/assets/images/logo/logo.png";
function Redir() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <style>{`
        @keyframes redirFloat {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -14px, 0); }
        }
        @keyframes redirFadeUp {
          0% { opacity: 0; transform: translate3d(0, 18px, 0); }
          100% { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        .redir-fade {
          animation: redirFadeUp 0.8s ease-out both;
        }
        .redir-delay-1 { animation-delay: 0.05s; }
        .redir-delay-2 { animation-delay: 0.15s; }
        .redir-delay-3 { animation-delay: 0.25s; }
        .redir-delay-4 { animation-delay: 0.35s; }
        .redir-delay-5 { animation-delay: 0.45s; }
        .redir-float { animation: redirFloat 7s ease-in-out infinite; }
      `}</style>
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-[120px] redir-float" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-300/20 blur-[140px] redir-float" />
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at top left, rgba(16, 185, 129, 0.22), transparent 45%), radial-gradient(circle at bottom right, rgba(56, 189, 248, 0.18), transparent 40%)",
        }}
      />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16">
        <div className="redir-fade redir-delay-1 flex items-center gap-4">
          <div className="rounded-2xl bg-white/10 p-3 shadow-[0_10px_30px_rgba(15,23,42,0.35)]">
            <img src={ErrorImage} alt="Maestro Swim" className="h-10 w-10" />
          </div>
          <div className="text-left">
            <p className="text-xs uppercase tracking-[0.4em] text-emerald-200/70">
              Maestro Swim
            </p>
            <p className="text-sm text-white/70">Coach Corner App</p>
          </div>
        </div>

        <div className="mt-8 max-w-2xl text-center">
          <h1 className="redir-fade redir-delay-2 text-3xl font-semibold text-white sm:text-4xl">
            Portal sedang maintenance, app tetap jalan.
          </h1>
          <p className="redir-fade redir-delay-3 mt-4 text-base text-white/75">
            Temen-temen Pelatih silakan pakai aplikasi yang sudah di-share di
            grup. Pilih platform di bawah ini untuk download.
          </p>
        </div>

        <div className="mt-10 grid w-full gap-6 lg:grid-cols-2">
          <div className="redir-fade redir-delay-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">
                  iPhone
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  Download lewat TestFlight
                </h3>
                <p className="mt-2 text-sm text-white/70">
                  Versi resmi untuk iOS, akses terbatas via TestFlight.
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-100">
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M16.36 1.43c0 1.14-.46 2.28-1.28 3.15-.82.87-2.12 1.54-3.26 1.45-.13-1.13.39-2.3 1.21-3.17.87-.92 2.35-1.58 3.33-1.43z" />
                  <path d="M20.88 17.54c-.07.16-1.1 3.3-3.6 3.33-1.27.03-1.68-.8-3.12-.8-1.43 0-1.9.77-3.09.83-2.41.1-4.26-4.74-4.26-8.06 0-3.6 2.36-5.33 4.24-5.33 1.18 0 2.1.84 2.82.84.7 0 1.85-.87 3.14-.74.54.02 2.06.22 3.03 1.64-2.68 1.46-2.24 5.36.84 6.29z" />
                </svg>
              </div>
            </div>
            <a
              href="https://testflight.apple.com/join/5ME85Xuh"
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-400/15 px-5 py-3 text-sm font-semibold text-emerald-50 ring-1 ring-emerald-300/30 transition hover:bg-emerald-400/25"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 3a1 1 0 0 1 1 1v9.17l2.59-2.58a1 1 0 1 1 1.41 1.42l-4.3 4.3a1 1 0 0 1-1.4 0l-4.3-4.3a1 1 0 1 1 1.41-1.42L11 13.17V4a1 1 0 0 1 1-1z" />
                <path d="M5 19a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1z" />
              </svg>
              Download untuk iPhone
            </a>
            <a
              href="https://youtu.be/Um-28t2lcZ8?si=x5OI_KmsbHGIeI13"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-emerald-200/30 px-5 py-3 text-sm font-semibold text-emerald-100/90 transition hover:bg-emerald-200/10"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8.5 7.5a1 1 0 0 1 1.52-.86l6.5 4a1 1 0 0 1 0 1.72l-6.5 4A1 1 0 0 1 8.5 15.5z" />
              </svg>
              Lihat tutorial instalasi
            </a>
          </div>

          <div className="redir-fade redir-delay-5 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">
                  Android
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  Download APK terbaru
                </h3>
                <p className="mt-2 text-sm text-white/70">
                  File APK resmi, langsung install di perangkat Android.
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-100">
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M17.6 9.48 16.41 7.5l.9-.52-1.25-2.16-.9.52-.83-1.44A.48.48 0 0 0 13.9 3h-3.8a.48.48 0 0 0-.43.24l-.83 1.44-.9-.52-1.25 2.16.9.52-1.19 1.98a.48.48 0 0 0-.07.24v6.94A1 1 0 0 0 7.33 17h.67v2.5a.5.5 0 0 0 1 0V17h6v2.5a.5.5 0 0 0 1 0V17h.67A1 1 0 0 0 18.67 16V9.72a.48.48 0 0 0-.07-.24zM9.25 6.5 9.9 5.38h4.2l.65 1.12H9.25zM9 9.75a.75.75 0 1 1 .75.75A.75.75 0 0 1 9 9.75zm6 0a.75.75 0 1 1 .75.75A.75.75 0 0 1 15 9.75z" />
                </svg>
              </div>
            </div>
            <a
              href="https://media.maestroswim.com/apk/CoachCorner_v1.1.apk"
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-cyan-400/15 px-5 py-3 text-sm font-semibold text-cyan-50 ring-1 ring-cyan-300/30 transition hover:bg-cyan-400/25"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 3a1 1 0 0 1 1 1v9.17l2.59-2.58a1 1 0 1 1 1.41 1.42l-4.3 4.3a1 1 0 0 1-1.4 0l-4.3-4.3a1 1 0 1 1 1.41-1.42L11 13.17V4a1 1 0 0 1 1-1z" />
                <path d="M5 19a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1z" />
              </svg>
              Download untuk Android
            </a>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60">
              Jika muncul warning, pilih "Install anyway" lalu lanjutkan.
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-xs text-white/60">
          <span className="rounded-full border border-white/10 px-4 py-2">
            Butuh bantuan? Hubungi Chandra.
          </span>
          <span className="rounded-full border border-white/10 px-4 py-2">
            Update terbaru akan dibagikan lewat grup resmi.
          </span>
        </div>
      </div>
    </div>
  );
}

export default Redir;
