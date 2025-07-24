import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Home,
  Truck,
  Package,
  FileText,
  Settings,
  DollarSign,
  MessageSquare,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
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
      name: "Vendor Management",
      icon: Package,
      path: "vendors",
      description: "Manage Vendors",
    },
    {
      name: "Driver Management",
      icon: Truck,
      path: "drivers",
      description: "Drivers Details",
    },
    {
      name: "Fleet Equipment",
      icon: FileText,
      path: "fleet-equipment",
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

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        toggleMobileMenu();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen, toggleMobileMenu]);

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

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
      navigate("/login");
    }
  };

  const handleNavigation = (path) => {
    setActivePage(path);
    navigate(
      path === "dashboard" ? "/customer-dashboard" : `/customer/${path}`
    );
    if (mobileMenuOpen) {
      toggleMobileMenu();
    }
  };

  const isActiveItem = (path) => activePage === path;

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
        } flex-shrink-0 transition-all duration-300 ease-in-out hidden md:flex flex-col shadow-lg border-r border-slate-700 fixed h-full z-40`}
      >
        {/* Header Section */}
        <div className="p-4 border-b border-slate-700 bg-slate-800/50">
          {collapsed ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-md">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                aria-label="Expand Sidebar"
              >
                <ChevronRight className="h-5 w-5 text-slate-200 transform rotate-0 hover:rotate-6 transition-transform duration-200" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-md">
                  <Truck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-lg text-white tracking-tight">
                    Fleet Customer
                  </h1>
                  <p className="text-xs text-slate-300">Customer Portal</p>
                </div>
              </div>
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                aria-label="Collapse Sidebar"
              >
                <ChevronLeft className="h-5 w-5 text-slate-200 transform rotate-0 hover:-rotate-6 transition-transform duration-200" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation Section */}
        <div className="flex-1 py-4 px-2 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
          {navItems.map((item, index) => (
            <div
              key={item.path}
              className="relative"
              onMouseEnter={() => setHoveredItem(item.path)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <Link
                to={
                  item.path === "dashboard"
                    ? "/customer-dashboard"
                    : `/customer/${item.path}`
                }
                onClick={() => handleNavigation(item.path)}
                className={`group flex items-center py-3 px-3 rounded-lg transition-all duration-200 relative overflow-hidden ${
                  isActiveItem(item.path)
                    ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md"
                    : "text-slate-200 hover:bg-slate-800 hover:text-white"
                } ${collapsed ? "justify-center" : ""}`}
              >
                {isActiveItem(item.path) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-green-700/20 rounded-lg"></div>
                )}
                <item.icon
                  className={`h-5 w-5 flex-shrink-0 relative z-10 ${
                    isActiveItem(item.path)
                      ? "text-white"
                      : "text-slate-300 group-hover:text-white"
                  }`}
                />
                {!collapsed && (
                  <div className="ml-3 flex-1 min-w-0 relative z-10">
                    <div className="font-semibold text-sm">{item.name}</div>
                    <div className="text-xs text-slate-300 group-hover:text-slate-200">
                      {item.description}
                    </div>
                  </div>
                )}
                {isActiveItem(item.path) && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r"></div>
                )}
                <div className="absolute inset-0 bg-slate-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg"></div>
              </Link>
              {collapsed && hoveredItem === item.path && (
                <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-slate-800 text-white px-3 py-2 rounded-lg shadow-md border border-slate-700 z-50 whitespace-nowrap animate-in fade-in duration-200">
                  <div className="font-semibold text-sm">{item.name}</div>
                  <div className="text-xs text-slate-300">
                    {item.description}
                  </div>
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 border-4 border-transparent border-r-slate-800"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* User Section & Logout */}
        <div className="border-t border-slate-700 p-4 space-y-3 bg-slate-800/30">
          <button
            onClick={handleLogout}
            className={`group flex items-center py-3 px-3 w-full rounded-lg transition-all duration-200 text-red-400 hover:bg-red-900/30 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 ${
              collapsed ? "justify-center" : ""
            }`}
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
            {!collapsed && (
              <span className="ml-3 font-semibold text-sm">Logout</span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] md:hidden">
          <div className="absolute inset-0" onClick={toggleMobileMenu} />
          <div
            className={`bg-slate-900 text-white w-80 max-w-[90vw] h-full overflow-y-auto flex flex-col shadow-lg transform transition-all duration-300 ease-out ${
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800 sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-md">
                  <Truck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-lg text-white tracking-tight">
                    Fleet Customer
                  </h1>
                  <p className="text-xs text-slate-300">Customer Portal</p>
                </div>
              </div>
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                aria-label="Close menu"
              >
                <X className="h-5 w-5 text-slate-200" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <div className="flex-1 py-4 px-3 space-y-2">
              {navItems.map((item, index) => (
                <Link
                  key={item.path}
                  to={
                    item.path === "dashboard"
                      ? "/customer-dashboard"
                      : `/customer/${item.path}`
                  }
                  onClick={() => handleNavigation(item.path)}
                  className={`group flex items-center py-3 px-3 rounded-lg transition-all duration-200 relative overflow-hidden ${
                    isActiveItem(item.path)
                      ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md"
                      : "text-slate-200 hover:bg-slate-800 hover:text-white active:bg-slate-700"
                  }`}
                >
                  {isActiveItem(item.path) && (
                    <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-green-700/20 rounded-lg"></div>
                  )}
                  <item.icon
                    className={`h-5 w-5 flex-shrink-0 relative z-10 ${
                      isActiveItem(item.path)
                        ? "text-white"
                        : "text-slate-300 group-hover:text-white"
                    }`}
                  />
                  <div className="ml-3 flex-1 relative z-10">
                    <div className="font-semibold text-sm">{item.name}</div>
                    <div className="text-xs text-slate-300 group-hover:text-slate-200">
                      {item.description}
                    </div>
                  </div>
                  <ChevronRight
                    className={`h-5 w-5 relative z-10 transition-transform duration-200 group-hover:translate-x-1 ${
                      isActiveItem(item.path) ? "text-white" : "text-slate-300"
                    }`}
                  />
                  {isActiveItem(item.path) && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r"></div>
                  )}
                </Link>
              ))}
            </div>

            {/* Mobile User Section & Logout */}
            <div className="border-t border-slate-700 p-4 space-y-3 bg-slate-800/30">
              {user && (
                <div className="flex items-center space-x-3 p-3 bg-slate-800 rounded-lg border border-slate-700/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">
                      {user.name || "Customer User"}
                    </p>
                    <p className="text-xs text-slate-300 truncate">
                      {user.email || "customer@fleet.com"}
                    </p>
                  </div>
                  <div className="w-3 h-3 bg-green-400 rounded-full shadow-md animate-pulse"></div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="group flex items-center py-3 px-3 w-full rounded-lg transition-all duration-200 text-red-400 hover:bg-red-900/30 hover:text-red-300 active:bg-red-900/40 focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Logout"
              >
                <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                <span className="ml-3 font-semibold text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
