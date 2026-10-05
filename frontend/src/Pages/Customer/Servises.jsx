import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import {
  Wrench,
  Zap,
  Droplets,
  Monitor,
  Tv,
  Sparkles,
  Hammer,
  MoreHorizontal,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await api.get("/services");
      setServices(response.data.data || []);
    } catch (error) {
      console.error(error);
      setError("Unable to load services. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getServiceIcon = (service) => {
    const name = service.name?.toLowerCase() || "";
    const category = service.category?.toLowerCase() || "";

    if (name.includes("ac") || name.includes("air")) return Wrench;
    if (name.includes("electric") || category.includes("electrical"))
      return Zap;
    if (name.includes("plumb") || category.includes("plumb")) return Droplets;
    if (
      name.includes("laptop") ||
      name.includes("computer") ||
      category.includes("computer")
    )
      return Monitor;
    if (
      name.includes("tv") ||
      name.includes("television") ||
      category.includes("electronics")
    )
      return Tv;
    if (name.includes("clean") || category.includes("clean")) return Sparkles;
    if (name.includes("carpenter") || category.includes("home maintenance"))
      return Hammer;

    return MoreHorizontal;
  };

  return (
    <main className="relative min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-5rem)] w-full overflow-x-hidden bg-slate-50/50 px-3.5 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col">
        {/* =================================
            HEADER SECTION
        ================================= */}
        <section className="mb-4 sm:mb-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-2xl">
                All Services
              </h1>
              <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                Choose a service and we'll find nearby providers.
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-xs">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>Verified Experts</span>
            </div>
          </div>
        </section>

        {/* =================================
            LOADING SKELETON
        ================================= */}
        {loading && (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div
                key={item}
                className="h-32 w-full animate-pulse rounded-xl bg-slate-200/70"
              />
            ))}
          </div>
        )}

        {/* =================================
            ERROR STATE
        ================================= */}
        {!loading && error && (
          <div className="w-full rounded-xl border border-red-100 bg-red-50 p-4 text-center sm:p-5">
            <p className="text-xs text-red-600 sm:text-sm">{error}</p>
            <button
              type="button"
              onClick={fetchServices}
              className="mt-3 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* =================================
            COMPACT SERVICES GRID
        ================================= */}
        {!loading && !error && services.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-4">
            {services.map((service) => {
              const Icon = getServiceIcon(service);

              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() =>
                    navigate(`/customer/services/${service.id}/request`)
                  }
                  className="group flex min-h-[140px] w-full flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-3 text-left shadow-xs transition duration-150 hover:border-blue-200 hover:shadow-md active:scale-[0.98] sm:p-4"
                >
                  {/* Icon */}
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white sm:h-10 sm:w-10">
                    <Icon
                      size={16}
                      className="sm:h-[18px] sm:w-[18px]"
                      strokeWidth={2}
                    />
                  </div>

                  {/* Content */}
                  <div className="w-full">
                    <h2 className="truncate text-xs font-semibold text-slate-900 group-hover:text-blue-600 sm:text-sm">
                      {service.name}
                    </h2>
                    <p className="mt-0.5 truncate text-[10px] text-slate-400 sm:text-[11px]">
                      {service.category}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mt-2 w-full border-t border-slate-100 pt-1.5 sm:pt-2">
                    <p className="text-[9px] text-slate-400 sm:text-[10px]">
                      Starting from
                    </p>
                    <p className="text-xs font-bold text-slate-900 sm:text-sm">
                      ₹{service.base_price}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* =================================
            EMPTY STATE
        ================================= */}
        {!loading && !error && services.length === 0 && (
          <div className="w-full rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center sm:p-8">
            <h3 className="text-xs font-semibold text-slate-900 sm:text-sm">
              No services available
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Please check back later.
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

export default Services;
