// PATH: src/Pages/Register.jsx

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../css/AuthStyles.css";

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        password_confirmation: "",
    });

    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
        
        // Clear field error when user types
        if (fieldErrors[name]) {
            setFieldErrors({
                ...fieldErrors,
                [name]: null
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setIsError(false);
        setFieldErrors({});

        // ✅ Client-side validation
        if (!formData.name || !formData.email || !formData.phone || !formData.password) {
            setIsError(true);
            setMessage("Please fill in all required fields.");
            return;
        }

        // Password confirmation check
        if (formData.password !== formData.password_confirmation) {
            setIsError(true);
            setMessage("Passwords do not match.");
            setFieldErrors({
                password_confirmation: ["Passwords do not match."]
            });
            return;
        }

        // Password length
        if (formData.password.length < 8) {
            setIsError(true);
            setMessage("Password must be at least 8 characters.");
            setFieldErrors({
                password: ["Password must be at least 8 characters."]
            });
            return;
        }

        // Password regex check (uppercase, lowercase, digit)
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(formData.password)) {
            setIsError(true);
            setMessage("Password must include at least 1 uppercase letter, 1 lowercase letter, and 1 number.");
            setFieldErrors({
                password: ["Password must include at least 1 uppercase letter, 1 lowercase letter, and 1 number."]
            });
            return;
        }

        // Phone validation
        if (!/^[6-9][0-9]{9}$/.test(formData.phone)) {
            setIsError(true);
            setMessage("Enter a valid 10-digit mobile number starting with 6-9.");
            setFieldErrors({
                phone: ["Enter a valid 10-digit mobile number starting with 6-9."]
            });
            return;
        }

        setLoading(true);

        try {
            const response = await api.post("/register", formData);

            console.log("✅ Register Response:", response.data);

            // ✅ If Laravel sends token and user in data object
            if (response.data.data) {
                const { token, user } = response.data.data;
                
                if (token) {
                    localStorage.setItem("token", token);
                }
                
                if (user) {
                    localStorage.setItem("user", JSON.stringify(user));
                }
            }

            setIsError(false);
            setMessage(response.data.message || "Registration successful! Redirecting to login...");

            // Go to login after 2 seconds
            setTimeout(() => {
                navigate("/login");
            }, 2000);

        } catch (error) {
            console.error("❌ Registration Error:", error);

            setIsError(true);

            if (error.response) {
                const status = error.response.status;
                const errorData = error.response.data;

                console.log("📝 Error Response:", errorData);

                // ✅ Handle 422 Validation errors
                if (status === 422) {
                    if (errorData.errors) {
                        // Set field-specific errors
                        setFieldErrors(errorData.errors);
                        
                        // Get first error message
                        const firstErrorKey = Object.keys(errorData.errors)[0];
                        const firstErrorMessage = errorData.errors[firstErrorKey]?.[0];
                        
                        setMessage(firstErrorMessage || "Validation failed. Please check your input.");
                    } else {
                        setMessage(errorData.message || "Validation failed. Please check your input.");
                    }
                } 
                // ✅ Handle other errors
                else {
                    setMessage(errorData.message || "Registration failed. Please try again.");
                }
            } else if (error.request) {
                setMessage("Unable to connect to the server. Please check your network connection.");
            } else {
                setMessage("Something went wrong. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Create Account</h2>
                <p className="auth-subtitle">
                    Register a new account
                </p>

                {message && (
                    <div className={isError ? "message error" : "message success"}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                    
                    {/* Name */}
                    <div className="form-group">
                        <label>Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            className={fieldErrors.name ? "input-error" : ""}
                            required
                        />
                        {fieldErrors.name && (
                            <span className="field-error">{fieldErrors.name[0]}</span>
                        )}
                    </div>

                    {/* Email */}
                    <div className="form-group">
                        <label>Email <span className="text-red-500">*</span></label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            className={fieldErrors.email ? "input-error" : ""}
                            required
                        />
                        {fieldErrors.email && (
                            <span className="field-error">{fieldErrors.email[0]}</span>
                        )}
                    </div>

                    {/* Phone */}
                    <div className="form-group">
                        <label>Phone <span className="text-red-500">*</span></label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="9876543210"
                            maxLength="10"
                            inputMode="numeric"
                            className={fieldErrors.phone ? "input-error" : ""}
                            required
                        />
                        {fieldErrors.phone && (
                            <span className="field-error">{fieldErrors.phone[0]}</span>
                        )}
                    </div>

                    {/* Password */}
                    <div className="form-group">
                        <label>Password <span className="text-red-500">*</span></label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter password"
                            className={fieldErrors.password ? "input-error" : ""}
                            required
                        />
                        {fieldErrors.password && (
                            <span className="field-error">{fieldErrors.password[0]}</span>
                        )}
                        <small className="text-muted">Min 8 chars with uppercase, lowercase & number</small>
                    </div>

                    {/* Confirm Password */}
                    <div className="form-group">
                        <label>Confirm Password <span className="text-red-500">*</span></label>
                        <input
                            type="password"
                            name="password_confirmation"
                            value={formData.password_confirmation}
                            onChange={handleChange}
                            placeholder="Confirm password"
                            className={fieldErrors.password_confirmation ? "input-error" : ""}
                            required
                        />
                        {fieldErrors.password_confirmation && (
                            <span className="field-error">{fieldErrors.password_confirmation[0]}</span>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Registering..." : "Register"}
                    </button>

                </form>

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
}

export default Register;