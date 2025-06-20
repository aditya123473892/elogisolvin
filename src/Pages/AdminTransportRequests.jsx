import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../utils/Api";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  Download,
  Truck,
  // Remove these unused imports
  // User,
  MapPin,
  // Calendar,
  Package,
  DollarSign,
} from "lucide-react";
import { generateInvoice } from "../utils/pdfGenerator";
import { generateGR } from "../utils/grGenerator";
import { data } from "react-router-dom";

const parseServiceType = (serviceType) => {
  if (!serviceType) return [];
  try {
    return typeof serviceType === "string"
      ? JSON.parse(serviceType)
      : serviceType;
  } catch (e) {
    console.error("Error parsing service type:", e);
    return [];
  }
};

const parseServicePrices = (servicePrices) => {
  if (!servicePrices) return {};
  try {
    return typeof servicePrices === "string"
      ? JSON.parse(servicePrices)
      : servicePrices;
  } catch (e) {
    console.error("Error parsing service prices:", e);
    return {};
  }
};

export default function AdminTransportRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [transporterDetails, setTransporterDetails] = useState(null);
  const [adminComment, setAdminComment] = useState("");
  const [updating, setUpdating] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchRequests = async () => {
    try {
      const response = await api.get("/transport-requests/all");
      setRequests(response.data.requests);
      console.log("dahta",response)
    } catch (error) {
      toast.error("Failed to fetch transport requests");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransporterDetails = async (requestId) => {
    try {
      const response = await api.get(
        `/transport-requests/${requestId}/transporter`
      );
      if (response.data.success) {
        console.log("data" ,response.data)
        // Update to handle multiple transporters
        setTransporterDetails(Array.isArray(response.data.data) ? 
          response.data.data : [response.data.data]);
      } else {
        setTransporterDetails(null);
      }
    } catch (error) {
      console.log("No transporter details found for request:", requestId);
      setTransporterDetails(null);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusUpdate = async (requestId, status) => {
    try {
      setUpdating(true);

      await api.put(`/transport-requests/${requestId}/status`, {
        status,
        adminComment: adminComment.trim(),
      });

      if (status === "approved" && transporterDetails) {
        const loadingToast = toast.loading("Generating GR...");
        const doc = generateGR(selectedRequest, transporterDetails);
        const timestamp = new Date().toISOString().split("T")[0];
        doc.save(`gr-${requestId}-${timestamp}.pdf`);
        toast.dismiss(loadingToast);
        toast.success("GR generated successfully!");
      }

      setSelectedRequest(null);
      setAdminComment("");
      fetchRequests();
      toast.success(`Request ${status} successfully`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(error.message || "Failed to update request status");
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadInvoice = async (request) => {
    try {
      console.log("Starting invoice download for request:", request.id);
      const loadingToast = toast.loading("Generating invoice...");

      // Fetch transporter details if not already loaded
      let transporterDetails = null;
      try {
        const response = await api.get(
          `/transport-requests/${request.id}/transporter`
        );
        

        if (response.data.success) {
          transporterDetails = response.data.data;
          console.log("response",response.data.data)
        }
      } catch (error) {
        console.log("No transporter details found");
      }

      const doc = generateInvoice(request, transporterDetails);

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

  const handleDownloadGR = async (request) => {
    try {
      const loadingToast = toast.loading("Generating GR...");
      let transporterData = null;

      // Try to fetch transporter details, but continue even if not found
      try {
        const response = await api.get(
          `/transport-requests/${request.id}/transporter`
        );
        if (response.data.success) {
          transporterData = response.data.data;
          console.log("data" ,response.data.data)
        }
      } catch (error) {
        console.log(
          "Warning: Transporter details not found, continuing with GR generation"
        );
      }

      // Generate GR with or without transporter details
      const doc = generateGR(request, transporterData);
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `gr-${request.id}-${timestamp}.pdf`;

      doc.save(filename);
      toast.dismiss(loadingToast);
      toast.success("GR downloaded successfully!");
    } catch (error) {
      console.error("GR generation error:", error);
      toast.error("Failed to generate GR. Please try again.");
    }
  };

  const handleViewRequest = async (request) => {
    setSelectedRequest(request);
    setAdminComment(request.admin_comment || "");
    await fetchTransporterDetails(request.id);
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.customer_email
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      request.id.toString().includes(searchTerm) ||
      request.commodity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.pickup_location
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      request.delivery_location
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "in progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Transport Requests
          </h2>
          <p className="text-gray-600 mt-1">
            Manage and review transport requests with detailed information
          </p>
        </div>
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="in progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <div className="relative">
            <input
              type="text"
              placeholder="Search requests..."
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <button
            onClick={fetchRequests}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Request Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service & Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Locations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pricing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          Request #{request.id}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {request.customer_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {request.customer_email}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Consignee: {request.consignee}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 flex items-center">
                        <Truck className="h-4 w-4 mr-1" />
                        {request.vehicle_type} ({request.vehicle_size})
                      </div>
                      <div className="text-sm text-gray-500">
                        {request.commodity}
                      </div>
                      <div className="mt-1">
                        {parseServiceType(request.service_type).map(
                          (service, idx) => (
                            <span
                              key={idx}
                              className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-1 mb-1"
                            >
                              {service}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center mb-1">
                        <MapPin className="h-3 w-3 mr-1 text-green-600" />
                        <span className="font-medium">From:</span>
                      </div>
                      <div className="text-xs text-gray-600 mb-2 ml-4">
                        {request.pickup_location}
                      </div>
                      <div className="flex items-center mb-1">
                        <MapPin className="h-3 w-3 mr-1 text-red-600" />
                        <span className="font-medium">To:</span>
                      </div>
                      <div className="text-xs text-gray-600 ml-4">
                        {request.delivery_location}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                     
                      <div className="text-xs text-gray-500 mt-1">
                        Weight: {request.cargo_weight}kg
                      </div>
                      {(request.containers_20ft > 0 ||
                        request.containers_40ft > 0) && (
                        <div className="text-xs text-gray-500">
                          Containers: {request.containers_20ft}×20ft,{" "}
                          {request.containers_40ft}×40ft
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        request.status
                      )}`}
                    >
                      {request.status || "pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewRequest(request)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </button>
                      {request.status === "approved" && (
                        <>
                          <button
                            onClick={() => handleDownloadInvoice(request)}
                            className="text-green-600 hover:text-green-900 flex items-center"
                            title="Download Invoice"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Invoice
                          </button>
                          <button
                            onClick={() => handleDownloadGR(request)}
                            className="text-green-600 hover:text-green-900 flex items-center ml-2"
                            title="Download GR"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            GR
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No requests found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm
                ? "Try adjusting your search terms."
                : "No transport requests available."}
            </p>
          </div>
        )}
      </div>

      {/* Detailed Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  Request #{selectedRequest.id} - Complete Details
                </h3>
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setTransporterDetails(null);
                    setAdminComment("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Service Request Details */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Service Request Details
                  </h4>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Customer Name
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedRequest.customer_name}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Customer Email
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedRequest.customer_email}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Consignee
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedRequest.consignee}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Consigner
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedRequest.consigner}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Vehicle Type
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedRequest.vehicle_type}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Vehicle Size
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedRequest.vehicle_size}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Commodity
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedRequest.commodity}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Cargo Type
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedRequest.cargo_type}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Cargo Weight (kg)
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedRequest.cargo_weight}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          20ft Containers
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedRequest.containers_20ft}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          40ft Containers
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedRequest.containers_40ft}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service Types
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {parseServiceType(selectedRequest.service_type).map(
                          (service, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {service}
                            </span>
                          )
                        )}
                      </div>
                    </div>

               
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Pickup Location
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedRequest.pickup_location}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Stuffing Location
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedRequest.stuffing_location}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Delivery Location
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedRequest.delivery_location}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Expected Pickup Date
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedRequest.expected_pickup_date
                            ? new Date(
                                selectedRequest.expected_pickup_date
                              ).toLocaleDateString()
                            : "Not specified"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Expected Delivery Date
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedRequest.expected_delivery_date
                            ? new Date(
                                selectedRequest.expected_delivery_date
                              ).toLocaleDateString()
                            : "Not specified"}
                        </div>
                      </div>
                    </div>

                    <div>
                    
                      <div className="text-lg font-semibold text-gray-900">
                        ₹{selectedRequest.requested_price}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transporter Details */}
                <div className="bg-blue-50 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Truck className="h-5 w-5 mr-2" />
                    Transporter Details
                  </h4>

                  {transporterDetails && transporterDetails.length > 0 ? (
                    <div className="space-y-6">
                      {transporterDetails.map((transporter, index) => (
                        <div key={transporter.id || index} className="bg-white p-4 rounded-lg border mb-4">
                          <h5 className="font-medium text-gray-900 mb-3">
                            Vehicle {index + 1} {transporter.vehicle_sequence ? `(Sequence: ${transporter.vehicle_sequence})` : ''}
                          </h5>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Transporter Name
                              </label>
                              <div className="text-sm text-gray-900">
                                {transporter.transporter_name}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Vehicle Number
                              </label>
                              <div className="text-sm text-gray-900">
                                {transporter.vehicle_number}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Driver Name
                              </label>
                              <div className="text-sm text-gray-900">
                                {transporter.driver_name}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Driver Contact
                              </label>
                              <div className="text-sm text-gray-900">
                                {transporter.driver_contact}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                License Number
                              </label>
                              <div className="text-sm text-gray-900">
                                {transporter.license_number}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                License Expiry
                              </label>
                              <div className="text-sm text-gray-900">
                                {transporter.license_expiry
                                  ? new Date(transporter.license_expiry).toLocaleDateString()
                                  : "Not specified"}
                              </div>
                            </div>
                          </div>
                          
                          {/* Container Details */}
                          {transporter.container_no && (
                            <div className="mt-4 pt-4 border-t">
                              <h6 className="font-medium text-gray-900 mb-2">Container Details</h6>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">
                                    Container Number
                                  </label>
                                  <div className="text-sm text-gray-900">
                                    {transporter.container_no}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">
                                    Line
                                  </label>
                                  <div className="text-sm text-gray-900">
                                    {transporter.line}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">
                                    Seal Number
                                  </label>
                                  <div className="text-sm text-gray-900">
                                    {transporter.seal_no}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-4 pt-4 border-t">
                            <h6 className="font-medium text-gray-900 mb-2">Charges</h6>
                            <div className="text-sm text-gray-900">
                              <div className="font-semibold text-gray-900">
                                Total Charge: ₹{transporter.total_charge}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Truck className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No Transporter Details
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Transporter details have not been assigned yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Comment and Actions */}
              <div className="mt-6 bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Admin Review
                </h4>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Status
                  </label>
                  <span
                    className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(
                      selectedRequest.status
                    )}`}
                  >
                    {selectedRequest.status || "pending"}
                  </span>
                </div>

                {selectedRequest.admin_comment && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Previous Admin Comment
                    </label>
                    <div className="bg-white p-3 rounded border text-sm text-gray-900">
                      {selectedRequest.admin_comment}
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Admin Comment *
                  </label>
                  <textarea
                    className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="4"
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    placeholder="Enter your comment about this request..."
                    required
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setSelectedRequest(null);
                      setTransporterDetails(null);
                      setAdminComment("");
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      handleStatusUpdate(selectedRequest.id, "rejected")
                    }
                    disabled={updating}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 focus:ring-2 focus:ring-red-500 flex items-center"
                  >
                    {updating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    {updating ? "Updating..." : "Reject"}
                  </button>
                  <button
                    onClick={() =>
                      handleStatusUpdate(selectedRequest.id, "approved")
                    }
                    disabled={updating}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 focus:ring-2 focus:ring-green-500 flex items-center"
                  >
                    {updating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    {updating ? "Updating..." : "Approve"}
                  </button>
                  <button
                    onClick={() =>
                      handleStatusUpdate(selectedRequest.id, "in progress")
                    }
                    disabled={updating}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 focus:ring-2 focus:ring-blue-500 flex items-center"
                  >
                    {updating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                    ) : (
                      <AlertCircle className="h-4 w-4 mr-2" />
                    )}
                    {updating ? "Updating..." : "In Progress"}
                  </button>
                  <button
                    onClick={() =>
                      handleStatusUpdate(selectedRequest.id, "completed")
                    }
                    disabled={updating}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 focus:ring-2 focus:ring-purple-500 flex items-center"
                  >
                    {updating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    {updating ? "Updating..." : "Complete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
