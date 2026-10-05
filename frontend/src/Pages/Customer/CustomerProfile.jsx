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
} from "lucide-react";
import Swal from "sweetalert2";
import api from "../../api/axios";

const CustomerProfile = () => {
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

      const response = await api.get("/user/profile");

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

      if (profileData.profile_photo) {
        setPreviewImage(profileData.profile_photo);
      }
    } catch (error) {
      console.error("Profile Error:", error);

      // Fallback to localStorage
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

        if (profileData.profile_photo) {
          setPreviewImage(profileData.profile_photo);
        }
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

      return;
    }

    setProfileImage(file);

    const imageUrl = URL.createObjectURL(file);

    setPreviewImage(imageUrl);
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

      if (!result.isConfirmed) {
        return;
      }
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

    // Basic frontend validation
    if (!formData.name.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Name Required",
        text: "Please enter your full name.",
        confirmButtonText: "OK",
        confirmButtonColor: "#fb8c00",
      });

      return;
    }

    if (!formData.email.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Email Required",
        text: "Please enter your email address.",
        confirmButtonText: "OK",
        confirmButtonColor: "#fb8c00",
      });

      return;
    }

    if (!formData.phone.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Phone Required",
        text: "Please enter your phone number.",
        confirmButtonText: "OK",
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
        "/user/profile/update",
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

      // Update profile state
      setProfile(updatedProfile);

      // Update form state
      setFormData({
        name: updatedProfile.name,
        email: updatedProfile.email,
        phone: updatedProfile.phone,
        address: updatedProfile.address,
      });

      // Update profile image
      if (updatedProfile.profile_photo) {
        setPreviewImage(updatedProfile.profile_photo);
      }

      // Update localStorage
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

      setProfileImage(null);
      setIsEditing(false);

      // =================================================
      // SUCCESS SWEETALERT
      // =================================================

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

      // =================================================
      // VALIDATION ERROR
      // =================================================

      if (error.response?.status === 422) {
        const errors = error.response?.data?.errors;

        if (errors) {
          const errorMessages = Object.values(errors)
            .flat()
            .join("\n");

          Swal.fire({
            icon: "error",
            title: "Validation Error",
            text: errorMessages,
            confirmButtonText: "OK",
            confirmButtonColor: "#dc2626",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Validation Error",
            text:
              error.response?.data?.message ||
              "Please check your information.",
            confirmButtonText: "OK",
            confirmButtonColor: "#dc2626",
          });
        }

        return;
      }

      // =================================================
      // UNAUTHORIZED
      // =================================================

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

      // =================================================
      // GENERAL ERROR
      // =================================================

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
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-2 text-blue-600">
          <Loader2
            size={22}
            className="animate-spin"
          />

          <span className="text-sm font-medium">
            Loading profile...
          </span>
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">

        {/* PAGE HEADER */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            My Profile
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your personal information
          </p>
        </div>

        {/* MAIN PROFILE CARD */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* PROFILE HEADER */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-100 px-6 py-8 sm:px-8">
            <div className="flex flex-col items-center gap-5 sm:flex-row">

              {/* PROFILE PHOTO */}
              <div className="relative">

                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-blue-100 text-3xl font-bold text-blue-600 shadow-lg">

                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : profile.name ? (
                    profile.name
                      .charAt(0)
                      .toUpperCase()
                  ) : (
                    <User size={45} />
                  )}

                </div>

                {isEditing && (
                  <label
                    htmlFor="profile_photo"
                    className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-md transition hover:bg-blue-700"
                  >
                    <Camera size={17} />

                    <input
                      id="profile_photo"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}

              </div>

              {/* USER NAME */}
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-bold text-white">
                  {profile.name || "Customer"}
                </h2>

                <p className="mt-1 text-sm text-blue-100">
                  Customer
                </p>

                {profile.is_verified && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
                    <CheckCircle size={14} />
                    Verified Customer
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* PERSONAL INFORMATION */}
          <div className="p-6 sm:p-8">

            <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-5">

              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Personal Information
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Your basic account information
                </p>
              </div>

              {!isEditing && (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 active:scale-[0.98]"
                >
                  <Edit3 size={16} />
                  Edit Profile
                </button>
              )}

            </div>

            {/* =================================================
                VIEW MODE
            ================================================= */}

            {!isEditing && (
              <div className="grid gap-5 sm:grid-cols-2">

                {/* NAME */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">

                  <div className="mb-2 flex items-center gap-2 text-gray-400">
                    <User size={17} />

                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Full Name
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-gray-900">
                    {profile.name || "Not provided"}
                  </p>

                </div>

                {/* EMAIL */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">

                  <div className="mb-2 flex items-center gap-2 text-gray-400">
                    <Mail size={17} />

                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Email Address
                    </span>
                  </div>

                  <p className="break-all text-sm font-semibold text-gray-900">
                    {profile.email || "Not provided"}
                  </p>

                </div>

                {/* PHONE */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">

                  <div className="mb-2 flex items-center gap-2 text-gray-400">
                    <Phone size={17} />

                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Phone Number
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-gray-900">
                    {profile.phone || "Not provided"}
                  </p>

                </div>

                {/* ADDRESS */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">

                  <div className="mb-2 flex items-center gap-2 text-gray-400">
                    <MapPin size={17} />

                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Address
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-gray-900">
                    {profile.address || "Not provided"}
                  </p>

                </div>

              </div>
            )}

            {/* =================================================
                EDIT MODE
            ================================================= */}

            {isEditing && (
              <form onSubmit={handleSubmit}>

                <div className="grid gap-5 sm:grid-cols-2">

                  {/* FULL NAME */}
                  <div>

                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Full Name
                    </label>

                    <div className="relative">

                      <User
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />

                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        maxLength={100}
                        className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        placeholder="Enter your full name"
                      />

                    </div>

                  </div>

                  {/* EMAIL */}
                  <div>

                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Email Address
                    </label>

                    <div className="relative">

                      <Mail
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />

                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        maxLength={150}
                        className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        placeholder="Enter your email"
                      />

                    </div>

                  </div>

                  {/* PHONE */}
                  <div>

                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Phone Number
                    </label>

                    <div className="relative">

                      <Phone
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />

                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        maxLength={15}
                        className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        placeholder="Enter your phone number"
                      />

                    </div>

                  </div>

                  {/* ADDRESS */}
                  <div>

                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Address
                    </label>

                    <div className="relative">

                      <MapPin
                        size={18}
                        className="absolute left-3 top-3.5 text-gray-400"
                      />

                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows={3}
                        maxLength={500}
                        className="w-full resize-none rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        placeholder="Enter your address"
                      />

                    </div>

                  </div>

                </div>

                {/* ACTION BUTTONS */}
                <div className="mt-7 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">

                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X size={17} />
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={17} />
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