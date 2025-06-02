import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, handleAuthError, isTokenExpired } = useAuth();
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const validateAccess = async () => {
      if (loading) return; // Wait for auth context to finish loading

      // Check if user exists and token is valid
      if (user) {
        const token = localStorage.getItem("token");

        // Check if token exists and is not expired
        if (!token || isTokenExpired(token)) {
          handleAuthError(
            navigate,
            "Your session has expired. Please log in again."
          );
          return;
        }

        // If user has required role, allow access
        if (allowedRoles.length === 0 || allowedRoles.includes(user.role)) {
          setIsValidating(false);
          return;
        }

        // User doesn't have required role, redirect to their dashboard
        switch (user.role) {
          case "Admin":
            navigate("/admin-dashboard", { replace: true });
            break;
          case "Customer":
            navigate("/customer-dashboard", { replace: true });
            break;
          case "Driver":
            navigate("/driver-dashboard", { replace: true });
            break;
          case "Accounts":
            navigate("/accounts-dashboard", { replace: true });
            break;
          case "Reports & MIS":
            navigate("/reports-dashboard", { replace: true });
            break;
          default:
            navigate("/", { replace: true });
        }
      } else {
        // No user, will be handled by the redirect below
        setIsValidating(false);
      }
    };

    validateAccess();
  }, [user, loading, allowedRoles, navigate, handleAuthError, isTokenExpired]);

  // Show loading state while checking authentication or validating
  if (loading || isValidating) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Validating access...</span>
      </div>
    );
  }

  // If user is not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check token validity one more time before rendering
  const token = localStorage.getItem("token");
  if (!token || isTokenExpired(token)) {
    handleAuthError(navigate, "Your session has expired. Please log in again.");
    return <Navigate to="/login" replace />;
  }

  // If specific roles are required and user doesn't have them, redirect
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    switch (user.role) {
      case "Admin":
        return <Navigate to="/admin-dashboard" replace />;
      case "Customer":
        return <Navigate to="/customer-dashboard" replace />;
      case "Driver":
        return <Navigate to="/driver-dashboard" replace />;
      case "Accounts":
        return <Navigate to="/accounts-dashboard" replace />;
      case "Reports & MIS":
        return <Navigate to="/reports-dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  // If user is authenticated and authorized, render the children
  return children;
};
