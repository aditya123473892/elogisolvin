import { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AdminUsers from "./AdminUsers";

import {
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  BarChart2,
  TrendingUp,
  AlertTriangle,
  Activity,
  Zap,
  MapPin,
  Clock,
  Menu,
  ChevronDown,
  Truck,
  Users,
} from "lucide-react";

export default function FleetManagementAdminDashboard() {
  const { user, logout } = useAuth(); // Add useAuth hook to access logout function
  const navigate = useNavigate(); // Add useNavigate hook for redirection
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activePage, setActivePage] = useState("dashboard");
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      message: "Vehicle #2389 requires maintenance",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 2,
      message: "Driver John Smith is now available",
      time: "3 hours ago",
      read: false,
    },
    {
      id: 3,
      message: "Route optimization completed for North region",
      time: "Yesterday",
      read: true,
    },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map((notification) => ({
      ...notification,
      read: true,
    }));
    setNotifications(updatedNotifications);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (showUserMenu) setShowUserMenu(false);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
    if (showNotifications) setShowNotifications(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Mock data for the dashboard
  const fleetSummary = {
    totalVehicles: 128,
    activeVehicles: 112,
    inMaintenance: 8,
    outOfService: 8,
    availableDrivers: 98,
    totalDrivers: 105,
    currentAlerts: 5,
    fuelUsage: 1248.5,
    totalMileage: 24567,
  };

  const recentAlerts = [
    {
      id: 1,
      vehicle: "Truck #FL-5678",
      driver: "Mike Johnson",
      alert: "Low fuel warning",
      time: "10 minutes ago",
      priority: "medium",
    },
    {
      id: 2,
      vehicle: "Van #FL-9012",
      driver: "Sarah Williams",
      alert: "Maintenance due",
      time: "1 hour ago",
      priority: "high",
    },
    {
      id: 3,
      vehicle: "Truck #FL-3456",
      driver: "David Brown",
      alert: "Excessive idling",
      time: "2 hours ago",
      priority: "low",
    },
  ];

  const vehicleStatuses = [
    { status: "Active", count: 112, color: "bg-green-500" },
    { status: "Maintenance", count: 8, color: "bg-yellow-500" },
    { status: "Out of Service", count: 8, color: "bg-red-500" },
  ];

  const upcomingMaintenance = [
    {
      id: 1,
      vehicle: "Truck #FL-2345",
      type: "Oil Change",
      date: "May 16, 2025",
      status: "Scheduled",
    },
    {
      id: 2,
      vehicle: "Van #FL-7890",
      type: "Tire Rotation",
      date: "May 18, 2025",
      status: "Pending",
    },
    {
      id: 3,
      vehicle: "Truck #FL-1234",
      type: "Full Inspection",
      date: "May 20, 2025",
      status: "Scheduled",
    },
  ];

  const handleLogout = () => {
    logout(); // Call the logout function from AuthContext
    navigate("/login"); // Redirect to login page
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}

        {/* Main Content Area */}
        <main className="flex-1 ">
          <Routes>
            <Route
              path="/"
              element={
                <>
                  {/* Page Heading */}
                  <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">
                      Dashboard
                    </h1>
                    <p className="text-gray-600">
                      Welcome to your fleet management dashboard
                    </p>
                  </div>

                  {/* Dashboard Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                    <div className="bg-white rounded-lg shadow-sm p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-500 text-sm">
                            Total Vehicles
                          </p>
                          <h3 className="text-2xl font-bold mt-1">
                            {fleetSummary.totalVehicles}
                          </h3>
                        </div>
                        <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Truck className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${
                                (fleetSummary.activeVehicles /
                                  fleetSummary.totalVehicles) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 ml-2">
                          {Math.round(
                            (fleetSummary.activeVehicles /
                              fleetSummary.totalVehicles) *
                              100
                          )}
                          % active
                        </span>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-500 text-sm">
                            Available Drivers
                          </p>
                          <h3 className="text-2xl font-bold mt-1">
                            {fleetSummary.availableDrivers}
                          </h3>
                        </div>
                        <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <Users className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${
                                (fleetSummary.availableDrivers /
                                  fleetSummary.totalDrivers) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 ml-2">
                          {Math.round(
                            (fleetSummary.availableDrivers /
                              fleetSummary.totalDrivers) *
                              100
                          )}
                          % available
                        </span>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-500 text-sm">
                            Current Alerts
                          </p>
                          <h3 className="text-2xl font-bold mt-1">
                            {fleetSummary.currentAlerts}
                          </h3>
                        </div>
                        <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-red-600 flex items-center">
                        <Activity className="h-4 w-4 mr-1" />
                        {fleetSummary.currentAlerts} issues need attention
                      </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-500 text-sm">
                            Total Fuel Usage
                          </p>
                          <h3 className="text-2xl font-bold mt-1">
                            {fleetSummary.fuelUsage.toLocaleString()} gal
                          </h3>
                        </div>
                        <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <Zap className="h-6 w-6 text-yellow-600" />
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-gray-600 flex items-center">
                        <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                        3.2% decrease from last month
                      </p>
                    </div>
                  </div>

                  {/* Vehicle Status Chart and Map */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Vehicle Status Distribution */}
                    <div className="bg-white rounded-lg shadow-sm p-5">
                      <h3 className="font-medium text-gray-700 mb-4">
                        Vehicle Status Distribution
                      </h3>

                      <div className="flex flex-col space-y-3">
                        {vehicleStatuses.map((item) => (
                          <div key={item.status} className="flex items-center">
                            <div
                              className={`w-3 h-3 rounded-full ${item.color} mr-2`}
                            ></div>
                            <span className="text-sm text-gray-600 flex-1">
                              {item.status}
                            </span>
                            <span className="font-medium">{item.count}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 h-48 flex items-end space-x-1">
                        {vehicleStatuses.map((item) => (
                          <div
                            key={item.status}
                            className="flex flex-col items-center flex-1"
                          >
                            <div
                              className={`w-full ${item.color} rounded-t-sm`}
                              style={{
                                height: `${
                                  (item.count / fleetSummary.totalVehicles) *
                                  160
                                }px`,
                              }}
                            ></div>
                            <span className="text-xs text-gray-500 mt-2">
                              {Math.round(
                                (item.count / fleetSummary.totalVehicles) * 100
                              )}
                              %
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fleet Location Map */}
                    <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-5">
                      <h3 className="font-medium text-gray-700 mb-4">
                        Fleet Location
                      </h3>
                      <div className="bg-gray-100 h-64 rounded-lg relative">
                        {/* This would be the real map component in a real application */}
                        <div className="absolute inset-0 p-4 flex items-center justify-center">
                          <div className="text-center text-gray-400">
                            <MapPin className="h-10 w-10 mx-auto mb-2" />
                            <p>
                              Interactive map would display here with vehicle
                              locations
                            </p>
                          </div>
                        </div>

                        {/* Sample legend for the map */}
                        <div className="absolute bottom-4 left-4 bg-white p-2 rounded-md shadow text-sm">
                          <div className="flex items-center mb-1">
                            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                            <span>Active ({vehicleStatuses[0].count})</span>
                          </div>
                          <div className="flex items-center mb-1">
                            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                            <span>
                              Maintenance ({vehicleStatuses[1].count})
                            </span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                            <span>
                              Out of Service ({vehicleStatuses[2].count})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Alerts and Upcoming Maintenance */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Alerts */}
                    <div className="bg-white rounded-lg shadow-sm">
                      <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-medium text-gray-700">
                          Recent Alerts
                        </h3>
                        <button className="text-sm text-blue-600 hover:text-blue-800">
                          View All
                        </button>
                      </div>
                      <div>
                        {recentAlerts.map((alert) => (
                          <div
                            key={alert.id}
                            className="px-5 py-3 border-b border-gray-100 hover:bg-gray-50"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-800">
                                  {alert.vehicle}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  Driver: {alert.driver}
                                </p>
                              </div>
                              <div
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  alert.priority === "high"
                                    ? "bg-red-100 text-red-800"
                                    : alert.priority === "medium"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {alert.priority}
                              </div>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-700">
                                {alert.alert}
                              </p>
                              <p className="text-xs text-gray-500">
                                {alert.time}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Upcoming Maintenance */}
                    <div className="bg-white rounded-lg shadow-sm">
                      <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-medium text-gray-700">
                          Upcoming Maintenance
                        </h3>
                        <button className="text-sm text-blue-600 hover:text-blue-800">
                          View Schedule
                        </button>
                      </div>
                      <div>
                        {upcomingMaintenance.map((item) => (
                          <div
                            key={item.id}
                            className="px-5 py-3 border-b border-gray-100 hover:bg-gray-50"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-800">
                                  {item.vehicle}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {item.type}
                                </p>
                              </div>
                              <div
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  item.status === "Scheduled"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {item.status}
                              </div>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 text-gray-400 mr-1" />
                                <p className="text-sm text-gray-600">
                                  {item.date}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              }
            />
            <Route path="/users" element={<AdminUsers />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
