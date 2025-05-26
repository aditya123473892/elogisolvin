import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { generateInvoice } from "../utils/pdfGenerator";
import ServiceRequestForm from "../Components/dashboard/Servicerequest";
import { CheckCircle, AlertTriangle, Clock } from "lucide-react";
import api from "../utils/Api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { useLoadScript } from "@react-google-maps/api";
import Header from "../Components/dashboard/Header";
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

  // Simplified request data state
  const [requestData, setRequestData] = useState({
    id: null,
    consignee: "",
    consigner: "",
    vehicle_type: "",
    vehicle_size: "",
    containers_20ft: 0,
    containers_40ft: 0,
    total_containers: 0,
    pickup_location: "",
    stuffing_location: "",
    delivery_location: "",
    commodity: "",
    cargo_type: "",
    cargo_weight: 0,
    service_type: [],
    service_prices: {},
    expected_pickup_date: "",
    expected_delivery_date: "",
    requested_price: 0,
    status: "Pending",
    admin_comment: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pastRequests, setPastRequests] = useState([]);
  const [transporterData, setTransporterData] = useState({
    transporterName: "",
    vehicleNumber: "",
    driverName: "",
    driverContact: "",
  });

  // Load Google Places API
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  // Fetch requests function
  const fetchRequests = async () => {
    try {
      const response = await api.get("/transport-requests/my-requests");
      if (response.data?.success) {
        setPastRequests(response.data.requests);
        console.log("Fetched requests:", response.data.requests);
      } else {
        toast.error("Failed to fetch requests");
      }
    } catch (error) {
      console.error("Fetch requests error:", error);
      toast.error(error.response?.data?.message || "Failed to fetch requests");
    }
  };

  // Handle form submission - CLEANED UP POST REQUEST
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Clean form data preparation
      const formData = {
        consignee: requestData.consignee.trim(),
        consigner: requestData.consigner.trim(),
        vehicle_type: requestData.vehicle_type,
        vehicle_size: requestData.vehicle_size,
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
        expected_delivery_date: requestData.expected_delivery_date,
        requested_price: parseFloat(requestData.requested_price) || 0,
        status: "Pending",
      };

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
        handleCancelEdit();
        fetchRequests(); // Refresh the list
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(error.response?.data?.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form to initial state
  const handleCancelEdit = () => {
    setRequestData({
      id: null,
      consignee: "",
      consigner: "",
      vehicle_type: "",
      vehicle_size: "",
      containers_20ft: 0,
      containers_40ft: 0,
      total_containers: 0,
      pickup_location: "",
      stuffing_location: "",
      delivery_location: "",
      commodity: "",
      cargo_type: "",
      cargo_weight: 0,
      service_type: [],
      service_prices: {},
      expected_pickup_date: "",
      expected_delivery_date: "",
      requested_price: 0,
      status: "Pending",
      admin_comment: "",
    });
  };

  // Handle clicking on a request for editing
  const handleRequestClick = (request) => {
    if (request.status.toLowerCase() === "pending") {
      setRequestData({
        id: request.id,
        consignee: request.consignee || "",
        consigner: request.consigner || "",
        vehicle_type: request.vehicle_type || "",
        vehicle_size: request.vehicle_size || "",
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
      toast.info("Only pending requests can be edited");
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

  // Status badge component
  const getStatusBadge = (status) => {
    const statusConfig = {
      Completed: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: CheckCircle,
      },
      "In Progress": { bg: "bg-blue-100", text: "text-blue-800", icon: Clock },
      Pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        icon: AlertTriangle,
      },
    };

    const config = statusConfig[status] || {
      bg: "bg-gray-100",
      text: "text-gray-800",
      icon: null,
    };
    const Icon = config.icon;

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text} flex items-center`}
      >
        {Icon && <Icon className="w-3 h-3 mr-1" />} {status}
      </span>
    );
  };

  // Progress tracker component
  const renderOrderProgress = (status) => {
    const steps = [
      "Pending",
      "Driver Assigned",
      "Out For Delivery",
      "Completed",
    ];
    const currentStep = steps.indexOf(status) + 1;

    return (
      <div className="w-full mt-2">
        <div className="flex justify-between mb-1 text-xs font-medium">
          <div>Billing Request</div>
          <div>Vehicle Assigned</div>
          <div>Out For Delivery</div>
          <div>Delivered</div>
        </div>
        <div className="flex items-center">
          {steps.map((_, index) => (
            <div key={index} className="flex items-center flex-1">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center ${
                  currentStep > index ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                {currentStep > index + 1 && (
                  <CheckCircle className="w-3 h-3 text-white" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    currentStep > index + 1 ? "bg-blue-600" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Fetch requests on component mount
  useEffect(() => {
    fetchRequests();
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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

      <Header />

      <main className="flex-1 overflow-auto bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Customer Dashboard
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Welcome back, {user?.name || "Customer"}! Request services and
              manage your shipments
            </p>
          </div>

          <StatsCards />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Service Request Form */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {requestData.id ? "Edit Request" : "Request New Journey"}
                </h3>
              </div>
              <div className="p-6">
                <ServiceRequestForm
                  requestData={requestData}
                  setRequestData={setRequestData}
                  handleSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                  handleCancelEdit={handleCancelEdit}
                />

                <TransporterDetails
                  transportRequestId={requestData.id} // Pass the request ID
                  transporterData={transporterData}
                  setTransporterData={setTransporterData}
                  isEditMode={Boolean(requestData.id)} // Optional: indicates if we're editing
                />
              </div>
            </div>

            {/* Past Requests */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Recent Requests
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {pastRequests.map((request) => (
                    <div
                      key={request.id}
                      onClick={() => handleRequestClick(request)}
                      className={`bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow ${
                        request.status === "Pending"
                          ? "hover:border-blue-500"
                          : ""
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">
                          Request #{request.id}
                        </span>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(request.status)}
                          {request.status === "approved" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadInvoice(request);
                              }}
                              className="text-green-600 hover:text-green-800"
                              title="Download Invoice"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="text-sm text-gray-600">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            Date:{" "}
                            {new Date(request.created_at).toLocaleDateString()}
                          </div>
                          <div>Price: ${request.requested_price}</div>
                          <div>Vehicle: {request.vehicle_type}</div>
                          <div>
                            Service:
                            <div className="mt-2 flex flex-wrap gap-1">
                              {(() => {
                                try {
                                  const services = JSON.parse(
                                    request.service_type || "[]"
                                  );
                                  return Array.isArray(services) ? (
                                    services.map((service, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                      >
                                        {service}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {String(services)}
                                    </span>
                                  );
                                } catch (error) {
                                  return (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                      N/A
                                    </span>
                                  );
                                }
                              })()}
                            </div>
                          </div>
                        </div>

                        {request.admin_comment && (
                          <div className="mt-2 p-2 bg-gray-50 rounded">
                            <p className="text-sm font-medium">
                              Admin Comment:
                            </p>
                            <p className="text-sm">{request.admin_comment}</p>
                          </div>
                        )}

                        {renderOrderProgress(request.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
