import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/Api";
import { toast } from "react-toastify";
import {
  Search,
  Filter,
  Calendar,
  Truck,
  Package,
  Download,
  Eye,
  RefreshCw,
} from "lucide-react";
import ShipmentDetailsModal from "../Components/dashboard/Shipmentsmodal";
const ShipmentsPage = () => {
  const [shipments, setShipments] = useState([]);
  const [filteredShipments, setFilteredShipments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const response = await api.get("/transport-requests/my-requests");
      if (response.data?.success) {
        setShipments(response.data.requests);
        setFilteredShipments(response.data.requests);
        console.log("Fetched shipments:", response.data.requests);
      }
    } catch (error) {
      console.error("Error fetching shipments:", error);
      toast.error("Failed to fetch shipments");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = shipments.filter((shipment) => {
      const matchesSearch =
        String(shipment.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(shipment.tracking_id)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(shipment.pickup_location)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(shipment.delivery_location)
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || shipment.status === statusFilter;
      const matchesVehicle =
        vehicleFilter === "all" || shipment.vehicle_type === vehicleFilter;

      let matchesDate = true;
      if (dateRange.from && dateRange.to) {
        const shipmentDate = new Date(shipment.created_at);
        const fromDate = new Date(dateRange.from);
        const toDate = new Date(dateRange.to);
        matchesDate = shipmentDate >= fromDate && shipmentDate <= toDate;
      }

      return matchesSearch && matchesStatus && matchesVehicle && matchesDate;
    });

    // Sort filtered results
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "created_at" || sortBy === "estimated_delivery") {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      } else if (sortBy === "requested_price") {
        aValue = parseFloat(aValue || 0);
        bValue = parseFloat(bValue || 0);
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredShipments(filtered);
  }, [
    shipments,
    searchTerm,
    statusFilter,
    vehicleFilter,
    dateRange,
    sortBy,
    sortOrder,
  ]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      approved: { color: "bg-green-100 text-green-800", label: "Approved" },
      in_transit: { color: "bg-blue-100 text-blue-800", label: "In Transit" },
      delivered: { color: "bg-green-100 text-green-800", label: "Delivered" },
      cancelled: { color: "bg-red-100 text-red-800", label: "Cancelled" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return "✓";
      case "in_transit":
        return "🚛";
      case "delivered":
        return "📦";
      case "cancelled":
        return "✗";
      default:
        return "⏳";
    }
  };

  const parseServices = (serviceString) => {
    try {
      const services = JSON.parse(serviceString || "[]");
      return Array.isArray(services) ? services : [String(services)];
    } catch {
      return ["N/A"];
    }
  };

  const handleViewDetails = (shipment) => {
    setSelectedShipment(shipment);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedShipment(null);
  };

  const handleDownloadInvoice = (shipment) => {
    alert(`Downloading invoice for shipment ${shipment.id}`);
  };

  const refreshData = () => {
    setIsLoading(true);
    fetchShipments();
    toast.success("Shipments data refreshed successfully");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading shipments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Shipments Management
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Track and manage all your shipments in one place
                </p>
              </div>
              <button
                onClick={refreshData}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search shipments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Vehicle Filter */}
              <select
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Vehicles</option>
                <option value="Truck">Truck</option>
                <option value="Van">Van</option>
                <option value="Heavy Truck">Heavy Truck</option>
                <option value="Mini Truck">Mini Truck</option>
              </select>

              {/* Sort */}
              <div className="flex space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="created_at">Date Created</option>
                  <option value="requested_price">Price</option>
                  <option value="status">Status</option>
                </select>
                <button
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </button>
              </div>
            </div>

            {/* Date Range */}
            <div className="flex items-center space-x-4">
              <Calendar className="text-gray-400 w-4 h-4" />
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) =>
                  setDateRange({ ...dateRange, from: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) =>
                  setDateRange({ ...dateRange, to: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {[
            {
              label: "Total Shipments",
              value: shipments.length,
              color: "blue",
            },
            {
              label: "Pending",
              value: shipments.filter((s) => s.status === "pending").length,
              color: "yellow",
            },
            {
              label: "In Transit",
              value: shipments.filter((s) => s.status === "in_transit").length,
              color: "purple",
            },
            {
              label: "Delivered",
              value: shipments.filter((s) => s.status === "delivered").length,
              color: "green",
            },
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-md bg-${stat.color}-100`}>
                  <Package className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Shipments List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              All Shipments ({filteredShipments.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shipment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle & Services
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
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
                {filteredShipments.map((shipment) => (
                  <tr key={shipment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {shipment.id}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(shipment.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-400">
                          {shipment.tracking_id}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">
                          From: {shipment.pickup_location}
                        </div>
                        <div className="text-gray-500">
                          To: {shipment.delivery_location}
                        </div>
                        {shipment.driver_name && (
                          <div className="text-xs text-blue-600 mt-1">
                            Driver: {shipment.driver_name}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center mb-2">
                        <Truck className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium">
                          {shipment.vehicle_type} ({shipment.vehicle_size} ft) ×{" "}
                          {shipment.no_of_vehicles}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {shipment.total_containers > 0 && (
                          <div>
                            Containers:{" "}
                            {shipment.containers_20ft > 0 &&
                              `${shipment.containers_20ft}×20ft`}
                            {shipment.containers_20ft > 0 &&
                              shipment.containers_40ft > 0 &&
                              ", "}
                            {shipment.containers_40ft > 0 &&
                              `${shipment.containers_40ft}×40ft`}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          ₹{shipment.requested_price}
                        </div>
                        <div className="text-gray-500">
                          ₹
                          {(
                            shipment.requested_price / shipment.no_of_vehicles
                          ).toFixed(2)}{" "}
                          per vehicle
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="mr-2">
                          {getStatusIcon(shipment.status)}
                        </span>
                        {getStatusBadge(shipment.status)}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDetails(shipment)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {shipment.status === "delivered" && (
                          <button
                            onClick={() => handleDownloadInvoice(shipment)}
                            className="text-green-600 hover:text-green-900"
                            title="Download Invoice"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredShipments.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No shipments found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal for shipment details */}
      {showModal && selectedShipment && (
        <ShipmentDetailsModal
          shipment={selectedShipment}
          onClose={handleCloseModal}
          onDownloadInvoice={handleDownloadInvoice}
        />
      )}
    </div>
  );
};

export default ShipmentsPage;
