import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../css/AuthStyles.css";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setMessage("");
        setIsError(false);

        try {
            const response = await api.post("/login", {
                email,
                password,
            });

            console.log("Login Response:", response.data);

            // Laravel response:
            // response.data.data.token
            // response.data.data.user

            const data = response.data.data;

            if (!data || !data.token || !data.user) {
                setIsError(true);
                setMessage("Invalid response from server.");
                return;
            }

            // Save token
            localStorage.setItem(
                "token",
                data.token
            );

            // Save user
            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            setMessage(
                response.data.message ||
                "Login successful!"
            );

            // Go to dashboard
            setTimeout(() => {
                navigate("/dashboard");
            }, 800);

        } catch (error) {
            console.error("Login Error:", error);

            setIsError(true);

            if (error.response) {
                if (error.response.data.errors) {
                    const errors =
                        error.response.data.errors;

                    const firstError =
                        Object.values(errors)[0]?.[0];

                    setMessage(
                        firstError ||
                        "Validation failed."
                    );
                } else {
                    setMessage(
                        error.response.data.message ||
                        "Login failed."
                    );
                }
            } else if (error.request) {
                setMessage(
                    "Unable to connect to Laravel server."
                );
            } else {
                setMessage(
                    "Something went wrong."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">

            <div className="auth-card">

                <h2>Login</h2>

                <p className="auth-subtitle">
                    Login to your account
                </p>

                {message && (
                    <div
                        className={
                            isError
                                ? "message error"
                                : "message success"
                        }
                    >
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="form-group">
                        <label>Email</label>

                        <input
                            type="email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            placeholder="Enter email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>

                        <div className="password-box">

                            <input
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                value={password}
                                onChange={(e) =>
                                    setPassword(
                                        e.target.value
                                    )
                                }
                                placeholder="Enter password"
                                required
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setShowPassword(
                                        !showPassword
                                    )
                                }
                            >
                                {showPassword
                                    ? "Hide"
                                    : "Show"}
                            </button>

                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Logging in..."
                            : "Login"}
                    </button>

                </form>

                <p className="auth-footer">
                    Don't have an account?{" "}

                    <Link to="/register">
                        Register
                    </Link>
                </p>

            </div>

        </div>
    );
}

export default Login;