// PATH: src/Pages/Customer/CustomerProfile.jsx

import React, { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Edit3,
  Save,
  X,
  Loader2,
  CheckCircle,
  Star,
  MessageSquareText,
  ChevronRight,
} from "lucide-react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const CustomerProfile = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    profile_photo: "",
    is_verified: false,
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // =====================================================
  // FETCH PROFILE
  // =====================================================

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const response = await api.get("/customer/user/profile");
      const user = response.data.user || response.data;

      const profileData = {
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        profile_photo: user.profile_photo || "",
        is_verified: user.is_verified || false,
      };

      setProfile(profileData);

      setFormData({
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        address: profileData.address,
      });

      setPreviewImage(profileData.profile_photo);
    } catch (error) {
      console.error("Profile Error:", error);

      try {
        const storedUser = JSON.parse(
          localStorage.getItem("user") || "{}"
        );

        const profileData = {
          name: storedUser.name || "",
          email: storedUser.email || "",
          phone: storedUser.phone || "",
          address: storedUser.address || "",
          profile_photo: storedUser.profile_photo || "",
          is_verified: storedUser.is_verified || false,
        };

        setProfile(profileData);

        setFormData({
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          address: profileData.address,
        });

        setPreviewImage(profileData.profile_photo);
      } catch {
        Swal.fire({
          icon: "error",
          title: "Unable to Load Profile",
          text: "Something went wrong while loading your profile.",
          confirmButtonText: "OK",
          confirmButtonColor: "#fb8c00",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // HANDLE INPUT
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // PROFILE IMAGE
  // =====================================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      Swal.fire({
        icon: "error",
        title: "Invalid Image",
        text: "Please select a valid image file.",
        confirmButtonText: "OK",
        confirmButtonColor: "#dc2626",
      });

      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        icon: "warning",
        title: "Image Too Large",
        text: "Profile photo must be less than 2 MB.",
        confirmButtonText: "OK",
        confirmButtonColor: "#fb8c00",
      });

      e.target.value = "";
      return;
    }

    setProfileImage(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  // =====================================================
  // EDIT PROFILE
  // =====================================================

  const handleEdit = () => {
    setFormData({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      address: profile.address,
    });

    setPreviewImage(profile.profile_photo || "");
    setProfileImage(null);
    setIsEditing(true);
  };

  // =====================================================
  // CANCEL EDIT
  // =====================================================

  const handleCancel = async () => {
    if (
      formData.name !== profile.name ||
      formData.email !== profile.email ||
      formData.phone !== profile.phone ||
      formData.address !== profile.address ||
      profileImage
    ) {
      const result = await Swal.fire({
        icon: "warning",
        title: "Discard Changes?",
        text: "Your unsaved changes will be lost.",
        showCancelButton: true,
        confirmButtonText: "Yes, Discard",
        cancelButtonText: "Keep Editing",
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#6b7280",
      });

      if (!result.isConfirmed) return;
    }

    setFormData({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      address: profile.address,
    });

    setPreviewImage(profile.profile_photo || "");
    setProfileImage(null);
    setIsEditing(false);
  };

  // =====================================================
  // UPDATE PROFILE
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Name Required",
        text: "Please enter your full name.",
        confirmButtonColor: "#fb8c00",
      });
      return;
    }

    if (!formData.email.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Email Required",
        text: "Please enter your email address.",
        confirmButtonColor: "#fb8c00",
      });
      return;
    }

    if (!formData.phone.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Phone Required",
        text: "Please enter your phone number.",
        confirmButtonColor: "#fb8c00",
      });
      return;
    }

    try {
      setSaving(true);

      const data = new FormData();

      data.append("name", formData.name.trim());
      data.append("email", formData.email.trim());
      data.append("phone", formData.phone.trim());
      data.append("address", formData.address.trim());

      if (profileImage) {
        data.append("profile_photo", profileImage);
      }

      const response = await api.post(
        "/customer/user/profile/update",
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const updatedUser =
        response.data.user ||
        response.data.data ||
        response.data;

      const updatedProfile = {
        name: updatedUser.name || "",
        email: updatedUser.email || "",
        phone: updatedUser.phone || "",
        address: updatedUser.address || "",
        profile_photo: updatedUser.profile_photo || "",
        is_verified: updatedUser.is_verified || false,
      };

      setProfile(updatedProfile);

      setFormData({
        name: updatedProfile.name,
        email: updatedProfile.email,
        phone: updatedProfile.phone,
        address: updatedProfile.address,
      });

      setPreviewImage(updatedProfile.profile_photo);
      setProfileImage(null);
      setIsEditing(false);

      const oldUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...oldUser,
          ...updatedUser,
        })
      );

      window.dispatchEvent(new Event("userUpdated"));

      Swal.fire({
        icon: "success",
        title: "Profile Updated!",
        text: "Your personal information has been updated successfully.",
        confirmButtonText: "OK",
        confirmButtonColor: "#fb8c00",
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (error) {
      console.error("Update Profile Error:", error);

      if (error.response?.status === 422) {
        const errors = error.response?.data?.errors;

        Swal.fire({
          icon: "error",
          title: "Validation Error",
          text: errors
            ? Object.values(errors).flat().join("\n")
            : error.response?.data?.message ||
              "Please check your information.",
          confirmButtonColor: "#dc2626",
        });

        return;
      }

      if (error.response?.status === 401) {
        await Swal.fire({
          icon: "warning",
          title: "Session Expired",
          text: "Please login again to continue.",
          confirmButtonText: "Login",
          confirmButtonColor: "#2563eb",
        });

        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");

        window.location.href = "/login";
        return;
      }

      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text:
          error.response?.data?.message ||
          "Something went wrong while updating your profile.",
        confirmButtonText: "Try Again",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-[500px] bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-600 font-medium">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* PAGE HEADER */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
                <User size={19} className="text-orange-600" />
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                My Profile
              </h1>
            </div>

            <p className="text-sm text-slate-500 mt-2 ml-11">
              Manage your account and personal information.
            </p>
          </div>

          {!isEditing && (
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold shadow-sm hover:shadow-md transition-all"
            >
              <Edit3 size={17} />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* PROFILE SUMMARY */}

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
          <div className="p-5 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* PROFILE PHOTO */}

              <div className="shrink-0">
                <div className="relative">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-orange-50 border border-orange-100 p-1.5 shadow-sm">
                    {profile.profile_photo ? (
                      <img
                        src={profile.profile_photo}
                        alt={profile.name || "Customer"}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                        className="w-full h-full object-cover rounded-[20px]"
                      />
                    ) : (
                      <div className="w-full h-full rounded-[20px] bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
                        {profile.name ? (
                          <span className="text-4xl font-bold text-orange-600">
                            {profile.name.charAt(0).toUpperCase()}
                          </span>
                        ) : (
                          <User
                            size={55}
                            strokeWidth={1.5}
                            className="text-orange-600"
                          />
                        )}
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* PROFILE INFORMATION */}

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                    {profile.name || "Customer"}
                  </h2>

                  {profile.is_verified && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-100 text-green-700 text-xs font-bold">
                      <CheckCircle size={15} />
                      Verified Customer
                    </span>
                  )}
                </div>

                <p className="text-slate-500 mt-1">
                  QuiFix Customer Account
                </p>

                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 border border-orange-100 text-xs font-semibold">
                    <User size={14} />
                    Customer Account
                  </span>

                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
                      profile.is_verified
                        ? "bg-green-50 text-green-700 border border-green-100"
                        : "bg-slate-50 text-slate-600 border border-slate-200"
                    }`}
                  >
                 

                  
                  </span>
                </div>
              </div>

              {/* ACCOUNT ICON */}

              <div className="hidden lg:flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100">
                <User size={32} className="text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* MY RATINGS & REVIEWS CARD */}

        <button
          type="button"
          onClick={() => navigate("/customer/reviews")}
          className="w-full bg-white rounded-3xl border border-slate-200 shadow-sm mb-6 p-5 sm:p-6 text-left hover:border-orange-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center group-hover:bg-orange-100 transition">
                <Star
                  size={27}
                  className="text-orange-500"
                  fill="currentColor"
                />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  My Ratings & Reviews
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  View the ratings and reviews you have submitted for service providers.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-orange-600 font-semibold shrink-0">
              <span className="hidden sm:inline">View Reviews</span>
              <ChevronRight
                size={22}
                className="group-hover:translate-x-1 transition-transform"
              />
            </div>
          </div>
        </button>

        {/* CUSTOMER INFORMATION CARD */}

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-8 py-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <User size={19} className="text-orange-600" />
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
            {!isEditing ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* NAME */}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Full Name
                  </label>

                  <div className="flex items-center gap-3 px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <User size={18} className="text-orange-500 shrink-0" />
                    <span className="text-slate-800 font-medium break-words">
                      {profile.name || "Not provided"}
                    </span>
                  </div>
                </div>

                {/* EMAIL */}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email Address
                  </label>

                  <div className="flex items-center gap-3 px-4 py-3.5 bg-orange-50/50 border border-orange-100 rounded-xl">
                    <Mail size={18} className="text-orange-500 shrink-0" />
                    <span className="text-slate-800 font-medium break-all">
                      {profile.email || "Not provided"}
                    </span>
                  </div>
                </div>

                {/* PHONE */}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Phone Number
                  </label>

                  <div className="flex items-center gap-3 px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <Phone size={18} className="text-orange-500 shrink-0" />
                    <span className="text-slate-800 font-medium">
                      {profile.phone || "Not provided"}
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
                      className="text-orange-500 mt-0.5 shrink-0"
                    />
                    <span className="text-slate-800 font-medium break-words">
                      {profile.address || "Address not added"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* PROFILE PHOTO */}

                <div className="flex flex-col items-center mb-7">
                  <div className="relative">
                    <div className="w-28 h-28 rounded-3xl bg-orange-50 border border-orange-100 p-1.5">
                      {previewImage ? (
                        <img
                          src={previewImage}
                          alt={profile.name || "Customer"}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                          className="w-full h-full object-cover rounded-[20px]"
                        />
                      ) : (
                        <div className="w-full h-full rounded-[20px] bg-orange-50 flex items-center justify-center">
                          {profile.name ? (
                            <span className="text-4xl font-bold text-orange-600">
                              {profile.name.charAt(0).toUpperCase()}
                            </span>
                          ) : (
                            <User size={50} className="text-orange-600" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <label
                    htmlFor="profile_photo"
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 border border-orange-100 rounded-xl text-sm font-semibold cursor-pointer hover:bg-orange-100 transition"
                  >
                    <Camera size={16} />
                    Change Photo
                  </label>

                  <input
                    id="profile_photo"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />

                  <p className="text-xs text-slate-400 mt-2">
                    JPG, PNG, WEBP • Max 2MB
                  </p>
                </div>

                {/* INPUT GRID */}

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
                        maxLength={100}
                        className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50 transition"
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
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        maxLength={150}
                        className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50 transition"
                        placeholder="Enter your email address"
                      />
                    </div>
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
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        maxLength={15}
                        className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50 transition"
                        placeholder="Enter your phone number"
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
                        rows={3}
                        maxLength={500}
                        className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl outline-none resize-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50 transition"
                        placeholder="Enter your address"
                      />
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTONS */}

                <div className="mt-7 pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 transition disabled:opacity-50"
                  >
                    <X size={18} />
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
