import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Header from "../Components/Header";
import FleetManagementAdminDashboard from "./Admindashboard";
import AdminUsers from "./AdminUsers";
import AdminTransportRequests from "./AdminTransportRequests";
import { AdminSidebar } from "../Components/Adminsidebar";

const AdminLayout = () => {
  // Sidebar states
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");

  // Header states
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Get user data from auth context
  const { user, logout } = useAuth();

  // Responsive sidebar handling
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(false); // Always expand on mobile when sidebar is shown
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Check initial size

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications || showUserMenu) {
        // Close dropdowns if clicking outside
        if (!event.target.closest(".dropdown-container")) {
          setShowNotifications(false);
          setShowUserMenu(false);
        }
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showNotifications, showUserMenu]);

  // Toggle functions
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    // Close other dropdowns when opening mobile menu
    if (!mobileMenuOpen) {
      setShowNotifications(false);
      setShowUserMenu(false);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowUserMenu(false); // Close user menu when opening notifications
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
    setShowNotifications(false); // Close notifications when opening user menu
  };

  // Handler functions
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    // Implement search logic here
    console.log("Searching for:", e.target.value);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar
        collapsed={collapsed}
        toggleSidebar={toggleSidebar}
        activePage={activePage}
        setActivePage={setActivePage}
        mobileMenuOpen={mobileMenuOpen}
        toggleMobileMenu={toggleMobileMenu}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          toggleMobileMenu={toggleMobileMenu}
          mobileMenuOpen={mobileMenuOpen}
          searchQuery={searchQuery}
          handleSearch={handleSearch}
          showNotifications={showNotifications}
          toggleNotifications={toggleNotifications}
          showUserMenu={showUserMenu}
          toggleUserMenu={toggleUserMenu}
          user={user}
          handleLogout={handleLogout}
          collapsed={collapsed}
          toggleSidebar={toggleSidebar}
        />

        {/* Main Content with Routes */}
  
          <Routes>
            <Route path="/" element={<FleetManagementAdminDashboard />} />
            <Route path="/users" element={<AdminUsers />} />
            <Route
              path="/transport-requests"
              element={<AdminTransportRequests />}
            />
          </Routes>
     
      </div>
    </div>
  );
};

export default AdminLayout;
