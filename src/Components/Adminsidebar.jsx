import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Home,
  Truck,
  Users,
  Calendar,
  FileText,
  Settings,
  ChevronRight,
  X,
  LogOut,
} from "lucide-react";

export function AdminSidebar({
  collapsed,
  toggleSidebar,
  activePage,
  setActivePage,
  mobileMenuOpen,
  toggleMobileMenu,
}) {
  const { logout } = useAuth(); // Get logout function from AuthContext
  const navigate = useNavigate(); // For redirecting after logout

  // Navigation items
  const navItems = [
    { name: "Dashboard", icon: Home, path: "dashboard" },
    { name: "Users", icon: Users, path: "users" },
    { name: "Transport  Request", icon: Truck, path: "transport-requests" },
    { name: "Drivers", icon: Users, path: "drivers" },
    { name: "Maintenance", icon: Calendar, path: "maintenance" },
    { name: "Reports", icon: FileText, path: "reports" },
    { name: "Settings", icon: Settings, path: "settings" },
  ];

  // Handle logout
  const handleLogout = () => {
    logout(); // Call logout function from AuthContext
    navigate("/login"); // Redirect to login page
  };

  // Handle navigation
  const handleNavigation = (path) => {
    setActivePage(path);
    if (path !== "dashboard") {
      navigate(`/admin/${path}`);
    } else {
      navigate("/admin-dashboard");
    }
  };

  return (
    <>
      {/* Sidebar - Desktop */}
      <div
        className={`bg-blue-700 text-white ${
          collapsed ? "w-20" : "w-64"
        } flex-shrink-0 transition-all duration-300 hidden md:block flex flex-col justify-between`}
      >
        <div>
          <div className="flex items-center justify-between p-5">
            {!collapsed && (
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
                  <Truck className="h-6 w-6 text-blue-700" />
                </div>
                <span className="font-bold text-xl">Fleet Admin</span>
              </div>
            )}
            {collapsed && (
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto">
                <Truck className="h-6 w-6 text-blue-700" />
              </div>
            )}
            <button
              onClick={toggleSidebar}
              className={`text-white ${collapsed ? "mx-auto" : ""}`}
            >
              <ChevronRight
                className={`h-5 w-5 transition-transform ${
                  collapsed ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          <div className="mt-5">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={`/admin/${item.path}`}
                state={{ fromSidebar: true }}
                className={`flex items-center py-3 px-5 w-full transition-colors duration-200 ${
                  activePage === item.path
                    ? "bg-blue-800 border-l-4 border-white"
                    : "border-l-4 border-transparent hover:bg-blue-600"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <item.icon className="h-5 w-5" />
                {!collapsed && <span className="ml-3">{item.name}</span>}
              </Link>
            ))}
          </div>
        </div>

        {/* Logout Button */}
        <div className="mt-auto mb-5">
          <button
            onClick={handleLogout}
            className={`flex items-center py-3 px-5 w-full transition-colors duration-200 border-l-4 border-transparent hover:bg-blue-600 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="ml-3">Logout</span>}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden">
          <div className="bg-blue-700 text-white w-64 h-full overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
                  <Truck className="h-6 w-6 text-blue-700" />
                </div>
                <span className="font-bold text-xl">Fleet Admin</span>
              </div>
              <button onClick={toggleMobileMenu}>
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-5">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={`/admin/${item.path}`}
                  state={{ fromSidebar: true }}
                  onClick={() => {
                    setActivePage(item.path);
                    toggleMobileMenu();
                  }}
                  className={`flex items-center py-3 px-5 w-full transition-colors duration-200 ${
                    activePage === item.path
                      ? "bg-blue-800 border-l-4 border-white"
                      : "border-l-4 border-transparent hover:bg-blue-600"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="ml-3">{item.name}</span>
                </Link>
              ))}
            </div>

            {/* Logout Button for Mobile */}
            <div className="mt-auto mb-5">
              <button
                onClick={handleLogout}
                className="flex items-center py-3 px-5 w-full transition-colors duration-200 border-l-4 border-transparent hover:bg-blue-600"
              >
                <LogOut className="h-5 w-5" />
                <span className="ml-3">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
