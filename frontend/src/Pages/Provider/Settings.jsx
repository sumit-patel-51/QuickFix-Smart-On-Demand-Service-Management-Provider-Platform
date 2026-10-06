import React, { useState } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  Save,
  ShieldCheck,
  KeyRound,
  X,
  Settings as SettingsIcon,
} from "lucide-react";
import Swal from "sweetalert2";
import api from "../../api/axios";

// ==========================================
// PASSWORD INPUT COMPONENT
// IMPORTANT: Keep this OUTSIDE Settings
// ==========================================

const PasswordInput = ({
  label,
  name,
  value,
  show,
  setShow,
  placeholder,
  onChange,
  disabled,
  autoComplete = "new-password",
}) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <div className="relative">
        {/* LEFT LOCK ICON */}

        <Lock
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />

        {/* PASSWORD INPUT */}

        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-11 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-gray-50"
        />

        {/* SHOW / HIDE BUTTON */}

        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-blue-600 disabled:opacity-50"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      </div>
    </div>
  );
};

// ==========================================
// SETTINGS COMPONENT
// ==========================================

const Settings = () => {
  const [formData, setFormData] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ==========================================
  // HANDLE INPUT
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // RESET FORM
  // ==========================================

  const resetForm = () => {
    setFormData({
      current_password: "",
      new_password: "",
      new_password_confirmation: "",
    });

    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  // ==========================================
  // OPEN MODAL
  // ==========================================

  const openModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // ==========================================
  // CLOSE MODAL
  // ==========================================

  const closeModal = () => {
    if (loading) return;

    setIsModalOpen(false);
    resetForm();
  };

  // ==========================================
  // CHANGE PASSWORD
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ==========================================
    // REQUIRED FIELDS
    // ==========================================

    if (
      !formData.current_password ||
      !formData.new_password ||
      !formData.new_password_confirmation
    ) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill all password fields.",
        confirmButtonColor: "#2563eb",
      });

      return;
    }

    // ==========================================
    // PASSWORD MATCH
    // ==========================================

    if (
      formData.new_password !==
      formData.new_password_confirmation
    ) {
      Swal.fire({
        icon: "warning",
        title: "Password Mismatch",
        text: "New password and confirmation password do not match.",
        confirmButtonColor: "#2563eb",
      });

      return;
    }

    // ==========================================
    // PASSWORD LENGTH
    // ==========================================

    if (formData.new_password.length < 8) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Password",
        text: "New password must be at least 8 characters.",
        confirmButtonColor: "#2563eb",
      });

      return;
    }

    // ==========================================
    // PASSWORD FORMAT
    // ==========================================

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

    if (!passwordRegex.test(formData.new_password)) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Password",
        text:
          "Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number.",
        confirmButtonColor: "#2563eb",
      });

      return;
    }

    // ==========================================
    // API REQUEST
    // ==========================================

    setLoading(true);

    try {
      const response = await api.post(
        "/provider/settings/change-password",
        formData
      );

      // ==========================================
      // SUCCESS
      // IMPORTANT:
      // DO NOT REMOVE TOKEN
      // DO NOT REDIRECT TO LOGIN
      // ==========================================

      if (response.data.success) {
        setIsModalOpen(false);

        resetForm();

        Swal.fire({
          icon: "success",
          title: "Password Changed!",
          text: "Your password has been changed successfully.",
          confirmButtonColor: "#2563eb",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      console.error("Change password error:", error);

      // ==========================================
      // VALIDATION / PASSWORD ERROR
      // ==========================================

      if (error.response?.status === 422) {
        const errors = error.response?.data?.errors;

        let message =
          error.response?.data?.message ||
          "Please check your password.";

        if (errors) {
          const firstError =
            Object.values(errors)?.[0]?.[0];

          if (firstError) {
            message = firstError;
          }
        }

        Swal.fire({
          icon: "error",
          title: "Unable to Change Password",
          text: message,
          confirmButtonColor: "#2563eb",
        });
      }

      // ==========================================
      // UNAUTHENTICATED
      // IMPORTANT:
      // NO AUTOMATIC REDIRECT
      // ==========================================

      else if (error.response?.status === 401) {
        Swal.fire({
          icon: "error",
          title: "Session Expired",
          text: "Your session has expired. Please login again.",
          confirmButtonColor: "#2563eb",
        });
      }

      // ==========================================
      // FORBIDDEN
      // ==========================================

      else if (error.response?.status === 403) {
        Swal.fire({
          icon: "error",
          title: "Access Denied",
          text:
            error.response?.data?.message ||
            "Only providers can change their password.",
          confirmButtonColor: "#2563eb",
        });
      }

      // ==========================================
      // OTHER ERROR
      // ==========================================

      else {
        Swal.fire({
          icon: "error",
          title: "Something Went Wrong",
          text:
            error.response?.data?.message ||
            "Unable to change password. Please try again.",
          confirmButtonColor: "#2563eb",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">

        {/* ==========================================
            PAGE HEADER
        ========================================== */}

        <div className="mb-6">
          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <SettingsIcon size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Settings
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage your account security and preferences.
              </p>
            </div>

          </div>
        </div>

        {/* ==========================================
            SECURITY CARD
        ========================================== */}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* CARD HEADER */}

          <div className="flex items-center gap-4 border-b border-gray-100 px-5 py-5 sm:px-6">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ShieldCheck size={22} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Security
              </h2>

              <p className="mt-0.5 text-sm text-gray-500">
                Keep your provider account secure.
              </p>
            </div>

          </div>

          {/* CHANGE PASSWORD ROW */}

          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                <KeyRound size={19} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Change Password
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Update your password to protect your account.
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={openModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
            >
              <Lock size={16} />
              Change Password
            </button>

          </div>
        </div>
      </div>

      {/* ==========================================
          CHANGE PASSWORD MODAL
      ========================================== */}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-gray-900/50 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="relative my-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            {/* ==========================================
                MODAL HEADER
            ========================================== */}

            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <ShieldCheck size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Change Password
                  </h2>

                  <p className="text-xs text-gray-500">
                    Update your account password.
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={loading}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>

            </div>

            {/* ==========================================
                MODAL BODY
            ========================================== */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-5 sm:p-6"
            >

              {/* CURRENT PASSWORD */}

              <PasswordInput
                label="Current Password"
                name="current_password"
                value={formData.current_password}
                show={showCurrent}
                setShow={setShowCurrent}
                onChange={handleChange}
                placeholder="Enter your current password"
                disabled={loading}
                autoComplete="current-password"
              />

              {/* NEW PASSWORD */}

              <PasswordInput
                label="New Password"
                name="new_password"
                value={formData.new_password}
                show={showNew}
                setShow={setShowNew}
                onChange={handleChange}
                placeholder="Enter your new password"
                disabled={loading}
                autoComplete="new-password"
              />

              {/* CONFIRM PASSWORD */}

              <PasswordInput
                label="Confirm New Password"
                name="new_password_confirmation"
                value={formData.new_password_confirmation}
                show={showConfirm}
                setShow={setShowConfirm}
                onChange={handleChange}
                placeholder="Confirm your new password"
                disabled={loading}
                autoComplete="new-password"
              />

              {/* ==========================================
                  PASSWORD REQUIREMENTS
              ========================================== */}

              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">

                <p className="font-semibold">
                  Password requirements
                </p>

                <ul className="mt-2 list-disc space-y-1 pl-4">
                  <li>At least 8 characters</li>
                  <li>At least 1 uppercase letter</li>
                  <li>At least 1 lowercase letter</li>
                  <li>At least 1 number</li>
                </ul>

              </div>

              {/* ==========================================
                  MODAL FOOTER
              ========================================== */}

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                  className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Update Password
                    </>
                  )}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

