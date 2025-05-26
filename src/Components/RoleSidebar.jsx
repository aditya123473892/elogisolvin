import React from "react";
import { AdminSidebar } from "./Adminsidebar";
import { CustomerSidebar } from "./CustomerSidebar";
import { DriverSidebar } from "./DriverSidebar";
import { useAuth } from "../contexts/AuthContext";

export const RoleSidebar = (props) => {
  const { user } = useAuth();
  
  if (!user) return null;

  // Render the appropriate sidebar based on user role
  switch (user.role) {
    case "Admin":
      return <AdminSidebar {...props} />;
    case "Customer":
      return <CustomerSidebar {...props} />;
    case "Driver":
      return <DriverSidebar {...props} />;
    default:
      return null;
  }
};