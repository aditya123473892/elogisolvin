import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../utils/Api";
import {
  Search,
  RefreshCw,
  Eye,
  Download,
  Truck,
  MapPin,
  Package,
} from "lucide-react";
import { generateInvoice } from "../utils/pdfGenerator";
import { generateGR } from "../utils/grGenerator";
import RequestModal from "../Components/Requestmodal"; // Import your extracted modal component

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
      console.log("dahta", response);
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
        console.log("data", response.data);
        setTransporterDetails(
          Array.isArray(response.data.data)
            ? response.data.data
            : [response.data.data]
        );
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

      handleModalClose();
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

      let transporterDetails = null;
      try {
        const response = await api.get(
          `/transport-requests/${request.id}/transporter`
        );
        if (response.data.success) {
          transporterDetails = response.data.data;
          console.log("response", response.data.data);
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

      try {
        const response = await api.get(
          `/transport-requests/${request.id}/transporter`
        );
        if (response.data.success) {
          transporterData = response.data.data;
          console.log("data", response.data.data);
        }
      } catch (error) {
        console.log(
          "Warning: Transporter details not found, continuing with GR generation"
        );
      }

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

  const handleModalClose = () => {
    setSelectedRequest(null);
    setTransporterDetails(null);
    setAdminComment("");
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
                          Booking #{request.id}
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

      {/* Use the extracted RequestModal component */}
      <RequestModal
        selectedRequest={selectedRequest}
        transporterDetails={transporterDetails}
        adminComment={adminComment}
        setAdminComment={setAdminComment}
        updating={updating}
        onClose={handleModalClose}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
}
