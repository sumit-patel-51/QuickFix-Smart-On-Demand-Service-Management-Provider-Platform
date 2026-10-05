import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Search,
  Wrench,
  Zap,
  Droplets,
  Monitor,
  Tv,
  Sparkles,
  Hammer,
} from "lucide-react";

import api from "../../api/axios";

const CustomerDashboard = () => {
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | User
  |--------------------------------------------------------------------------
  */

  const user = JSON.parse(localStorage.getItem("user")) || {};

  /*
  |--------------------------------------------------------------------------
  | Services
  |--------------------------------------------------------------------------
  */

  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");

  const [loadingServices, setLoadingServices] = useState(true);
  const [serviceError, setServiceError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Greeting
  |--------------------------------------------------------------------------
  */

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) {
      return "Good Morning";
    }

    if (hour < 18) {
      return "Good Afternoon";
    }

    return "Good Evening";
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Service Icons
  |--------------------------------------------------------------------------
  */

  const serviceIcons = {
    electrician: Zap,
    electrical: Zap,

    plumber: Droplets,
    plumbing: Droplets,

    ac: Sparkles,
    "ac repair": Sparkles,

    appliance: Tv,
    tv: Tv,

    computer: Monitor,
    laptop: Monitor,

    carpenter: Hammer,
    carpentry: Hammer,

    repair: Wrench,
  };

  /*
  |--------------------------------------------------------------------------
  | Fetch Services
  |--------------------------------------------------------------------------
  */

  const fetchServices = async () => {
    try {
      setLoadingServices(true);
      setServiceError("");

      const response = await api.get("/services");

      const serviceData = response.data?.data || response.data?.services || [];

      setServices(Array.isArray(serviceData) ? serviceData : []);
    } catch (error) {
      console.error("Fetch Services Error:", error);

      setServiceError(
        error.response?.data?.message || "Unable to load services.",
      );
    } finally {
      setLoadingServices(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Load Services
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    fetchServices();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Filter Services
  |--------------------------------------------------------------------------
  |
  | Dashboard shows maximum 4 services.
  |
  */

  const filteredServices = useMemo(() => {
    return services
      .filter((service) => {
        const serviceName = service.name || service.service_name || "";

        return serviceName.toLowerCase().includes(search.toLowerCase());
      })
      .slice(0, 4);
  }, [services, search]);

  /*
  |--------------------------------------------------------------------------
  | Get Service Icon
  |--------------------------------------------------------------------------
  */

  const getServiceIcon = (service) => {
    const name = (service.name || service.service_name || "").toLowerCase();

    const matchedKey = Object.keys(serviceIcons).find((key) =>
      name.includes(key),
    );

    return matchedKey ? serviceIcons[matchedKey] : Wrench;
  };

  /*
  |--------------------------------------------------------------------------
  | Service Click
  |--------------------------------------------------------------------------
  |
  | Open Service Request form with selected service ID.
  |
  */

  const handleServiceClick = (service) => {
    navigate(`/customer/services/${service.id}`);
  };

  /*
  |--------------------------------------------------------------------------
  | View All Services
  |--------------------------------------------------------------------------
  */

  const handleViewAllServices = () => {
    navigate("/customer/services");
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-slate-50/60">
      {/* ================================================================
          HEADER
      ================================================================ */}

      <div className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            {/* ----------------------------------------------------------
                Greeting
            ---------------------------------------------------------- */}

            <div>
              <p className="mb-1 text-sm font-medium text-slate-400">
                {greeting}
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Hello, {user?.name || "Customer"} 👋
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Find the service you need.
              </p>
            </div>

            {/* ----------------------------------------------------------
                Search
            ---------------------------------------------------------- */}

            <div className="relative w-full md:w-80">
              <Search
                size={20}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          MAIN CONTENT
      ================================================================ */}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ==============================================================
            SERVICES
        ============================================================== */}

        <section>
          {/* ------------------------------------------------------------
              Section Header
          ------------------------------------------------------------ */}

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                What service do you need?
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select a service to request a service provider.
              </p>
            </div>

            {/* ----------------------------------------------------------
                View All Services
            ---------------------------------------------------------- */}

            <button
              type="button"
              onClick={handleViewAllServices}
              className="whitespace-nowrap text-sm font-semibold text-orange-600 transition hover:text-orange-700 hover:underline"
            >
              View All Services →
            </button>
          </div>

          {/* ------------------------------------------------------------
              Error
          ------------------------------------------------------------ */}

          {serviceError && (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm font-medium text-rose-700">
              {serviceError}
            </div>
          )}

          {/* ------------------------------------------------------------
              Loading
          ------------------------------------------------------------ */}

          {loadingServices ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-36 rounded-2xl border border-slate-200/80 bg-slate-200/50 animate-pulse"
                />
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            /* ----------------------------------------------------------
                No Services
            ---------------------------------------------------------- */

            <div className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center shadow-sm">
              <Wrench size={40} className="mx-auto mb-3 text-slate-300" />

              <h3 className="font-semibold text-slate-900">
                No services found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Try searching for another service.
              </p>
            </div>
          ) : (
            /* ----------------------------------------------------------
                Services
            ---------------------------------------------------------- */

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {filteredServices.map((service) => {
                const Icon = getServiceIcon(service);

                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleServiceClick(service)}
                    className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-1 hover:border-orange-300 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] active:scale-[0.98]"
                  >
                    {/* Service Icon */}

                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition-colors group-hover:bg-orange-100">
                      <Icon size={24} />
                    </div>

                    {/* Service Name */}

                    <h3 className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                      {service.name || service.service_name || "Service"}
                    </h3>

                    {/* Description */}

                    <p className="mt-1 text-xs text-slate-500">
                      Request this service
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default CustomerDashboard;
