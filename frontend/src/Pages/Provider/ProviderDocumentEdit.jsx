// PATH: src/Pages/Provider/ProviderDocumentEdit.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Plus,
  AlertCircle,
} from "lucide-react";
import api from "../../api/axios";
import Swal from "sweetalert2";

const ProviderDocumentEdit = () => {
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================
  const [document, setDocument] = useState(null);
  const [documentType, setDocumentType] = useState("service_license");
  const [documentNumber, setDocumentNumber] = useState("");
  const [existingDocument, setExistingDocument] = useState(null);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hasDocument, setHasDocument] = useState(false);

  // =========================================================
  // LOAD EXISTING DOCUMENT
  // =========================================================
  useEffect(() => {
    fetchProviderData();
  }, []);

  const fetchProviderData = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/provider/profile");

      let providerData = null;
      if (response.data?.data?.provider) {
        providerData = response.data.data.provider;
      } else if (response.data?.provider) {
        providerData = response.data.provider;
      } else if (response.data?.data) {
        providerData = response.data.data;
      } else {
        providerData = response.data;
      }

      if (!providerData) {
        setError("Provider profile not found.");
        setLoading(false);
        return;
      }

      setProvider(providerData);

      let documents = [];
      if (providerData.documents) {
        if (Array.isArray(providerData.documents)) {
          documents = providerData.documents;
        } else if (typeof providerData.documents === "object") {
          documents = Object.values(providerData.documents);
        }
      }

      if (Array.isArray(documents) && documents.length > 0) {
        const documentData = documents[documents.length - 1];
        setExistingDocument(documentData);
        setDocumentType(documentData.document_type || "service_license");
        setDocumentNumber(documentData.document_number || "");
        setHasDocument(true);
      } else {
        setHasDocument(false);
        setExistingDocument(null);

        Swal.fire({
          icon: "info",
          title: "No Document Found",
          text: "Please upload a verification document to proceed.",
          confirmButtonColor: "#0284c7",
        });
      }
    } catch (err) {
      console.error("Provider document fetch error:", err);
      const errorMsg =
        err.response?.data?.message ||
        "Unable to load your verification document.";
      setError(errorMsg);

      Swal.fire({
        icon: "error",
        title: "Error!",
        text: errorMsg,
        confirmButtonColor: "#0284c7",
      });
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // UPLOAD NEW DOCUMENT (First time)
  // =========================================================
  const handleUploadNewDocument = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!document) {
      setError("Please select a document file to upload.");
      return;
    }

    setSaving(true);

    try {
      const user = JSON.parse(localStorage.getItem("user"));

      const formData = new FormData();
      formData.append("user_id", user.id);
      formData.append("document_type", documentType);
      formData.append("document_number", documentNumber || "");
      formData.append("file", document);

      await api.post("/provider/documents", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Document uploaded successfully. Your verification is pending.",
        timer: 2000,
        showConfirmButton: false,
      });

      navigate("/provider/verification");
    } catch (err) {
      console.error("Document upload error:", err);
      let errorMsg = "Document upload failed. Please try again.";

      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const firstError = Object.values(errors)[0]?.[0];
        if (firstError) errorMsg = firstError;
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }

      setError(errorMsg);

      Swal.fire({
        icon: "error",
        title: "Error!",
        text: errorMsg,
        confirmButtonColor: "#0284c7",
      });
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // UPDATE EXISTING DOCUMENT
  // =========================================================
  const handleUpdateDocument = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!existingDocument?.id) {
      setError("Document ID not found. Please try again.");
      return;
    }

    if (!document) {
      setError("Please select a new document file to upload.");
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("document_id", String(existingDocument.id));
      formData.append("document_type", documentType);
      formData.append("document_number", documentNumber || "");
      formData.append("file", document);

      await api.post("/provider/documents/update", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Document updated successfully. Your verification is pending review.",
        timer: 2000,
        showConfirmButton: false,
      });

      navigate("/provider/verification");
    } catch (err) {
      console.error("Document update error:", err);
      let errorMsg = "Document update failed. Please try again.";

      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const firstError = Object.values(errors)[0]?.[0];
        if (firstError) errorMsg = firstError;
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }

      setError(errorMsg);

      Swal.fire({
        icon: "error",
        title: "Error!",
        text: errorMsg,
        confirmButtonColor: "#0284c7",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError("");
    setSuccess("");

    const maxSize = 5 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError("File size must be less than 5MB.");
      e.target.value = "";
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Only JPG, PNG, or PDF files are allowed.");
      e.target.value = "";
      return;
    }

    setDocument(selectedFile);
  };

  const handleBack = () => {
    navigate("/provider/verification");
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center bg-slate-50/60">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <p className="text-[11px] font-semibold text-slate-500">
            Loading verification document...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 p-3 sm:p-5">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* TOP BAR */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="group inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition hover:text-blue-700"
          >
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
            Back to Verification
          </button>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Partner Compliance
          </span>
        </div>

        {/* REJECTION REASON NOTIFICATION */}
        {provider?.rejection_reason && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-800">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <div>
                <p className="font-bold text-rose-900">
                  Previous Submission Rejected
                </p>
                <p className="mt-0.5 leading-relaxed text-rose-700">
                  {provider.rejection_reason}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ERROR / SUCCESS ALERTS */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 px-3.5 py-2 text-xs font-medium text-rose-700">
            <AlertCircle size={14} className="shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3.5 py-2 text-xs font-medium text-emerald-800">
            <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* MAIN FORM CONTAINER */}
        <form
          onSubmit={hasDocument ? handleUpdateDocument : handleUploadNewDocument}
          className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5"
        >
          <div className="mb-4 border-b border-slate-100 pb-3">
            <h1 className="text-base font-bold text-slate-900 sm:text-lg">
              {hasDocument
                ? "Update Verification Document"
                : "Upload Verification Document"}
            </h1>
            <p className="text-xs text-slate-500">
              {hasDocument
                ? "Submit an updated document to resolve verification status."
                : "Upload proof of professional license or identity for account review."}
            </p>
          </div>

          <div className="space-y-3.5">
            {/* DOCUMENT TYPE */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Document Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-2.5 text-xs text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/10"
              >
                <option value="service_license">Service License</option>
                <option value="certificate">Professional Certificate</option>
                <option value="government_id">Government ID (Aadhaar/PAN)</option>
                <option value="business_registration">Business Registration</option>
              </select>
            </div>

            {/* DOCUMENT NUMBER */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Document ID / Number
                <span className="ml-1 text-[10px] text-slate-400">(Optional)</span>
              </label>
              <input
                type="text"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="e.g. LIC-987654 or ID Number"
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/10"
              />
            </div>

            {/* EXISTING DOCUMENT WELL */}
            {existingDocument && (
              <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-2xs">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0 flex-1 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-blue-600">
                      Currently Attached Document
                    </span>
                    <p className="truncate font-semibold text-slate-800">
                      {existingDocument.document_file
                        ? existingDocument.document_file.split("/").pop()
                        : "Stored Document File"}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Status:{" "}
                      <span className="font-semibold capitalize text-slate-600">
                        {existingDocument.status || "Pending Review"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* FILE UPLOAD DROPZONE */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                {hasDocument ? "Upload Replacement Document" : "Upload File"}{" "}
                <span className="text-rose-500">*</span>
              </label>

              <label className="flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-3 text-center transition hover:border-blue-300 hover:bg-sky-50/40">
                <Upload size={18} className="text-blue-600 mb-1" />
                <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[240px]">
                  {document ? document.name : "Select document file"}
                </span>
                <span className="mt-0.5 text-[9px] text-slate-400">
                  JPG, PNG, or PDF (Max 5MB)
                </span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {!document && (
                <p className="mt-1 text-[10px] text-rose-500">
                  Please attach your document file above
                </p>
              )}
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="mt-5 border-t border-slate-100 pt-4">
            <button
              type="submit"
              disabled={saving || !document}
              className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-sky-100/90 text-xs font-bold text-blue-700 shadow-xs transition hover:bg-blue-100 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600" />
                  <span>Submitting Document...</span>
                </>
              ) : (
                <>
                  {hasDocument ? (
                    <CheckCircle2 size={13} />
                  ) : (
                    <Upload size={13} />
                  )}
                  <span>
                    {hasDocument
                      ? "Update & Submit for Verification"
                      : "Upload & Request Verification"}
                  </span>
                </>
              )}
            </button>

            <p className="mt-2.5 text-center text-[10px] text-slate-400">
              Submitting updates your profile verification to{" "}
              <span className="font-semibold text-amber-600">Pending</span> for
              administrative review.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProviderDocumentEdit;