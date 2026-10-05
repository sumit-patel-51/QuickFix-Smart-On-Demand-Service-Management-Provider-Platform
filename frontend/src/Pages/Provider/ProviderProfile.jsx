import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Star,
  Briefcase,
  ShieldCheck,
  Clock,
  Edit3,
  Save,
  X,
  AlertCircle,
  Award,
  Activity,
  BadgeCheck,
  Camera,
  FileText,
  ExternalLink,
} from "lucide-react";
import Swal from "sweetalert2";
import api from "../../api/axios";

const ProviderProfile = () => {
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
  const navigate = useNavigate();

  // Modal state
  const [editModal, setEditModal] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Fetch Profile
  |--------------------------------------------------------------------------
  */

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const response = await api.get("/provider/my-profile");

      if (response.data.success) {
        const data = response.data.data;

        setProfile(data);

        setFormData({
          name: data.name || "",
          phone: data.phone || "",
          address: data.address || "",
        });

        setImagePreview(null);
        setProfileImage(null);
      }
    } catch (error) {
      console.error("Profile fetch error:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error.response?.data?.message ||
          error.message ||
          "Unable to load provider profile.",
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
  | Open Edit Modal
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

  const handleCloseModal = () => {
    if (saving) return;

    setProfileImage(null);
    setImagePreview(null);

    setEditModal(false);
  };

  /*
  |--------------------------------------------------------------------------
  | Handle Text Input
  |--------------------------------------------------------------------------
  */

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Handle Profile Image
  |--------------------------------------------------------------------------
  */

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    // Image type
    if (!file.type.startsWith("image/")) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Image",
        text: "Please select a valid image file.",
      });

      return;
    }

    // Maximum 2MB
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        icon: "warning",
        title: "Image Too Large",
        text: "Profile image must be less than 2MB.",
      });

      return;
    }

    setProfileImage(file);

    const previewUrl = URL.createObjectURL(file);

    setImagePreview(previewUrl);
  };

  /*
  |--------------------------------------------------------------------------
  | Submit Profile
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Name Required",
        text: "Please enter your name.",
      });

      return;
    }

    if (!formData.phone.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Phone Required",
        text: "Please enter your phone number.",
      });

      return;
    }

    try {
      setSaving(true);

      const submitData = new FormData();

      submitData.append("name", formData.name);
      submitData.append("phone", formData.phone);
      submitData.append("address", formData.address);

      // Laravel method spoofing
      submitData.append("_method", "PUT");

      if (profileImage) {
        submitData.append("profile_image", profileImage);
      }

      const response = await api.post("/provider/my-profile", submitData);

      if (response.data.success) {
        const updatedData = response.data.data;

        setProfile(updatedData);

        setFormData({
          name: updatedData.name || "",
          phone: updatedData.phone || "",
          address: updatedData.address || "",
        });

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
              name: updatedData.name,
              phone: updatedData.phone,
              address: updatedData.address,

              profile_image: response.data.data.profile_image,
              profile_image: updatedData.profile_image,
            };

            localStorage.setItem("user", JSON.stringify(updatedUser));

            window.dispatchEvent(new Event("userUpdated"));
          } catch (error) {
            console.log("LocalStorage update error:", error);
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

      let message = error.message || "Unable to update your profile.";
      error.response?.data?.message ||
        error.message ||
        "Unable to update your profile.";

      if (error.errors) {
        const firstError = Object.values(error.errors)[0];
        if (error.response?.data?.errors) {
          const firstError = Object.values(error.response.data.errors)[0];

          if (firstError?.[0]) {
            message = firstError[0];
          }
        }

        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: message,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Verification Badge
  |--------------------------------------------------------------------------
  */

  const getVerificationBadge = () => {
    if (profile.verification_status === "approved") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-100 text-green-700 text-xs font-bold">
          <BadgeCheck size={15} />
          Verified Provider
        </span>
      );
    }

    if (profile.verification_status === "rejected") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-700 text-xs font-bold">
          <AlertCircle size={15} />
          Verification Rejected
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-50 border border-yellow-100 text-yellow-700 text-xs font-bold">
        <Clock size={15} />
        Verification Pending
      </span>
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertCircle size={32} className="text-red-500" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-5">
            Profile Not Found
          </h2>

          <p className="text-slate-500 mt-2">
            We could not load your provider profile.
          </p>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | JSX
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-slate-50">
      {/* =========================================================
          PAGE HEADER
      ========================================================= */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
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
              Manage your provider account and personal information.
            </p>
          </div>

          {/* EDIT BUTTON */}

          <button
            onClick={handleEditProfile}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm hover:shadow-md transition-all"
          >
            <Edit3 size={17} />
            Edit Profile
          </button>
        </div>
      </div>

      {/* =========================================================
          MAIN CONTENT
      ========================================================= */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* =======================================================
            PROFILE SUMMARY
        ======================================================= */}

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
          <div className="p-5 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* PROFILE IMAGE */}

              <div className="shrink-0">
                <div className="relative">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-blue-50 border border-blue-100 p-1.5 shadow-sm">
                    {profile.profile_image ? (
                      <img
                        src={profile.profile_image}
                        alt={profile.name}
                        className="w-full h-full object-cover rounded-[20px]"
                      />
                    ) : (
                      <div className="w-full h-full rounded-[20px] bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                        <User
                          size={55}
                          strokeWidth={1.5}
                          className="text-blue-600"
                        />
                      </div>
                    )}
                  </div>

                  {/* Online Dot */}

                  <span
                    className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-4 border-white ${
                      profile.is_online ? "bg-green-500" : "bg-slate-400"
                    }`}
                  ></span>
                </div>
              </div>

              {/* PROFILE INFORMATION */}

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                    {profile.name}
                  </h2>

                  {getVerificationBadge()}
                </div>

                <p className="text-slate-500 mt-1">
                  Professional Service Provider
                </p>

                <div className="flex flex-wrap items-center gap-3 mt-4">
                  {/* ONLINE STATUS */}

                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
                      profile.is_online
                        ? "bg-green-50 text-green-700 border border-green-100"
                        : "bg-slate-50 text-slate-600 border border-slate-200"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        profile.is_online ? "bg-green-500" : "bg-slate-400"
                      }`}
                    ></span>

                    {profile.is_online
                      ? "Currently Online"
                      : "Currently Offline"}
                  </span>

                  {/* AVAILABILITY */}

                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold">
                    <Activity size={14} />

                    <span className="capitalize">
                      {profile.availability_status || "Offline"}
                    </span>
                  </span>
                </div>
              </div>

              {/* SHIELD */}

              <div className="hidden lg:flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100">
                <ShieldCheck size={32} className="text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* =======================================================
            STAT CARDS
        ======================================================= */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* RATING */}

          <div
            onClick={() => navigate("/provider/reviews")}
            className="group cursor-pointer bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Customer Rating
                </p>

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-3xl font-bold text-slate-900">
                    {Number(profile.rating || 0).toFixed(1)}
                  </span>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={
                            star <= Math.round(Number(profile.rating || 0))
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-slate-200"
                          }
                        />
                      ))}
                    </div>

                    <span className="text-xs text-slate-400 mt-1">
                      Average rating
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-yellow-50 border border-yellow-100 flex items-center justify-center group-hover:scale-105 transition">
                <Star size={27} className="text-yellow-500 fill-yellow-400" />
              </div>
            </div>
          </div>

          {/* JOBS */}

          <div className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Completed Jobs
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {profile.total_jobs || 0}
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  Services successfully completed
                </p>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center group-hover:scale-105 transition">
                <Briefcase size={27} className="text-blue-600" />
              </div>
            </div>
          </div>

          {/* VERIFICATION */}

          <div className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Account Status
                </p>

                <p
                  className={`text-xl font-bold mt-2 capitalize ${
                    profile.verification_status === "approved"
                      ? "text-green-600"
                      : profile.verification_status === "rejected"
                        ? "text-red-600"
                        : "text-yellow-600"
                  }`}
                >
                  {profile.verification_status || "Pending"}
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  Provider verification status
                </p>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center group-hover:scale-105 transition">
                <ShieldCheck size={27} className="text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* =======================================================
            PERSONAL INFORMATION
        ======================================================= */}

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* HEADER */}

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

          {/* INFORMATION */}

          <div className="p-5 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <MapPin size={18} className="text-blue-500 mt-0.5 shrink-0" />

                  <span className="text-slate-800 font-medium">
                    {profile.address || "Address not added"}
                  </span>
                </div>
              </div>
            </div>

            {/* VERIFIED MESSAGE */}

            {profile.verification_status === "approved" &&
              profile.verified_at && (
                <div className="mt-7 p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                      <Award size={20} className="text-green-600" />
                    </div>

                    <div>
                      <p className="font-bold text-green-800">
                        Your Provider Account is Verified
                      </p>

                      <p className="text-sm text-green-700 mt-1">
                        Your account has been successfully verified and you can
                        provide services to customers.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {/* REJECTED MESSAGE */}

            {profile.verification_status === "rejected" &&
              profile.rejection_reason && (
                <div className="mt-7 p-4 rounded-2xl bg-red-50 border border-red-100">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                      <AlertCircle size={20} className="text-red-500" />
                    </div>

                    <div>
                      <p className="font-bold text-red-800">
                        Verification Rejected
                      </p>

                      <p className="text-sm text-red-700 mt-1">
                        {profile.rejection_reason}
                      </p>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* =======================================================
            VERIFICATION DOCUMENTS
        ======================================================= */}

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mt-6">
          {/* HEADER */}

          <div className="px-5 sm:px-8 py-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <FileText size={20} className="text-blue-600" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Verification Documents
                </h2>

                <p className="text-sm text-slate-500">
                  Documents submitted for provider verification
                </p>
              </div>
            </div>
          </div>

          {/* DOCUMENT CONTENT */}

          <div className="p-5 sm:p-8">
            {profile.documents?.length > 0 ? (
              <div className="space-y-4">
                {profile.documents.map((document) => (
                  <div
                    key={document.id}
                    className="border border-slate-200 rounded-2xl p-5 hover:shadow-sm transition"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                      {/* DOCUMENT INFO */}

                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                          <FileText size={22} className="text-blue-600" />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-900 capitalize">
                              {document.document_type?.replace(/_/g, " ")}
                            </h3>

                            {/* DOCUMENT STATUS */}

                            {document.status === "approved" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 border border-green-100 text-green-700 text-xs font-bold">
                                <BadgeCheck size={13} />
                                Approved
                              </span>
                            )}

                            {document.status === "rejected" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 border border-red-100 text-red-700 text-xs font-bold">
                                <AlertCircle size={13} />
                                Rejected
                              </span>
                            )}

                            {(!document.status ||
                              document.status === "pending") && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-50 border border-yellow-100 text-yellow-700 text-xs font-bold">
                                <Clock size={13} />
                                Pending
                              </span>
                            )}
                          </div>

                          {/* DOCUMENT NUMBER */}

                          {document.document_number && (
                            <p className="text-sm text-slate-500 mt-2">
                              <span className="font-medium text-slate-700">
                                Document Number:
                              </span>{" "}
                              {document.document_number}
                            </p>
                          )}

                          {/* VERIFIED DATE */}

                          {document.status === "approved" &&
                            document.verified_at && (
                              <p className="text-xs text-green-600 mt-2 font-medium">
                                Document verified successfully
                              </p>
                            )}

                          {/* REJECTION REASON */}

                          {document.status === "rejected" &&
                            document.rejection_reason && (
                              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-100">
                                <p className="text-xs font-bold text-red-700">
                                  Rejection Reason
                                </p>

                                <p className="text-sm text-red-600 mt-1">
                                  {document.rejection_reason}
                                </p>
                              </div>
                            )}
                        </div>
                      </div>

                      {/* VIEW DOCUMENT */}

                      {document.document_file && (
                        <a
                          href={document.document_file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition"
                        >
                          <ExternalLink size={16} />
                          View Document
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* NO DOCUMENT */

              <div className="text-center py-10">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center">
                  <FileText size={30} className="text-slate-400" />
                </div>

                <h3 className="text-lg font-bold text-slate-900 mt-4">
                  No Verification Document
                </h3>

                <p className="text-sm text-slate-500 mt-2">
                  You have not uploaded any verification document yet.
                </p>

                {/* UPLOAD ONLY IF ACCOUNT IS NOT APPROVED */}

                {profile.verification_status !== "approved" && (
                  <button
                    type="button"
                    onClick={() => navigate("/provider/documents/edit")}
                    className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition"
                  >
                    <FileText size={17} />
                    Upload Document
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================
          EDIT PROFILE MODAL
      ========================================================= */}

      {editModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModal();
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
                onClick={handleCloseModal}
                disabled={saving}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* MODAL FORM */}

            <form onSubmit={handleSubmit}>
              <div className="p-6 sm:p-8">
                {/* PROFILE PHOTO */}

                <div className="flex flex-col items-center mb-7">
                  <div className="relative">
                    <div className="w-28 h-28 rounded-3xl bg-blue-50 border border-blue-100 p-1.5">
                      {imagePreview || profile.profile_image ? (
                        <img
                          src={imagePreview || profile.profile_image}
                          alt={profile.name}
                          className="w-full h-full object-cover rounded-[20px]"
                        />
                      ) : (
                        <div className="w-full h-full rounded-[20px] bg-blue-50 flex items-center justify-center">
                          <User size={50} className="text-blue-600" />
                        </div>
                      )}
                    </div>
                  </div>

                  <label
                    htmlFor="modal_profile_image"
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl text-sm font-semibold cursor-pointer hover:bg-blue-100 transition"
                  >
                    <Camera size={16} />
                    Change Photo
                  </label>

                  <input
                    id="modal_profile_image"
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
                      Email cannot be changed.
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

              {/* MODAL FOOTER */}

              <div className="px-6 sm:px-8 py-5 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 transition disabled:opacity-50"
                >
                  <X size={18} />
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition disabled:opacity-60"
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
    </div>
  );
};

export default ProviderProfile;
