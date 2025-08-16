import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

import { generateInvoice } from "../utils/pdfGenerator";

import ServiceRequestForm from "../Components/dashboard/Servicerequest";

import {
  CheckCircle,
  AlertTriangle,
  Clock,
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  Menu,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";

import api from "../utils/Api";

import { toast, ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

import { useNavigate } from "react-router-dom";

import StatsCards from "../Components/dashboard/StatCards";

import { TransporterDetails } from "./Transporterdetails";

export default function CustomerDashboard({
  collapsed,
  toggleSidebar,
  activePage,
  setActivePage,
  mobileMenuOpen,
  toggleMobileMenu,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // In CustomerDashboard.js - Update the initial requestData state around line 50-80
  // Add SHIPA_NO to the initial state

  const [requestData, setRequestData] = useState({
    id: null,
    SHIPA_NO: "", // ADD THIS LINE
    consignee: "",
    consigner: "",
    vehicle_type: "",
    vehicle_size: "",
    no_of_vehicles: "1",
    containers_20ft: 0,
    containers_40ft: 0,
    total_containers: 0,
    pickup_location: "",
    stuffing_location: "",
    delivery_location: "",
    commodity: "",
    cargo_type: "",
    cargo_weight: "",
    service_type: [],
    service_prices: {},
    expected_pickup_date: "",
    expected_pickup_time: "",
    expected_delivery_date: "",
    expected_delivery_time: "",
    requested_price: "",
    status: "Pending",
    admin_comment: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pastRequests, setPastRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const requestsPerPage = 5;

  const [transporterData, setTransporterData] = useState({
    transporterName: "",
    vehicleNumber: "",
    driverName: "",
    driverContact: "",
    vendorName: "",
    vendorContact: "",
    vehicleNumber: "",
    driverName: "",
  });

  // Header functions (matching AdminDashboard)
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (showUserMenu) setShowUserMenu(false);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
    if (showNotifications) setShowNotifications(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get("/transport-requests/my-requests");
      if (response.data?.success) {
        console.log("response", response.data.requests);
        setAllRequests(response.data.requests);
        updateDisplayedRequests(response.data.requests, 1);
      } else {
        toast.error("Failed to fetch requests");
      }
    } catch (error) {
      console.error("Fetch requests error:", error);
      toast.error(error.response?.data?.message || "Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  const updateDisplayedRequests = (requests, page) => {
    const startIndex = (page - 1) * requestsPerPage;
    const endIndex = startIndex + requestsPerPage;
    const displayedRequests = requests.slice(startIndex, endIndex);
    setPastRequests(displayedRequests);
    setCurrentPage(page);
  };

  const getTotalPages = () => {
    return Math.ceil(allRequests.length / requestsPerPage);
  };

  // In CustomerDashboard.js - Update the handleSubmit function around line 200-250
  // Add SHIPA_NO to the formData object

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields before submission
      if (!requestData.expected_pickup_date) {
        toast.error("Expected pickup date is required");
        setIsSubmitting(false);
        return;
      }

      if (!requestData.expected_delivery_date) {
        toast.error("Expected delivery date is required");
        setIsSubmitting(false);
        return;
      }

      // Validate date format
      const isValidDate = (dateString) => {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
      };

      if (!isValidDate(requestData.expected_pickup_date)) {
        toast.error("Invalid pickup date");
        setIsSubmitting(false);
        return;
      }

      if (!isValidDate(requestData.expected_delivery_date)) {
        toast.error("Invalid delivery date");
        setIsSubmitting(false);
        return;
      }

      // Format time for time(7) compatibility (append :00 for seconds)
      const formatTimeForDatabase = (timeString) => {
        if (!timeString) return null;
        // Ensure HH:MM:SS format by appending :00
        return `${timeString.trim()}:00`;
      };

      // Clean form data preparation - FIXED: Added SHIPA_NO field
      const formData = {
        SHIPA_NO: requestData.SHIPA_NO?.trim() || "", // ADD THIS LINE
        consignee: requestData.consignee.trim(),
        consigner: requestData.consigner.trim(),
        vehicle_type: requestData.vehicle_type,
        vehicle_size: requestData.vehicle_size,
        vehicle_status: requestData.vehicle_status,
        no_of_vehicles: parseInt(requestData.no_of_vehicles) || 1,
        pickup_location: requestData.pickup_location.trim(),
        stuffing_location: requestData.stuffing_location.trim(),
        delivery_location: requestData.delivery_location.trim(),
        commodity: requestData.commodity.trim(),
        cargo_type: requestData.cargo_type,
        cargo_weight: parseFloat(requestData.cargo_weight) || 0,
        service_type: JSON.stringify(requestData.service_type),
        service_prices: JSON.stringify(requestData.service_prices),
        containers_20ft: parseInt(requestData.containers_20ft) || 0,
        containers_40ft: parseInt(requestData.containers_40ft) || 0,
        total_containers: parseInt(requestData.total_containers) || 0,
        expected_pickup_date: requestData.expected_pickup_date,
        expected_pickup_time: formatTimeForDatabase(
          requestData.expected_pickup_time
        ),
        expected_delivery_date: requestData.expected_delivery_date,
        expected_delivery_time: formatTimeForDatabase(
          requestData.expected_delivery_time
        ),
        requested_price: parseFloat(requestData.requested_price) || 0,
        status: "Pending",
      };

      console.log("Form data being sent:", formData); // Debug log

      // Determine if it's create or update
      const isUpdate = Boolean(requestData.id);
      const endpoint = isUpdate
        ? `/transport-requests/update/${requestData.id}`
        : "/transport-requests/create";

      const response = isUpdate
        ? await api.put(endpoint, formData)
        : await api.post(endpoint, formData);

      if (response.data.success) {
        toast.success(
          isUpdate
            ? "Request updated successfully!"
            : "Request created successfully!"
        );
        console.log("Response:", response.data);
        handleCancelEdit();
        fetchRequests(); // Refresh all requests
      } else {
        toast.error(response.data.message || "Failed to submit request");
      }
    } catch (error) {
      console.error("Submit error:", error);

      // Enhanced error handling
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message.includes("date")) {
        toast.error("Invalid date format. Please select a valid date");
      } else {
        toast.error(
          "Failed to submit request. Please check all fields and try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setRequestData({
      id: null,
      SHIPA_NO: "", // ADD THIS LINE
      consignee: "",
      consigner: "",
      vehicle_type: "",
      vehicle_size: "",
      vehicle_status: "Empty",
      containers_20ft: 0,
      containers_40ft: 0,
      no_of_vehicles: "",
      total_containers: 0,
      pickup_location: "",
      stuffing_location: "",
      delivery_location: "",
      commodity: "",
      cargo_type: "",
      cargo_weight: "",
      service_type: [],
      service_prices: {},
      expected_pickup_date: "",
      expected_pickup_time: "",
      expected_delivery_date: "",
      expected_delivery_time: "",
      requested_price: "",
      status: "Pending",
      admin_comment: "",
    });
  };
  const canEditRequest = (status) => {
    const normalizedStatus = status.toLowerCase();
    return normalizedStatus !== "completed";
  };

  const handleRequestClick = (request) => {
    if (canEditRequest(request.status)) {
      setRequestData({
        id: request.id,
        SHIPA_NO: request.SHIPA_NO || "", // ADD THIS LINE
        consignee: request.consignee || "",
        consigner: request.consigner || "",
        vehicle_type: request.vehicle_type || "",
        vehicle_size: request.vehicle_size || "",
        vehicle_status: request.vehicle_status || "Empty",
        no_of_vehicles: request.no_of_vehicles || "1",
        pickup_location: request.pickup_location || "",
        stuffing_location: request.stuffing_location || "",
        delivery_location: request.delivery_location || "",
        commodity: request.commodity || "",
        cargo_type: request.cargo_type || "",
        cargo_weight: parseFloat(request.cargo_weight) || 0,
        service_type: Array.isArray(request.service_type)
          ? request.service_type
          : JSON.parse(request.service_type || "[]"),
        service_prices:
          typeof request.service_prices === "string"
            ? JSON.parse(request.service_prices)
            : request.service_prices || {},
        containers_20ft: parseInt(request.containers_20ft) || 0,
        containers_40ft: parseInt(request.containers_40ft) || 0,
        total_containers: parseInt(request.total_containers) || 0,
        expected_pickup_date: request.expected_pickup_date
          ? request.expected_pickup_date.split("T")[0]
          : "",
        expected_delivery_date: request.expected_delivery_date
          ? request.expected_delivery_date.split("T")[0]
          : "",
        requested_price: parseFloat(request.requested_price) || 0,

        status: request.status || "Pending",
        admin_comment: request.admin_comment || "",
      });

      document
        .querySelector(".request-form")
        ?.scrollIntoView({ behavior: "smooth" });
      toast.info("Request loaded for editing");
    } else {
      toast.info("Completed requests cannot be edited");
    }
  };
  // Download invoice handler
  const handleDownloadInvoice = (request) => {
    try {
      const loadingToast = toast.loading("Generating invoice...");
      const doc = generateInvoice(request);

      if (!doc) {
        throw new Error("Failed to generate PDF document");
      }

      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `invoice-${request.id}-${timestamp}.pdf`;
      doc.save(filename);

      toast.dismiss(loadingToast);
      toast.success("Invoice downloaded successfully!");
    } catch (error) {
      console.error("Invoice download error:", error);
      toast.error("Failed to generate invoice. Please try again.");
    }
  };

  // Compact status badge component
  const getStatusBadge = (status) => {
    const statusConfig = {
      Completed: {
        bg: "bg-green-100",
        text: "text-green-700",
        dot: "bg-green-500",
      },
      "In Progress": {
        bg: "bg-blue-100",
        text: "text-blue-700",
        dot: "bg-blue-500",
      },
      Pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        dot: "bg-yellow-500",
      },
    };

    const config = statusConfig[status] || {
      bg: "bg-gray-100",
      text: "text-gray-700",
      dot: "bg-gray-500",
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        <span className={`w-2 h-2 rounded-full mr-1 ${config.dot}`}></span>
        {status}
      </span>
    );
  };

  // Pagination handlers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      updateDisplayedRequests(allRequests, currentPage - 1);
    }
  };

  const handleNextPage = () => {
    const totalPages = getTotalPages();
    if (currentPage < totalPages) {
      updateDisplayedRequests(allRequests, currentPage + 1);
    }
  };

  // Fetch requests on component mount
  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {/* Custom Header matching AdminDashboard style */}
      <header className="bg-white shadow-sm flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleMobileMenu}
            className="text-gray-600 md:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={toggleNotifications}
              className="relative text-gray-600 hover:text-gray-800"
            >
              <Bell className="h-6 w-6" />
              <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50">
                <div className="p-3 border-b">
                  <h3 className="font-medium">Notifications</h3>
                </div>
                <div className="p-4 text-sm text-gray-500">
                  No new notifications
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={toggleUserMenu}
              className="flex items-center text-gray-700 focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                {user?.name?.charAt(0) || <User className="h-5 w-5" />}
              </div>
              <span className="ml-2 hidden md:block">
                {user?.name || "User"}
              </span>
              <ChevronDown className="h-4 w-4 ml-1" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50">
                <div className="py-2 px-4 border-b">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <div className="py-1">
                  <button className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </button>
                  <button className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left flex items-center"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <p className="mt-1 text-sm text-gray-500">
              Welcome back, {user?.name || "Customer"}! Request services and
              manage your shipments
            </p>
          </div>

          <StatsCards />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Service Request Form - Takes 3 columns */}
            <div className="lg:col-span-3 bg-white rounded-lg shadow">
              <div>
                <ServiceRequestForm
                  requestData={requestData}
                  setRequestData={setRequestData}
                  handleSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                  handleCancelEdit={handleCancelEdit}
                />

                <TransporterDetails
                  transportRequestId={requestData.id}
                  numberOfVehicles={requestData.no_of_vehicles}
                  transporterData={transporterData}
                  setTransporterData={setTransporterData}
                  isEditMode={Boolean(requestData.id)}
                  selectedServices={requestData.service_type}
                  vehicleType={requestData.vehicle_type} // Add this line
                />
              </div>
            </div>

            {/* Compact Past Requests - Takes 1 column */}
            <div className="lg:col-span-1 bg-white rounded-lg shadow h-fit">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">
                  Recent Requests
                </h3>
              </div>
              <div className="p-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pastRequests.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">No requests found</p>
                      </div>
                    ) : (
                      pastRequests.map((request) => (
                        <div
                          key={request.id}
                          onClick={() => handleRequestClick(request)}
                          className={`border rounded-lg p-3 transition-all duration-200 ${
                            canEditRequest(request.status)
                              ? "cursor-pointer hover:border-blue-300 hover:shadow-sm"
                              : "cursor-not-allowed opacity-60"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                Booking #{request.id}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(
                                  request.created_at
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1 ml-2">
                              {getStatusBadge(request.status)}
                              {request.status === "approved" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadInvoice(request);
                                  }}
                                  className="text-green-600 hover:text-green-800 p-1 rounded"
                                  title="Download Invoice"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Vehicle:</span>
                              <span className="text-gray-900 font-medium">
                                {request.vehicle_type}
                              </span>
                            </div>

                            <div className="text-xs">
                              <span className="text-gray-500">Services:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(() => {
                                  try {
                                    const services = JSON.parse(
                                      request.service_type || "[]"
                                    );
                                    const serviceArray = Array.isArray(services)
                                      ? services
                                      : [String(services)];
                                    return serviceArray
                                      .slice(0, 2)
                                      .map((service, idx) => (
                                        <span
                                          key={idx}
                                          className="inline-block px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700"
                                        >
                                          {service}
                                        </span>
                                      ));
                                  } catch (error) {
                                    return (
                                      <span className="inline-block px-1.5 py-0.5 rounded text-xs bg-gray-50 text-gray-700">
                                        N/A
                                      </span>
                                    );
                                  }
                                })()}
                              </div>
                            </div>
                          </div>

                          {request.admin_comment && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                              <p className="text-gray-600 font-medium">
                                Admin:
                              </p>
                              <p className="text-gray-700 truncate">
                                {request.admin_comment}
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Pagination */}
                {getTotalPages() > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="flex items-center px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-3 h-3 mr-1" />
                      Prev
                    </button>

                    <span className="text-xs text-gray-500">
                      {currentPage} of {getTotalPages()}
                    </span>

                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === getTotalPages()}
                      className="flex items-center px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
