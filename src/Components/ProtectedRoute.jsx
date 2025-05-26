import React, { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && !allowedRoles.includes(user.role)) {
      navigate("/dashboard");
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

  // If user's role is not in the allowed roles, redirect to appropriate dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on user's role
    switch (user.role) {
      case "Admin":
        return <Navigate to="/admin-dashboard" replace />;
      case "Customer":
        return <Navigate to="/customer-dashboard" replace />;
      case "Driver":
        return <Navigate to="/driver-dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  // If user is authenticated and authorized, render the children
  return children;
};
