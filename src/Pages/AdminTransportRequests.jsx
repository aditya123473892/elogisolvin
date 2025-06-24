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
  MapPin,
  Package,
} from "lucide-react";
import { generateInvoice } from "../utils/pdfGenerator";
import { generateGR } from "../utils/grGenerator";



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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Display 10 items per page
  const [editTransporter, setEditTransporter] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get("/transport-requests/all");
      setRequests(response.data.requests);
    } catch (error) {
      toast.error("Failed to fetch transport requests");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransporterDetails = async (requestId) => {
    try {
      const response = await api.get(`/transport-requests/${requestId}/transporter`);
      if (response.data.success) {
        setTransporterDetails(Array.isArray(response.data.data) ? response.data.data : [response.data.data]);
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
      const loadingToast = toast.loading("Generating invoice...");
      let transporterDetails = null;
      try {
        const response = await api.get(`/transport-requests/${request.id}/transporter`);
        if (response.data.success) {
          transporterDetails = response.data.data;
        }
      } catch (error) {
        console.log("No transporter details found");
      }

      const doc = generateInvoice(request, transporterDetails);
      if (!doc) throw new Error("Failed to generate PDF document");

      const timestamp = new Date().toISOString().split("T")[0];
      doc.save(`invoice-${request.id}-${timestamp}.pdf`);
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
        const response = await api.get(`/transport-requests/${request.id}/transporter`);
        if (response.data.success) {
          transporterData = response.data.data;
        }
      } catch (error) {
        console.log("Warning: Transporter details not found");
      }

      const doc = generateGR(request, transporterData);
      const timestamp = new Date().toISOString().split("T")[0];
      doc.save(`gr-${request.id}-${timestamp}.pdf`);
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

  const handleUpdateTransporter = async (transporter) => {
    if ((transporter.container_no)) {
      toast.error("Invalid container number. Must be 4 letters followed by 7 digits (ISO 6346).");
      return;
    }
    try {
      await api.put(`/transport-requests/${selectedRequest.id}/transporter`, transporter);
      toast.success("Transporter details updated successfully!");
      setEditTransporter(null);
      fetchTransporterDetails(selectedRequest.id);
    } catch (error) {
      toast.error("Failed to update transporter details.");
    }
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id.toString().includes(searchTerm) ||
      request.commodity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.pickup_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.delivery_location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "in progress": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-purple-100 text-purple-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRequests = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Transport Requests</h2>
          <p className="text-sm text-gray-500">Manage and review transport requests</p>
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border rounded-md text-sm focus:ring-2 focus:ring-blue-500"
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
              className="pl-8 pr-3 py-1.5 border rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
          </div>
          <button
            onClick={fetchRequests}
            className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Request</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Service</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Locations</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Details</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 text-blue-600 mr-2" />
                      <div>
                        <div className="font-medium text-gray-900">#{request.id}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="text-gray-900">{request.customer_name}</div>
                    <div className="text-xs text-gray-500 truncate" title={request.customer_email}>
                      {request.customer_email}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center">
                      <Truck className="h-4 w-4 mr-1" />
                      <span>{request.vehicle_type}</span>
                    </div>
                    <div className="text-xs text-gray-500">{request.commodity}</div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="text-xs" title={request.pickup_location}>
                      <MapPin className="h-3 w-3 inline text-green-600 mr-1" />
                      <span className="truncate">{request.pickup_location}</span>
                    </div>
                    <div className="text-xs" title={request.delivery_location}>
                      <MapPin className="h-3 w-3 inline text-red-600 mr-1" />
                      <span className="truncate">{request.delivery_location}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="text-gray-900">₹{request.requested_price}</div>
                    <div className="text-xs text-gray-500">Weight: {request.cargo_weight}kg</div>
                    {(request.containers_20ft > 0 || request.containers_40ft > 0) && (
                      <div className="text-xs text-gray-500">
                        {request.containers_20ft}×20ft, {request.containers_40ft}×40ft
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                      {request.status || "pending"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewRequest(request)}
                        className="text-blue-600 hover:text-blue-900 flex items-center text-sm"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </button>
                      {request.status === "approved" && (
                        <>
                          <button
                            onClick={() => handleDownloadInvoice(request)}
                            className="text-green-600 hover:text-green-900 flex items-center text-sm"
                            title="Download Invoice"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Invoice
                          </button>
                          <button
                            onClick={() => handleDownloadGR(request)}
                            className="text-green-600 hover:text-green-900 flex items-center text-sm"
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
          <div className="text-center py-8">
            <Package className="mx-auto h-8 w-8 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No requests found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? "Try adjusting your search terms." : "No transport requests available."}
            </p>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredRequests.length > 0 && (
          <div className="flex justify-between items-center px-4 py-3 border-t">
            <div className="text-sm text-gray-600">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredRequests.length)} of {filteredRequests.length} requests
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => paginate(page)}
                  className={`px-3 py-1 border rounded-md text-sm ${
                    currentPage === page ? "bg-blue-600 text-white" : "hover:bg-gray-100"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[85vh] overflow-auto">
            <div className="sticky top-0 bg-white px-4 py-3 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Request #{selectedRequest.id}
                </h3>
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setTransporterDetails(null);
                    setAdminComment("");
                    setEditTransporter(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Service Request Details */}
                <div className="bg-gray-50 rounded-md p-4">
                  <h4 className="text-base font-medium text-gray-900 mb-3 flex items-center">
                    <Package className="h-4 w-4 mr-1" />
                    Request Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Customer Name</label>
                        <div>{selectedRequest.customer_name}</div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Email</label>
                        <div className="truncate" title={selectedRequest.customer_email}>
                          {selectedRequest.customer_email}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Consignee</label>
                        <div>{selectedRequest.consignee}</div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Consigner</label>
                        <div>{selectedRequest.consigner}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Vehicle Type</label>
                        <div>{selectedRequest.vehicle_type}</div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Commodity</label>
                        <div>{selectedRequest.commodity}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Weight (kg)</label>
                        <div>{selectedRequest.cargo_weight}</div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">20ft Containers</label>
                        <div>{selectedRequest.containers_20ft}</div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">40ft Containers</label>
                        <div>{selectedRequest.containers_40ft}</div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Service Types</label>
                      <div className="flex flex-wrap gap-1">
                        {parseServiceType(selectedRequest.service_type).map((service, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Locations</label>
                      <div className="text-xs">
                        <div title={selectedRequest.pickup_location}>
                          <MapPin className="h-3 w-3 inline text-green-600 mr-1" />
                          <span className="truncate">{selectedRequest.pickup_location}</span>
                        </div>
                        <div title={selectedRequest.delivery_location}>
                          <MapPin className="h-3 w-3 inline text-red-600 mr-1" />
                          <span className="truncate">{selectedRequest.delivery_location}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Price</label>
                      <div className="font-semibold">₹{selectedRequest.requested_price}</div>
                    </div>
                  </div>
                </div>

                {/* Transporter Details */}
                <div className="bg-blue-50 rounded-md p-4">
                  <h4 className="text-base font-medium text-gray-900 mb-3 flex items-center">
                    <Truck className="h-4 w-4 mr-1" />
                    Transporter Details
                  </h4>
                  {transporterDetails && transporterDetails.length > 0 ? (
                    <div className="space-y-3">
                      {transporterDetails.map((transporter, index) => (
                        <div key={transporter.id || index} className="bg-white p-3 rounded-md border">
                          {editTransporter && editTransporter.id === transporter.id ? (
                            <div className="space-y-2">
                              <div>
                                <label className="block text-xs font-medium text-gray-700">Container Number</label>
                                <input
                                  type="text"
                                  value={editTransporter.container_no || ""}
                                  onChange={(e) =>
                                    setEditTransporter({ ...editTransporter, container_no: e.target.value.toUpperCase() })
                                  }
                                  className="w-full border rounded-md px-2 py-1 text-sm"
                                  placeholder="e.g., ABCD1234567"
                                  maxLength={11}
                                />
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleUpdateTransporter(editTransporter)}
                                  className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditTransporter(null)}
                                  className="px-3 py-1 border rounded-md text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <h5 className="font-medium text-gray-900">
                                Vehicle {index + 1} {transporter.vehicle_sequence ? `(Seq: ${transporter.vehicle_sequence})` : ''}
                              </h5>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700">Name</label>
                                  <div>{transporter.transporter_name}</div>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700">Vehicle</label>
                                  <div>{transporter.vehicle_number}</div>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700">Driver</label>
                                  <div>{transporter.driver_name}</div>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700">Container</label>
                                  <div>{transporter.container_no || "N/A"}</div>
                                </div>
                              </div>
                              <button
                                onClick={() => setEditTransporter(transporter)}
                                className="mt-2 text-blue-600 hover:text-blue-900 text-sm"
                              >
                                Edit
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Truck className="mx-auto h-8 w-8 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No Transporter Details</h3>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Review */}
              <div className="mt-4 bg-gray-50 rounded-md p-4">
                <h4 className="text-base font-medium text-gray-900 mb-3">Admin Review</h4>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700">Status</label>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedRequest.status)}`}>
                    {selectedRequest.status || "pending"}
                  </span>
                </div>
                {selectedRequest.admin_comment && (
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700">Previous Comment</label>
                    <div className="bg-white p-2 rounded border text-sm">{selectedRequest.admin_comment}</div>
                  </div>
                )}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700">New Comment</label>
                  <textarea
                    className="w-full border rounded-md p-2 text-sm"
                    rows="3"
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    placeholder="Enter your comment..."
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setSelectedRequest(null);
                      setTransporterDetails(null);
                      setAdminComment("");
                      setEditTransporter(null);
                    }}
                    className="px-4 py-1 border rounded-md text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedRequest.id, "rejected")}
                    disabled={updating}
                    className="px-4 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 disabled:bg-red-400 flex items-center"
                  >
                    {updating ? <div className="animate-spin h-4 w-4 border-t-2 border-white mr-1"></div> : <XCircle className="h-4 w-4 mr-1" />}
                    {updating ? "Updating..." : "Reject"}
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedRequest.id, "approved")}
                    disabled={updating}
                    className="px-4 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:bg-green-400 flex items-center"
                  >
                    {updating ? <div className="animate-spin h-4 w-4 border-t-2 border-white mr-1"></div> : <CheckCircle className="h-4 w-4 mr-1" />}
                    {updating ? "Updating..." : "Approve"}
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedRequest.id, "in progress")}
                    disabled={updating}
                    className="px-4 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:bg-blue-400 flex items-center"
                  >
                    {updating ? <div className="animate-spin h-4 w-4 border-t-2 border-white mr-1"></div> : <AlertCircle className="h-4 w-4 mr-1" />}
                    {updating ? "Updating..." : "In Progress"}
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedRequest.id, "completed")}
                    disabled={updating}
                    className="px-4 py-1 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 disabled:bg-purple-400 flex items-center"
                  >
                    {updating ? <div className="animate-spin h-4 w-4 border-t-2 border-white mr-1"></div> : <CheckCircle className="h-4 w-4 mr-1" />}
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