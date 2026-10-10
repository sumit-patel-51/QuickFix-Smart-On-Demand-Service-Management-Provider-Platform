import React, { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Lock,
  Save,
  Eye,
  EyeOff,
  CalendarDays,
  CheckCircle2,
  Edit3,
  X,
  Camera,
} from "lucide-react";
import Swal from "sweetalert2";
import api from "../../api/axios";

const AdminProfile = () => {
  const [profile, setProfile] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [editModal, setEditModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Fetch Profile
  |--------------------------------------------------------------------------
  */

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const response = await api.get("/admin/profile");

      if (response.data.success) {
        const data = response.data.admin;

        setProfile(data);

        setFormData({
          name: data.name || "",
          phone: data.phone || "",
          address: data.address || "",
        });
      }
    } catch (error) {
      console.error("Profile fetch error:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error.response?.data?.message ||
          "Unable to load admin profile.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Open Edit Profile Modal
  |--------------------------------------------------------------------------
  */

  const handleEditProfile = () => {
    if (!profile) return;

    setFormData({
      name: profile.name || "",
      phone: profile.phone || "",
      address: profile.address || "",
    });

    setProfileImage(null);
    setImagePreview(null);

    setEditModal(true);
  };

  /*
  |--------------------------------------------------------------------------
  | Close Edit Modal
  |--------------------------------------------------------------------------
  */

  const handleCloseEditModal = () => {
    if (saving) return;

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setProfileImage(null);
    setImagePreview(null);
    setEditModal(false);
  };

  /*
  |--------------------------------------------------------------------------
  | Handle Input
  |--------------------------------------------------------------------------
  */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Handle Profile Photo
  |--------------------------------------------------------------------------
  */

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Image",
        text: "Please select a valid image file.",
      });

      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        icon: "warning",
        title: "Image Too Large",
        text: "Profile photo must be less than 2MB.",
      });

      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setProfileImage(file);

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  /*
  |--------------------------------------------------------------------------
  | Update Profile
  |--------------------------------------------------------------------------
  */

  const updateProfile = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Name Required",
        text: "Please enter your name.",
      });

      return;
    }

    try {
      setSaving(true);

      const submitData = new FormData();

      submitData.append("name", formData.name.trim());
      submitData.append("phone", formData.phone.trim());
      submitData.append("address", formData.address.trim());

      // Laravel method spoofing
      submitData.append("_method", "PUT");

      /*
      |----------------------------------------------------------------------
      | IMPORTANT: Backend uses profile_photo
      |----------------------------------------------------------------------
      */

      if (profileImage) {
        submitData.append("profile_photo", profileImage);
      }

      const response = await api.post(
        "/admin/profile",
        submitData
      );

      if (response.data.success) {
        const updatedAdmin = response.data.admin;

        setProfile(updatedAdmin);

        setFormData({
          name: updatedAdmin.name || "",
          phone: updatedAdmin.phone || "",
          address: updatedAdmin.address || "",
        });

        if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
        }

        setProfileImage(null);
        setImagePreview(null);
        setEditModal(false);

        /*
        |--------------------------------------------------------------------------
        | Update Local Storage
        |--------------------------------------------------------------------------
        */

        const storedUser = localStorage.getItem("user");

        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);

            const updatedUser = {
              ...user,
              name: updatedAdmin.name,
              email: updatedAdmin.email,
              phone: updatedAdmin.phone,
              address: updatedAdmin.address,
              profile_photo: updatedAdmin.profile_photo,
            };

            localStorage.setItem(
              "user",
              JSON.stringify(updatedUser)
            );

            window.dispatchEvent(new Event("userUpdated"));
          } catch (error) {
            console.error(
              "LocalStorage update error:",
              error
            );
          }
        }

        Swal.fire({
          icon: "success",
          title: "Profile Updated!",
          text: "Your profile has been updated successfully.",
          timer: 1800,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Profile update error:", error);

      let message =
        error.response?.data?.message ||
        "Unable to update profile.";

      if (error.response?.data?.errors) {
        const firstError = Object.values(
          error.response.data.errors
        )[0];

        if (firstError?.[0]) {
          message = firstError[0];
        }
      }

      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: message,
      });
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Password
  |--------------------------------------------------------------------------
  */

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openPasswordModal = () => {
    setPasswordData({
      current_password: "",
      new_password: "",
      new_password_confirmation: "",
    });

    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);

    setPasswordModal(true);
  };

  const closePasswordModal = () => {
    if (changingPassword) return;

    setPasswordModal(false);

    setPasswordData({
      current_password: "",
      new_password: "",
      new_password_confirmation: "",
    });

    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const changePassword = async (e) => {
    e.preventDefault();

    if (!passwordData.current_password) {
      Swal.fire({
        icon: "warning",
        title: "Current Password Required",
        text: "Please enter your current password.",
      });

      return;
    }

    if (!passwordData.new_password) {
      Swal.fire({
        icon: "warning",
        title: "New Password Required",
        text: "Please enter a new password.",
      });

      return;
    }

    if (passwordData.new_password.length < 8) {
      Swal.fire({
        icon: "warning",
        title: "Password Too Short",
        text: "New password must be at least 8 characters.",
      });

      return;
    }

    if (
      passwordData.new_password !==
      passwordData.new_password_confirmation
    ) {
      Swal.fire({
        icon: "warning",
        title: "Passwords Do Not Match",
        text: "New password and confirm password must be the same.",
      });

      return;
    }

    try {
      setChangingPassword(true);

      const response = await api.post(
        "/admin/profile/change-password",
        passwordData
      );

      if (response.data.success) {
        closePasswordModal();

        Swal.fire({
          icon: "success",
          title: "Password Changed!",
          text: "Your password has been changed successfully.",
          timer: 1800,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Password change error:", error);

      let message =
        error.response?.data?.message ||
        "Unable to change password.";

      if (error.response?.data?.errors) {
        const firstError = Object.values(
          error.response.data.errors
        )[0];

        if (firstError?.[0]) {
          message = firstError[0];
        }
      }

      Swal.fire({
        icon: "error",
        title: "Password Change Failed",
        text: message,
      });
    } finally {
      setChangingPassword(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Format Date
  |--------------------------------------------------------------------------
  */

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto"></div>

          <p className="mt-4 text-slate-600 font-medium">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Profile Not Found
  |--------------------------------------------------------------------------
  */

  if (!profile) {
    return (
      <div className="min-h-[70vh] bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 flex items-center justify-center">
            <User size={30} className="text-red-500" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-5">
            Profile Not Found
          </h2>

          <p className="text-slate-500 mt-2">
            We could not load your admin profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                <User size={19} className="text-blue-600" />
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                My Profile
              </h1>
            </div>

            <p className="text-sm text-slate-500 mt-2 ml-11">
              Manage your admin account and personal information.
            </p>
          </div>

          <button
            onClick={handleEditProfile}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm hover:shadow-md transition"
          >
            <Edit3 size={17} />
            Edit Profile
          </button>
        </div>
      </div>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ===================================================
            PROFILE SUMMARY
        =================================================== */}

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm mb-6 overflow-hidden">

          <div className="h-28 bg-gradient-to-r from-blue-600 to-indigo-600"></div>

          <div className="px-5 sm:px-8 pb-7">
            <div className="flex flex-col md:flex-row md:items-end gap-5">

              {/* PROFILE PHOTO */}

              <div className="-mt-14 shrink-0">
                <div className="relative">

                  <div className="w-28 h-28 rounded-3xl bg-blue-50 border-4 border-white shadow-md overflow-hidden">

                    {profile.profile_photo ? (
                      <img
                        src={profile.profile_photo}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-blue-50 flex items-center justify-center">
                        <User
                          size={52}
                          strokeWidth={1.5}
                          className="text-blue-600"
                        />
                      </div>
                    )}

                  </div>

                  <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-white bg-green-500"></span>

                </div>
              </div>

              {/* PROFILE INFO */}

              <div className="flex-1 pb-1">

                <div className="flex flex-wrap items-center gap-3">

                  <h2 className="text-2xl font-bold text-slate-900">
                    {profile.name || "Admin User"}
                  </h2>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold">
                    <ShieldCheck size={14} />
                    Administrator
                  </span>

                </div>

                <p className="text-sm text-slate-500 mt-1">
                  {profile.email}
                </p>

              </div>

              {/* STATUS */}

              <div className="pb-1">

                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-100 text-green-700 text-xs font-bold capitalize">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  {profile.status || "active"}
                </span>

              </div>

            </div>
          </div>
        </div>

        {/* ===================================================
            INFORMATION GRID
        =================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* PERSONAL INFORMATION */}

          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

            <div className="px-5 sm:px-8 py-6 border-b border-slate-100">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <User size={19} className="text-blue-600" />
                </div>

                <div>

                  <h2 className="text-lg font-bold text-slate-900">
                    Personal Information
                  </h2>

                  <p className="text-sm text-slate-500">
                    Your account and contact details
                  </p>

                </div>

              </div>
            </div>

            <div className="p-5 sm:p-8">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* NAME */}

                <div>

                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Full Name
                  </label>

                  <div className="flex items-center gap-3 px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl">

                    <User size={18} className="text-blue-500" />

                    <span className="text-slate-800 font-medium">
                      {profile.name || "Not available"}
                    </span>

                  </div>
                </div>

                {/* EMAIL */}

                <div>

                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email Address
                  </label>

                  <div className="flex items-center gap-3 px-4 py-3.5 bg-blue-50/50 border border-blue-100 rounded-xl">

                    <Mail size={18} className="text-blue-500 shrink-0" />

                    <span className="text-slate-800 font-medium break-all">
                      {profile.email || "Not available"}
                    </span>

                  </div>
                </div>

                {/* PHONE */}

                <div>

                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Phone Number
                  </label>

                  <div className="flex items-center gap-3 px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl">

                    <Phone size={18} className="text-blue-500" />

                    <span className="text-slate-800 font-medium">
                      {profile.phone || "Not available"}
                    </span>

                  </div>
                </div>

                {/* ADDRESS */}

                <div>

                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Address
                  </label>

                  <div className="flex items-start gap-3 px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl min-h-[54px]">

                    <MapPin
                      size={18}
                      className="text-blue-500 mt-0.5 shrink-0"
                    />

                    <span className="text-slate-800 font-medium">
                      {profile.address || "Address not added"}
                    </span>

                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* ACCOUNT INFORMATION */}

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

            <div className="px-5 py-6 border-b border-slate-100">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <ShieldCheck
                    size={19}
                    className="text-emerald-600"
                  />
                </div>

                <div>

                  <h2 className="text-lg font-bold text-slate-900">
                    Account Information
                  </h2>

                  <p className="text-sm text-slate-500">
                    Account details
                  </p>

                </div>

              </div>
            </div>

            <div className="divide-y divide-slate-100">

              {/* ROLE */}

              <div className="flex items-center justify-between px-5 py-4">

                <span className="text-sm text-slate-500">
                  Role
                </span>

                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold capitalize">
                  {profile.role || "admin"}
                </span>

              </div>

              {/* STATUS */}

              <div className="flex items-center justify-between px-5 py-4">

                <span className="text-sm text-slate-500">
                  Status
                </span>

                <span className="text-sm font-semibold text-green-600 capitalize">
                  {profile.status || "active"}
                </span>

              </div>

              {/* VERIFICATION */}

              <div className="flex items-center justify-between px-5 py-4">

                <span className="text-sm text-slate-500">
                  Verification
                </span>

                <span
                  className={`flex items-center gap-1.5 text-sm font-semibold ${
                    profile.is_verified
                      ? "text-green-600"
                      : "text-slate-400"
                  }`}
                >
                  <CheckCircle2 size={16} />
                  {profile.is_verified
                    ? "Verified"
                    : "Not Verified"}
                </span>

              </div>

              {/* JOINED */}

              <div className="flex items-center justify-between px-5 py-4">

                <span className="flex items-center gap-2 text-sm text-slate-500">
                  <CalendarDays size={16} />
                  Joined
                </span>

                <span className="text-sm font-medium text-slate-700">
                  {formatDate(profile.created_at)}
                </span>

              </div>

            </div>
          </div>
        </div>

        {/* ===================================================
            SECURITY
        =================================================== */}

        <div className="mt-6 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

          <div className="px-5 sm:px-8 py-6">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Lock size={19} className="text-amber-600" />
                </div>

                <div>

                  <h2 className="text-lg font-bold text-slate-900">
                    Security
                  </h2>

                  <p className="text-sm text-slate-500">
                    Manage your admin account password.
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={openPasswordModal}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition"
              >
                <Lock size={17} />
                Change Password
              </button>

            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          EDIT PROFILE MODAL
      ===================================================== */}

      {editModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseEditModal();
            }
          }}
        >

          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

            {/* MODAL HEADER */}

            <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between">

              <div>

                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Edit Profile
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Update your personal information
                </p>

              </div>

              <button
                type="button"
                onClick={handleCloseEditModal}
                disabled={saving}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition disabled:opacity-50"
              >
                <X size={20} />
              </button>

            </div>

            {/* FORM */}

            <form onSubmit={updateProfile}>

              <div className="p-6 sm:p-8">

                {/* PROFILE PHOTO */}

                <div className="flex flex-col items-center mb-7">

                  <div className="w-28 h-28 rounded-3xl bg-blue-50 border border-blue-100 p-1.5 overflow-hidden">

                    {imagePreview || profile.profile_photo ? (
                      <img
                        src={
                          imagePreview ||
                          profile.profile_photo
                        }
                        alt={profile.name}
                        className="w-full h-full object-cover rounded-[20px]"
                      />
                    ) : (
                      <div className="w-full h-full rounded-[20px] bg-blue-50 flex items-center justify-center">
                        <User
                          size={50}
                          className="text-blue-600"
                        />
                      </div>
                    )}

                  </div>

                  <label
                    htmlFor="admin_profile_photo"
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl text-sm font-semibold cursor-pointer hover:bg-blue-100 transition"
                  >
                    <Camera size={16} />
                    Change Photo
                  </label>

                  <input
                    id="admin_profile_photo"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />

                  <p className="text-xs text-slate-400 mt-2">
                    JPG, PNG, WEBP • Max 2MB
                  </p>

                </div>

                {/* INPUTS */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  {/* NAME */}

                  <div>

                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Full Name
                    </label>

                    <div className="relative">

                      <User
                        size={18}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition"
                        placeholder="Enter your full name"
                      />

                    </div>
                  </div>

                  {/* EMAIL */}

                  <div>

                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Email Address
                    </label>

                    <div className="relative">

                      <Mail
                        size={18}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="text"
                        value={profile.email || ""}
                        disabled
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                      />

                    </div>

                    <p className="text-xs text-slate-400 mt-1.5">
                      Email address cannot be changed.
                    </p>

                  </div>

                  {/* PHONE */}

                  <div>

                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Phone Number
                    </label>

                    <div className="relative">

                      <Phone
                        size={18}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition"
                        placeholder="Enter phone number"
                      />

                    </div>
                  </div>

                  {/* ADDRESS */}

                  <div>

                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Address
                    </label>

                    <div className="relative">

                      <MapPin
                        size={18}
                        className="absolute left-3.5 top-3.5 text-slate-400"
                      />

                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows="3"
                        className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl outline-none resize-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition"
                        placeholder="Enter your address"
                      />

                    </div>
                  </div>

                </div>
              </div>

              {/* FOOTER */}

              <div className="px-6 sm:px-8 py-5 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row justify-end gap-3">

                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 transition"
                >
                  <X size={18} />
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          CHANGE PASSWORD MODAL
      ===================================================== */}

      {passwordModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closePasswordModal();
            }
          }}
        >

          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">

            {/* HEADER */}

            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Lock
                    size={19}
                    className="text-amber-600"
                  />
                </div>

                <div>

                  <h2 className="text-xl font-bold text-slate-900">
                    Change Password
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">
                    Update your account password.
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={closePasswordModal}
                disabled={changingPassword}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X size={19} />
              </button>

            </div>

            {/* PASSWORD FORM */}

            <form onSubmit={changePassword}>

              <div className="p-6 space-y-5">

                {/* CURRENT */}

                <div>

                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Current Password
                  </label>

                  <div className="relative">

                    <input
                      type={
                        showCurrent
                          ? "text"
                          : "password"
                      }
                      name="current_password"
                      value={
                        passwordData.current_password
                      }
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3.5 pr-11 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      placeholder="Enter current password"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrent(!showCurrent)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrent ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>

                  </div>
                </div>

                {/* NEW */}

                <div>

                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    New Password
                  </label>

                  <div className="relative">

                    <input
                      type={
                        showNew
                          ? "text"
                          : "password"
                      }
                      name="new_password"
                      value={
                        passwordData.new_password
                      }
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3.5 pr-11 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      placeholder="Minimum 8 characters"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowNew(!showNew)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNew ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>

                  </div>
                </div>

                {/* CONFIRM */}

                <div>

                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Confirm New Password
                  </label>

                  <div className="relative">

                    <input
                      type={
                        showConfirm
                          ? "text"
                          : "password"
                      }
                      name="new_password_confirmation"
                      value={
                        passwordData.new_password_confirmation
                      }
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3.5 pr-11 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      placeholder="Confirm new password"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirm(!showConfirm)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirm ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>

                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-xs text-blue-700">
                    Password must contain at least 8 characters.
                  </p>
                </div>

              </div>

              {/* FOOTER */}

              <div className="px-6 py-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={closePasswordModal}
                  disabled={changingPassword}
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={changingPassword}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition disabled:opacity-60"
                >
                  {changingPassword ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                      Changing...
                    </>
                  ) : (
                    <>
                      <Lock size={17} />
                      Change Password
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

export default AdminProfile;

