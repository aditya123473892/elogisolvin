import { useState, useEffect } from "react";
import EditRequestModal from "./EditRequestModal";
import {
  Home,
  Truck,
  Package,
  FileText,
  Settings,
  ChevronRight,
  X,
  DollarSign,
  MessageSquare,
  Clock,
} from "lucide-react";
import api from "../utils/Api";

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

  // Navigation items for customer
  const navItems = [
    { name: "Dashboard", icon: Home, path: "dashboard" },
    { name: "My Shipments", icon: Truck, path: "shipments" },
    { name: "Service Requests", icon: Package, path: "requests" },
    { name: "Billing", icon: DollarSign, path: "billing" },
    { name: "Reports", icon: FileText, path: "reports" },
    { name: "Support", icon: MessageSquare, path: "support" },
    { name: "Settings", icon: Settings, path: "settings" },
  ];



  const handleRequestClick = (request) => {
    setSelectedRequest(request);
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setSelectedRequest(null);
  };

  const handleUpdateSuccess = async () => {
    // Refresh the pending requests list
    try {
      const response = await api.get("/transport-requests/my-requests");
      if (response.data.requests) {
        const pending = response.data.requests.filter(
          (req) => req.status === "Pending"
        );
        setPendingRequests(pending);
      }
    } catch (error) {
      console.error("Error refreshing pending requests:", error);
    }
  };

  return (
    <>
      {/* Sidebar - Desktop */}
      <div
        className={`bg-blue-700 text-white ${
          collapsed ? "w-20" : "w-64"
        } flex-shrink-0 transition-all duration-300 hidden md:block flex flex-col`}
      >
        <div className="flex items-center justify-between p-5">
          {!collapsed && (
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
                <Truck className="h-6 w-6 text-blue-700" />
              </div>
              <span className="font-bold text-xl">Fleet Customer</span>
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
            <button
              key={item.path}
              onClick={() => setActivePage(item.path)}
              className={`flex items-center py-3 px-5 w-full transition-colors duration-200 ${
                activePage === item.path
                  ? "bg-blue-800 border-l-4 border-white"
                  : "border-l-4 border-transparent hover:bg-blue-600"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <item.icon className="h-5 w-5" />
              {!collapsed && <span className="ml-3">{item.name}</span>}
            </button>
          ))}
        </div>

        {/* Pending Requests Section */}
        {!collapsed && pendingRequests.length > 0 && (
          <div className="mt-8 px-5">
            <h3 className="text-sm font-semibold uppercase text-white/70 mb-2">
              Pending Requests
            </h3>
            <div className="space-y-2">
              {pendingRequests.map((request) => (
                <button
                  key={request.id}
                  onClick={() => handleRequestClick(request)}
                  className="w-full text-left p-2 rounded bg-blue-800/50 hover:bg-blue-800 text-sm flex items-center"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  <div className="overflow-hidden">
                    <div className="truncate">
                      {request.vehicle_type} - {request.id}
                    </div>
                    <div className="text-xs text-white/70 truncate">
                      {new Date(request.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden">
          <div className="bg-blue-700 text-white w-64 h-full overflow-y-auto">
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
                  <Truck className="h-6 w-6 text-blue-700" />
                </div>
                <span className="font-bold text-xl">Fleet Customer</span>
              </div>
              <button onClick={toggleMobileMenu}>
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-5">
              {navItems.map((item) => (
                <button
                  key={item.path}
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
                </button>
              ))}
            </div>

            {/* Pending Requests Section for Mobile */}
            {pendingRequests.length > 0 && (
              <div className="mt-8 px-5">
                <h3 className="text-sm font-semibold uppercase text-white/70 mb-2">
                  Pending Requests
                </h3>
                <div className="space-y-2">
                  {pendingRequests.map((request) => (
                    <button
                      key={request.id}
                      onClick={() => {
                        handleRequestClick(request);
                        toggleMobileMenu();
                      }}
                      className="w-full text-left p-2 rounded bg-blue-800/50 hover:bg-blue-800 text-sm flex items-center"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      <div className="overflow-hidden">
                        <div className="truncate">
                          {request.vehicle_type} - {request.id}
                        </div>
                        <div className="text-xs text-white/70 truncate">
                          {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
