import React, { useState } from "react";
import { RoleSidebar } from "./RoleSidebar";

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Common props for all sidebars
  const sidebarProps = {
    collapsed,
    toggleSidebar,
    activePage,
    setActivePage,
    mobileMenuOpen,
    toggleMobileMenu
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <RoleSidebar {...sidebarProps} />
      <div className="flex-1 overflow-auto">
        {React.cloneElement(children, { activePage })}
      </div>
    </div>
  );
}