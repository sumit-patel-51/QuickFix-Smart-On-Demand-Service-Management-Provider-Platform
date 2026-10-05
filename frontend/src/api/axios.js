// PATH: src/api/axios.js

import axios from "axios";

// Create axios instance with default config
const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api",
    headers: {
        //"Content-Type": "application/json",
        Accept: "application/json",
    },
    timeout: 30000,
});

// Flag to prevent multiple token refresh requests
let isRefreshing = false;
let failedQueue = [];

// Process failed requests queue
const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// ============================
// REQUEST INTERCEPTOR
// ============================
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user") || "{}");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (user && user.role) {
            config.headers["X-User-Role"] = user.role;
        }

        if (process.env.NODE_ENV === "development") {
            console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
        }

        return config;
    },
    (error) => {
        console.error("❌ Request Error:", error);
        return Promise.reject(error);
    }
);

// ============================
// RESPONSE INTERCEPTOR
// ============================
api.interceptors.response.use(
    (response) => {
        if (process.env.NODE_ENV === "development") {
            console.log(`✅ API Response: ${response.config.url}`, response.data);
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (process.env.NODE_ENV === "development") {
            console.error("❌ API Error:", error.response?.status, error.response?.data);
        }

        // Handle network errors
        if (!error.response) {
            return Promise.reject({
                success: false,
                message: "Network error. Please check your internet connection.",
                status: 0,
            });
        }

        const status = error.response.status;
        const data = error.response.data;

        // ============================
        // 401 Unauthorized - Token expired or invalid
        // ============================
        if (status === 401 && !originalRequest._retry) {
            // ✅ FIXED: For login endpoints, just reject the error - NO REDIRECT
            if (originalRequest.url === "/login" || originalRequest.url === "/admin/login") {
                // ❌ REMOVED: localStorage.removeItem and redirect
                // ✅ Just reject the error so the login page can handle it
                return Promise.reject(error);
            }

            // For other endpoints, try to refresh token or redirect
            // Prevent multiple refresh requests
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = localStorage.getItem("refresh_token");
                
                if (!refreshToken) {
                    handleLogout();
                    return Promise.reject(error);
                }

                const response = await axios.post(
                    `${api.defaults.baseURL}/refresh-token`,
                    { refresh_token: refreshToken },
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                        },
                    }
                );

                const { token, refresh_token } = response.data.data || {};

                if (token) {
                    localStorage.setItem("token", token);
                    if (refresh_token) {
                        localStorage.setItem("refresh_token", refresh_token);
                    }

                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    processQueue(null, token);
                    return api(originalRequest);
                } else {
                    throw new Error("No token received");
                }
            } catch (refreshError) {
                processQueue(refreshError, null);
                handleLogout();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // ============================
        // 403 Forbidden - Insufficient permissions
        // ============================
        if (status === 403) {
            // ✅ FIXED: For admin login, just reject the error - NO REDIRECT
            if (originalRequest.url === "/admin/login") {
                // ❌ REMOVED: redirect to unauthorized
                return Promise.reject(error);
            }

            const user = JSON.parse(localStorage.getItem("user") || "{}");
            
            if (user.role !== "admin" && window.location.pathname.includes("/admin")) {
                window.location.href = "/unauthorized";
                return Promise.reject({
                    success: false,
                    message: "You don't have permission to access this resource.",
                    status: 403,
                });
            }
        }

        // ============================
        // 404 Not Found
        // ============================
        if (status === 404) {
            return Promise.reject({
                success: false,
                message: data.message || "Resource not found.",
                status: 404,
            });
        }

        // ============================
        // 422 Validation Error
        // ============================
        if (status === 422) {
            const errors = data.errors || {};
            const firstError = Object.values(errors)[0]?.[0] || data.message || "Validation failed.";
            
            return Promise.reject({
                success: false,
                message: firstError,
                errors: errors,
                status: 422,
            });
        }

        // ============================
        // 500 Server Error
        // ============================
        if (status >= 500) {
            return Promise.reject({
                success: false,
                message: data.message || "Server error. Please try again later.",
                status: status,
                error: data,
            });
        }

        // ============================
        // 429 Too Many Requests
        // ============================
        if (status === 429) {
            return Promise.reject({
                success: false,
                message: "Too many requests. Please wait a moment before trying again.",
                status: 429,
                retryAfter: error.response.headers["retry-after"] || 60,
            });
        }

        // ============================
        // Handle other status codes
        // ============================
        return Promise.reject({
            success: false,
            message: data.message || "An error occurred.",
            status: status,
            error: data,
        });
    }
);

// ============================
// HELPER FUNCTIONS
// ============================

// Handle user logout
const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("remember");
    
    const isAdminPath = window.location.pathname.includes("/admin");
    const redirectPath = isAdminPath ? "/admin/login" : "/login";
    
    if (!window.location.pathname.includes("/login")) {
        window.location.href = redirectPath;
    }
};

// ============================
// CUSTOM API METHODS
// ============================

// Admin login wrapper
api.adminLogin = async (credentials) => {
    try {
        const response = await api.post("/admin/login", credentials);
        
        if (response.data.success && response.data.data.token) {
            const { token, user } = response.data.data;
            
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem("role", user.role || "admin");
            
            if (response.data.data.refresh_token) {
                localStorage.setItem("refresh_token", response.data.data.refresh_token);
            }
        }
        
        return response;
    } catch (error) {
        throw error;
    }
};

// User login wrapper
api.userLogin = async (credentials) => {
    try {
        const response = await api.post("/login", credentials);
        
        if (response.data.success && response.data.data.token) {
            const { token, user } = response.data.data;
            
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem("role", user.role || "customer");
            
            if (response.data.data.refresh_token) {
                localStorage.setItem("refresh_token", response.data.data.refresh_token);
            }
        }
        
        return response;
    } catch (error) {
        throw error;
    }
};

// Logout wrapper
api.logoutUser = async () => {
    try {
        await api.post("/logout");
    } catch (error) {
        console.error("Logout error:", error);
    } finally {
        handleLogout();
    }
};

// Check if user is authenticated
api.isAuthenticated = () => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return !!(token && user && user.id);
};

// Check if user is admin
api.isAdmin = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.role === "admin";
};

// Get current user
api.getCurrentUser = () => {
    return JSON.parse(localStorage.getItem("user") || "{}");
};

// Get auth token
api.getToken = () => {
    return localStorage.getItem("token");
};

export default api;