// PATH: src/Pages/Landing.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { User, Briefcase, ArrowRight, Shield, Zap, Star } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/60">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 text-sm font-bold text-white shadow-xs shadow-orange-500/30">
              Q
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900">
              Quick<span className="text-orange-600">Service</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-8 sm:px-6">
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-1 rounded-full border border-orange-100 bg-orange-50/80 px-2.5 py-0.5 text-[11px] font-semibold text-orange-700">
            Professional On-Demand Platform
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Welcome to <span className="text-orange-600">QuickService</span>
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-center text-xs text-slate-500 sm:text-sm">
            Your trusted destination for doorstep maintenance and professional repairs.
            Choose how you want to get started.
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="mx-auto grid w-full max-w-3xl gap-5 md:grid-cols-2">
          {/* Customer Card */}
          <div
            onClick={() => navigate("/login")}
            className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all duration-200 hover:-translate-y-1 hover:border-orange-300 hover:shadow-[0_8px_20px_rgba(249,115,22,0.08)]"
          >
            <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-orange-100/50 blur-xl transition-transform duration-500 group-hover:scale-125" />

            <div className="relative">
              {/* Icon Container */}
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 ring-1 ring-orange-200/60 transition-transform duration-200 group-hover:scale-105">
                <User size={20} strokeWidth={2} />
              </div>

              {/* Title & Tagline */}
              <h2 className="text-lg font-bold tracking-tight text-slate-900 transition-colors group-hover:text-orange-600">
                I Need a Service
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                Book verified professionals for home repairs with transparent pricing
                and real-time tracking.
              </p>

              {/* Features List */}
              <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2.5 text-xs text-slate-600">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                    <Zap size={11} />
                  </div>
                  <span>Instant or scheduled booking</span>
                </li>
                <li className="flex items-center gap-2.5 text-xs text-slate-600">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                    <Star size={11} />
                  </div>
                  <span>Verified & rated technicians</span>
                </li>
                <li className="flex items-center gap-2.5 text-xs text-slate-600">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                    <Shield size={11} />
                  </div>
                  <span>Pay after service completion</span>
                </li>
              </ul>
            </div>

            {/* Light Orange Button */}
            <div className="relative mt-6 pt-1">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-100/80 px-4 py-2 text-xs font-semibold text-orange-700 transition-colors duration-200 hover:bg-orange-200 active:scale-[0.98]"
              >
                <span>Continue as Customer</span>
                <ArrowRight
                  size={14}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </button>
            </div>
          </div>

          {/* Provider Card */}
          <div
            onClick={() => navigate("/provider/login")}
            className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all duration-200 hover:-translate-y-1 hover:border-sky-300 hover:shadow-[0_8px_20px_rgba(14,165,233,0.08)]"
          >
            <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-sky-100/50 blur-xl transition-transform duration-500 group-hover:scale-125" />

            <div className="relative">
              {/* Icon Container */}
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-200/60 transition-transform duration-200 group-hover:scale-105">
                <Briefcase size={20} strokeWidth={2} />
              </div>

              {/* Title & Tagline */}
              <h2 className="text-lg font-bold tracking-tight text-slate-900 transition-colors group-hover:text-sky-600">
                I Provide Services
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                Join our network, receive nearby job requests, navigate easily,
                and expand your daily earnings.
              </p>

              {/* Features List */}
              <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2.5 text-xs text-slate-600">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-600">
                    <Zap size={11} />
                  </div>
                  <span>Receive nearby job alerts</span>
                </li>
                <li className="flex items-center gap-2.5 text-xs text-slate-600">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-600">
                    <Star size={11} />
                  </div>
                  <span>In-app route navigation</span>
                </li>
                <li className="flex items-center gap-2.5 text-xs text-slate-600">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-600">
                    <Shield size={11} />
                  </div>
                  <span>Direct tracking of payouts</span>
                </li>
              </ul>
            </div>

            {/* Light Blue Button */}
            <div className="relative mt-6 pt-1">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-sky-100/80 px-4 py-2 text-xs font-semibold text-sky-700 transition-colors duration-200 hover:bg-sky-200 active:scale-[0.98]"
              >
                <span>Continue as Provider</span>
                <ArrowRight
                  size={14}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </button>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-[11px] text-slate-400">
            By continuing, you agree to our{" "}
            <span className="underline decoration-slate-300 underline-offset-2 hover:text-slate-600">
              Terms of Service
            </span>{" "}
            and{" "}
            <span className="underline decoration-slate-300 underline-offset-2 hover:text-slate-600">
              Privacy Policy
            </span>
            .
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/70 bg-white/60 py-3">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <p className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} QuickService. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;