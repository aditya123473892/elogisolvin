import React, { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if user is authenticated but doesn't have proper role
    if (!loading && user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      // Redirect to user's appropriate dashboard
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
    }
  }, [user, loading, allowedRoles, navigate]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If user is not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If specific roles are required and user doesn't have them, redirect
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect based on user's role
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