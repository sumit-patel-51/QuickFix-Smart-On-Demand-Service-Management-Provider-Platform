import React from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function Logout() {

    const navigate = useNavigate();

    const handleLogout = async () => {

        try {

            await api.post("/logout");

        } catch (error) {

            console.error(
                "Logout error:",
                error.response?.data
            );

        } finally {

            // Remove authentication information
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            // Go to login
            navigate("/", { replace: true });
        }
    };

    return (
        <button onClick={handleLogout}>
            Logout
        </button>
    );
}

export default Logout;