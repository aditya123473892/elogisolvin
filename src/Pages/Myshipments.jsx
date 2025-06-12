import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/Api";
import { toast } from "react-toastify";
import { RefreshCw } from "lucide-react";
import ShipmentDetailsModal from "../Components/dashboard/Shipmentsmodal";
import ShipmentFilters from "../Components/Shipmentfilter";
import ShipmentSummary from "../Components/ShipmentSummary";
import ShipmentTable from "../Components/Shipmentstable";

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
        {/* Filters Component */}
        <ShipmentFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          vehicleFilter={vehicleFilter}
          setVehicleFilter={setVehicleFilter}
          dateRange={dateRange}
          setDateRange={setDateRange}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
        />

        {/* Summary Component */}
        <ShipmentSummary shipments={shipments} />

        {/* Table Component */}
        <ShipmentTable
          filteredShipments={filteredShipments}
          onViewDetails={handleViewDetails}
          onDownloadInvoice={handleDownloadInvoice}
        />
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
