import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const ProviderSetup = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);

  const [document, setDocument] = useState(null);
  const [documentType, setDocumentType] = useState("service_license");
  const [documentNumber, setDocumentNumber] = useState("");

  const [loadingServices, setLoadingServices] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // GET SERVICES
  // ==========================================

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
       const response = await api.get(
      "/provider/available-services"
    );

      /*
       * Adjust this only if your existing API
       * returns services in a different structure.
       */
      setServices(response.data.services || response.data.data || []);
    } catch (error) {
      console.error("Services error:", error);

      setError("Unable to load services.");
    } finally {
      setLoadingServices(false);
    }
  };

  // ==========================================
  // SERVICE SELECTION
  // ==========================================

  const toggleService = (serviceId) => {
    setSelectedServices((previous) => {
      if (previous.includes(serviceId)) {
        return previous.filter((id) => id !== serviceId);
      }

      return [...previous, serviceId];
    });
  };

  // ==========================================
  // STEP 1 → STEP 2
  // ==========================================

 const handleServicesContinue = async () => {
  if (selectedServices.length === 0) {
    setError("Please select at least one service.");
    return;
  }

  setError("");
  setLoading(true);

  try {
    const user = JSON.parse(localStorage.getItem("user"));

    await api.post("/provider/select-services", {
      user_id: user.id,
      service_ids: selectedServices,
    });

    setStep(2);
  } catch (error) {
    console.error("Service selection error:", error);

    const errors = error.response?.data?.errors;

    if (errors) {
      const firstError = Object.values(errors)[0]?.[0];

      setError(firstError || "Unable to save services.");
    } else {
      setError(
        error.response?.data?.message ||
          "Unable to save services."
      );
    }
  } finally {
    setLoading(false);
  }
};

  // ==========================================
  // DOCUMENT UPLOAD
  // ==========================================

  const handleDocumentSubmit = async (e) => {
    e.preventDefault();

    if (!document) {
      setError("Please select a document.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem("user"));

      const formData = new FormData();

      formData.append("user_id", user.id);

      formData.append("document_type", documentType);

      formData.append("document_number", documentNumber);

      formData.append("file", document);

      await api.post("/provider/documents", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Verification submitted
      navigate("/provider/verification");
    } catch (error) {
      console.error(error);

      const errors = error.response?.data?.errors;

      if (errors) {
        const firstError = Object.values(errors)[0]?.[0];

        setError(firstError || "Document upload failed.");
      } else {
        setError(error.response?.data?.message || "Document upload failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        {/* HEADER */}

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Complete Your Provider Profile
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Just a few steps before you can start receiving service requests.
          </p>
        </div>

        {/* PROGRESS */}

        <div className="mb-8 flex items-center justify-center">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
              step >= 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
            }`}
          >
            1
          </div>

          <div
            className={`h-1 w-24 ${step >= 2 ? "bg-blue-600" : "bg-gray-200"}`}
          />

          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
              step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
            }`}
          >
            2
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ================================= */}
        {/* STEP 1 */}
        {/* ================================= */}

        {step === 1 && (
          <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-gray-900">
              Select Your Services
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Choose the services you provide.
            </p>

            {loadingServices ? (
              <div className="py-12 text-center text-gray-500">
                Loading services...
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {services.map((service) => {
                  const selected = selectedServices.includes(service.id);

                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => toggleService(service.id)}
                      className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${
                        selected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {service.name}
                        </h3>

                        {service.description && (
                          <p className="mt-1 text-xs text-gray-500">
                            {service.description}
                          </p>
                        )}
                      </div>

                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-md border ${
                          selected
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {selected && "✓"}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={handleServicesContinue}
              disabled={loading || selectedServices.length === 0}
              className="mt-8 h-12 w-full rounded-xl bg-blue-600 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </div>
        )}

        {/* ================================= */}
        {/* STEP 2 */}
        {/* ================================= */}

        {step === 2 && (
          <form
            onSubmit={handleDocumentSubmit}
            className="rounded-2xl bg-white p-6 shadow-sm sm:p-8"
          >
            <h2 className="text-xl font-bold text-gray-900">
              Verification Document
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Upload a valid document to verify your professional account.
            </p>

            {/* DOCUMENT TYPE */}

            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Document Type
              </label>

              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="service_license">Service License</option>

                <option value="certificate">Professional Certificate</option>

                <option value="government_id">Government ID</option>

                <option value="business_registration">
                  Business Registration
                </option>
              </select>
            </div>

            {/* DOCUMENT NUMBER */}

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Document Number
                <span className="ml-1 text-gray-400">(Optional)</span>
              </label>

              <input
                type="text"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="Enter document number"
                className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {/* FILE */}

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Upload Document
              </label>

              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-8 text-center transition hover:border-blue-400 hover:bg-blue-50/30">
                <div className="text-3xl">📄</div>

                <p className="mt-3 text-sm font-medium text-gray-700">
                  {document ? document.name : "Choose your document"}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  JPG, PNG or PDF • Max 5MB
                </p>

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => setDocument(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={loading}
              className="mt-8 h-12 w-full rounded-xl bg-blue-600 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit for Verification"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProviderSetup;
