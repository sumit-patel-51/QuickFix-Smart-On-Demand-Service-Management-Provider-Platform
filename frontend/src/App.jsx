import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Landing from "./Pages/Landing";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import AdminLogin from "./Pages/AdminLogin";

import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import ProviderProtectedRoute from "./components/ProviderProtectedRoute";

// ==========================================
// ADMIN
// ==========================================

import AdminLayout from "./components/Admin/AdminLayout";
import AdminDashboard from "./Pages/Admin/AdminDashboard";
import AdminUsers from "./Pages/Admin/AdminUsers";
import Providers from "./Pages/Admin/Providers";
import AdminServices from "./Pages/Admin/Services";
import ServiceRequests from "./Pages/Admin/ServiceRequests";

// ==========================================
// CUSTOMER
// ==========================================

import CustomerLayout from "./components/Customer/CustomerLayout";
import CustomerDashboard from "./Pages/Customer/CustomerDashboard";
import CustomerProfile from "./Pages/Customer/CustomerProfile";
import Services from "./Pages/Customer/Services";
import ServiceRequest from "./Pages/Customer/ServiceRequest";
import MyRequests from "./Pages/Customer/MyRequests";
import RequestDetails from "./Pages/Customer/RequestDetails";
import MyBookings from "./Pages/Customer/MyBookings";
import ServiceDetails from "./Pages/Customer/ServiceDetails";
import Settings from "./Pages/Customer/Settings";

// ==========================================
// PROVIDER
// ==========================================

import ProviderLayout from "./components/Provider/ProviderLayout";

import ProviderRegister from "./Pages/Provider/ProviderRegister";
import ProviderLogin from "./Pages/Provider/ProviderLogin";
import ProviderDashboard from "./Pages/Provider/ProviderDashboard";
import ProviderSetup from "./Pages/Provider/ProviderSetup";
import ProviderVerificationPending from "./Pages/Provider/ProviderVerificationPending";
import ProviderDocumentEdit from "./Pages/Provider/ProviderDocumentEdit";
import MyServices from "./Pages/Provider/MyServices";
import AddService from "./Pages/Provider/AddService";
import EditService from "./Pages/Provider/EditService";
import ProviderRequests from "./Pages/Provider/ProviderRequests";
import ProviderRequestDetails from "./Pages/Provider/ProviderRequestDetails";
import ProviderProfile from "./Pages/Provider/ProviderProfile";
import ProviderBookings from "./Pages/Provider/ProviderBookings";
import ProviderReviews from "./Pages/Provider/ProviderReviews";
import ProviderSettings from "./Pages/Provider/Settings";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ============================================ */}
        {/* LANDING PAGE - Default Route */}
        {/* ============================================ */}
        <Route path="/" element={<Landing />} />

        {/* =================================================
            CUSTOMER AUTH
        ================================================= */}

        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />

        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />

        {/* =================================================
            ADMIN LOGIN
        ================================================= */}

        <Route
          path="/admin/login"
          element={
            <GuestRoute>
              <AdminLogin />
            </GuestRoute>
          }
        />

        {/* =================================================
            CUSTOMER ROUTES
        ================================================= */}

        <Route
          element={
            <ProtectedRoute allowedRoles={["customer", "user"]}>
              <CustomerLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<CustomerDashboard />} />

          <Route path="/customer/profile" element={<CustomerProfile />} />

          <Route path="/customer/services" element={<Services />} />

          <Route path="/customer/services/:id" element={<ServiceDetails />} />

          <Route
            path="/customer/services/:serviceId/request"
            element={<ServiceRequest />}
          />

          <Route path="/customer/my-requests" element={<MyRequests />} />

          <Route
            path="/customer/service-requests/:id"
            element={<RequestDetails />}
          />

          <Route path="/customer/bookings" element={<MyBookings />} />

          <Route path="/customer/settings" element={<Settings />} />
        </Route>

        {/* =================================================
            PROVIDER AUTH
        ================================================= */}

        <Route
          path="/provider/register"
          element={
            <GuestRoute>
              <ProviderRegister />
            </GuestRoute>
          }
        />

        <Route
          path="/provider/login"
          element={
            <GuestRoute>
              <ProviderLogin />
            </GuestRoute>
          }
        />

        {/* =================================================
            PROVIDER VERIFICATION
        ================================================= */}

        {/* provider verification */}
        <Route
          path="/provider/verification"
          element={
            <ProviderProtectedRoute allowUnverified={true}>
              <ProviderVerificationPending />
            </ProviderProtectedRoute>
          }
        />

        <Route
          path="/provider/documents/edit"
          element={
            <ProviderProtectedRoute allowUnverified={true}>
              <ProviderDocumentEdit />
            </ProviderProtectedRoute>
          }
        />

        <Route
          path="/provider/setup"
          element={
            <ProviderProtectedRoute allowUnverified={true}>
              <ProviderSetup />
            </ProviderProtectedRoute>
          }
        />

        {/* =================================================
            PROVIDER PANEL
        ================================================= */}

        <Route
          element={
            <ProtectedRoute allowedRoles={["provider"]}>
              <ProviderLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}

          <Route
            path="/provider/dashboard"
            element={
              <ProviderProtectedRoute>
                <ProviderDashboard />
              </ProviderProtectedRoute>
            }
          />

          {/* Provider Services */}

          {/* <Route
            path="/provider/setup"
            element={<ProviderSetup />}
          /> */}

          <Route path="/provider/services" element={<MyServices />} />

          <Route path="/provider/services/add" element={<AddService />} />

          <Route path="/provider/services/edit/:id" element={<EditService />} />

          {/* Service Requests */}

          <Route path="/provider/requests" element={<ProviderRequests />} />

          <Route
            path="/provider/service-requests/:id"
            element={<ProviderRequestDetails />}
          />

          {/* Provider Profile */}
          <Route path="/provider/profile" element={<ProviderProfile />} />
          <Route
            path="/provider/reviews"
            element={
              <ProviderProtectedRoute>
                <ProviderReviews />
              </ProviderProtectedRoute>
            }
          />

          {/* Bookings */}

          <Route path="/provider/bookings" element={<ProviderBookings />} />

          {/* Earnings */}

          <Route
            path="/provider/earnings"
            element={
              <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6">
                <div className="mx-auto max-w-7xl">
                  <h1 className="text-2xl font-bold text-slate-900">
                    Earnings
                  </h1>

                  <p className="mt-2 text-sm text-slate-500">
                    Track your earnings here.
                  </p>
                </div>
              </div>
            }
          />

          {/* Settings */}

       <Route path="/provider/settings" element={<ProviderSettings />} />

          {/* Help */}

          <Route
            path="/provider/help"
            element={
              <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6">
                <div className="mx-auto max-w-7xl">
                  <h1 className="text-2xl font-bold text-slate-900">
                    Help & Support
                  </h1>
                </div>
              </div>
            }
          />
        </Route>

        {/* =================================================
            ADMIN ROUTES
        ================================================= */}

        <Route
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          <Route path="/admin/users" element={<AdminUsers />} />

          <Route path="/admin/providers" element={<Providers />} />

           <Route path="/admin/services" element={<AdminServices />} />

           <Route  path="/admin/requests" element={<ServiceRequests />} />
        </Route>

        {/* =================================================
            FALLBACK
        ================================================= */}

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
