import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Home,
  Truck,
  Package,
  FileText,
  Settings,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  MessageSquare,
  Clock,
  X,
  LogOut,
} from "lucide-react";
import { api } from "../utils/Api";

export function CustomerSidebar({
  collapsed,
  toggleSidebar,
  activePage,
  setActivePage,
  mobileMenuOpen,
  toggleMobileMenu,
}) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);

  const { logout, user } = useAuth();
  const navigate = useNavigate();

  // Navigation items for customer with descriptions
  const navItems = [
    {
      name: "Dashboard",
      icon: Home,
      path: "dashboard",
      description: "Overview & Summary",
    },
    {
      name: "My Shipments",
      icon: Truck,
      path: "my-shipments",
      description: "Track Deliveries",
    },
    {
      name: "Service Requests",
      icon: Package,
      path: "requests",
      description: "Manage Requests",
    },
    {
      name: "Billing",
      icon: DollarSign,
      path: "billing",
      description: "Invoices & Payments",
    },
    {
      name: "Reports",
      icon: FileText,
      path: "reports",
      description: "Analytics & History",
    },
    {
      name: "Support",
      icon: MessageSquare,
      path: "support",
      description: "Help & Contact",
    },
    {
      name: "Settings",
      icon: Settings,
      path: "settings",
      description: "Account Configuration",
    },
  ];

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        toggleMobileMenu();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen, toggleMobileMenu]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  const handleRequestClick = (request) => {
    setSelectedRequest(request);
    setShowEditModal(true);
  };

  // Handle logout with confirmation
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
      navigate("/login");
    }
  };

  // Handle navigation
  const handleNavigation = (path) => {
    setActivePage(path);
    if (path !== "dashboard") {
      navigate(`/customer/${path}`);
    } else {
      navigate("/customer-dashboard");
    }

    // Close mobile menu after navigation
    if (mobileMenuOpen) {
      toggleMobileMenu();
    }
  };

  // Check if current path matches nav item
  const isActiveItem = (path) => {
    return activePage === path;
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setSelectedRequest(null);
  };

  return (
    <>
      {/* Sidebar - Desktop */}
      <div
        className={`bg-slate-900 text-white ${
          collapsed ? "w-16" : "w-64"
        } flex-shrink-0 transition-all duration-300 ease-in-out hidden md:flex flex-col shadow-2xl border-r border-slate-700 relative`}
      >
        {/* Header Section */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-white">Fleet Customer</h1>
                <p className="text-xs text-slate-400">Customer Portal</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-green-700 rounded-xl flex items-center justify-center mx-auto shadow-lg">
              <Truck className="h-6 w-6 text-white" />
            </div>
          )}

          {/* Enhanced Toggle Button */}
          <button
            onClick={toggleSidebar}
            className={`p-2 rounded-lg hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 group ${
              collapsed ? "mx-auto mt-2" : ""
            }`}
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <div className="relative">
              {collapsed ? (
                <ChevronRight className="h-5 w-5 transform group-hover:translate-x-0.5 transition-transform duration-200" />
              ) : (
                <ChevronLeft className="h-5 w-5 transform group-hover:-translate-x-0.5 transition-transform duration-200" />
              )}
            </div>
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 py-4 px-3 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
          {navItems.map((item, index) => (
            <div
              key={item.path}
              className="relative"
              onMouseEnter={() => setHoveredItem(item.path)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Link
                to={
                  item.path === "dashboard"
                    ? "/customer-dashboard"
                    : `/customer/${item.path}`
                }
                state={{ fromSidebar: true }}
                onClick={() => handleNavigation(item.path)}
                className={`group flex items-center py-3 px-3 rounded-xl transition-all duration-200 relative overflow-hidden ${
                  isActiveItem(item.path)
                    ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg transform scale-105"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white hover:transform hover:scale-105"
                } ${collapsed ? "justify-center" : ""}`}
              >
                {/* Background effect for active item */}
                {isActiveItem(item.path) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-green-700/20 rounded-xl"></div>
                )}

                <item.icon
                  className={`h-5 w-5 flex-shrink-0 relative z-10 ${
                    isActiveItem(item.path)
                      ? "text-white"
                      : "text-slate-400 group-hover:text-white"
                  }`}
                />

                {!collapsed && (
                  <div className="ml-3 flex-1 min-w-0 relative z-10">
                    <div className="font-medium text-sm">{item.name}</div>
                    <div
                      className={`text-xs transition-colors duration-200 ${
                        isActiveItem(item.path)
                          ? "text-green-100"
                          : "text-slate-400 group-hover:text-slate-300"
                      }`}
                    >
                      {item.description}
                    </div>
                  </div>
                )}

                {/* Active indicator */}
                {isActiveItem(item.path) && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r shadow-lg"></div>
                )}

                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-700/0 to-slate-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl"></div>
              </Link>

              {/* Enhanced Tooltip for collapsed state */}
              {collapsed && hoveredItem === item.path && (
                <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 bg-slate-800 text-white px-4 py-3 rounded-lg shadow-xl border border-slate-600 z-50 whitespace-nowrap animate-in slide-in-from-left-2 duration-200">
                  <div className="font-medium text-sm">{item.name}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {item.description}
                  </div>
                  {/* Tooltip arrow */}
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 border-4 border-transparent border-r-slate-800"></div>
                </div>
              )}
            </div>
          ))}

          {/* User Section & Logout */}
          <div className="border-t border-slate-700 p-4 space-y-3 bg-slate-800/30">
            {!collapsed && user && (
              <div className="flex items-center space-x-3 p-3 bg-slate-800 rounded-xl border border-slate-600/50 hover:bg-slate-700 transition-colors duration-200">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-lg">
                  {user.name?.charAt(0) || "C"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm truncate">
                    {user.name || "Customer User"}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {user.email || "customer@fleet.com"}
                  </p>
                </div>
                <div className="w-3 h-3 bg-emerald-400 rounded-full shadow-lg animate-pulse"></div>
              </div>
            )}

            {collapsed && user && (
              <div className="flex justify-center">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-lg relative">
                  {user.name?.charAt(0) || "C"}
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse"></div>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className={`group flex items-center py-3 px-3 w-full rounded-xl transition-all duration-200 text-red-400 hover:bg-red-900/30 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                collapsed ? "justify-center" : ""
              }`}
              title="Logout"
            >
              <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              {!collapsed && (
                <span className="ml-3 font-medium text-sm">Logout</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] md:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0" onClick={toggleMobileMenu} />

          {/* Sidebar */}
          <div
            className={`bg-slate-900 text-white w-80 max-w-[85vw] h-full overflow-y-auto flex flex-col shadow-2xl transform transition-all duration-300 ease-out ${
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-700 bg-slate-800 sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg">
                  <Truck className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-xl text-white">
                    Fleet Customer
                  </h1>
                  <p className="text-xs text-slate-400">Customer Portal</p>
                </div>
              </div>
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg hover:bg-slate-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <div className="flex-1 py-6 px-4 space-y-2">
              {navItems.map((item, index) => (
                <Link
                  key={item.path}
                  to={
                    item.path === "dashboard"
                      ? "/customer-dashboard"
                      : `/customer/${item.path}`
                  }
                  state={{ fromSidebar: true }}
                  onClick={() => handleNavigation(item.path)}
                  className={`group flex items-center py-4 px-4 rounded-xl transition-all duration-200 relative overflow-hidden ${
                    isActiveItem(item.path)
                      ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white active:bg-slate-700"
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Background effect */}
                  {isActiveItem(item.path) && (
                    <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-green-700/20 rounded-xl"></div>
                  )}

                  <item.icon
                    className={`h-6 w-6 flex-shrink-0 relative z-10 ${
                      isActiveItem(item.path)
                        ? "text-white"
                        : "text-slate-400 group-hover:text-white"
                    }`}
                  />
                  <div className="ml-4 flex-1 relative z-10">
                    <div className="font-semibold text-base">{item.name}</div>
                    <div
                      className={`text-sm mt-1 transition-colors duration-200 ${
                        isActiveItem(item.path)
                          ? "text-green-100"
                          : "text-slate-400 group-hover:text-slate-300"
                      }`}
                    >
                      {item.description}
                    </div>
                  </div>
                  <ChevronRight
                    className={`h-5 w-5 relative z-10 transition-transform duration-200 group-hover:translate-x-1 ${
                      isActiveItem(item.path) ? "text-white" : "text-slate-400"
                    }`}
                  />

                  {/* Active indicator */}
                  {isActiveItem(item.path) && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r shadow-lg"></div>
                  )}
                </Link>
              ))}
            </div>

            {/* Mobile User Section & Logout */}
            <div className="border-t border-slate-700 p-5 space-y-4 bg-slate-800/30">
              {user && (
                <div className="flex items-center space-x-4 p-4 bg-slate-800 rounded-xl border border-slate-600/50">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    {user.name?.charAt(0) || "C"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-base truncate">
                      {user.name || "Customer User"}
                    </p>
                    <p className="text-sm text-slate-400 truncate">
                      {user.email || "customer@fleet.com"}
                    </p>
                  </div>
                  <div className="w-3 h-3 bg-emerald-400 rounded-full shadow-lg animate-pulse"></div>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="group flex items-center py-4 px-4 w-full rounded-xl transition-all duration-200 text-red-400 hover:bg-red-900/30 hover:text-red-300 active:bg-red-900/40 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <LogOut className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
                <span className="ml-4 font-semibold text-base">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
