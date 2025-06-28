import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/Api";
import { toast } from "react-toastify";
import { RefreshCw } from "lucide-react";
import ShipmentDetailsModal from "../Components/dashboard/Shipmentsmodal";
import ShipmentFilters from "../Components/Shipmentfilter";
import ShipmentSummary from "../Components/ShipmentSummary";
import ShipmentTable from "../Components/Shipmentstable";
import { transporterAPI, transporterListAPI } from "../utils/Api";

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
  const [containerDetails, setContainerDetails] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingContainerDetails, setIsLoadingContainerDetails] =
    useState(false);
  const { user } = useAuth();
  const [vehicleDataList, setVehicleDataList] = useState([]);
  const [services, setServices] = useState([]);
  const [numberOfVehicles, setNumberOfVehicles] = useState(1);
  const [transportRequestId, setTransportRequestId] = useState(null);

  useEffect(() => {
    fetchShipments();
  }, []);

  const initializeVehicleData = (count) => {
    return Array(count)
      .fill()
      .map((_, index) => ({
        id: null,
        vehicleIndex: index + 1,
        transporterName: "",
        vehicleNumber: "",
        driverName: "",
        driverContact: "",
        licenseNumber: "",
        licenseExpiry: "",
        baseCharge: "",
        additionalCharges: "",
        totalCharge: 0,
        serviceCharges: {},
        containerNo: "",
        line: "",
        sealNo: "",
        numberOfContainers: "",
        seal1: "",
        seal2: "",
        containerTotalWeight: "",
        cargoTotalWeight: "",
        containerType: "",
        containerSize: "",
      }));
  };

  // Helper function to calculate total amount for a request
  const calculateRequestTotalAmount = (containerDetails) => {
    if (!Array.isArray(containerDetails) || containerDetails.length === 0) {
      return 0;
    }

    return containerDetails.reduce((total, detail) => {
      const vehicleTotal = parseFloat(detail.total_charge || 0);
      return total + vehicleTotal;
    }, 0);
  };

  const loadTransporterDetails = async (requestId) => {
    if (!requestId) return [];

    setIsLoadingContainerDetails(true);
    try {
      const response = await transporterAPI.getTransporterByRequestId(
        requestId
      );

      if (response.success) {
        console.log("Container details response:", response);
        const details = Array.isArray(response.data)
          ? response.data
          : [response.data];

        // Map the API response to match the expected format for the modal
        const mappedContainerDetails = details.map((detail, index) => ({
          id: detail.id,
          driver_name: detail.driver_name || "",
          driver_contact: detail.driver_contact || "",
          vehicle_number: detail.vehicle_number || "",
          transporter_name: detail.transporter_name || "",
          container_no: detail.container_no || "",
          container_size: detail.container_size || "",
          container_type: detail.container_type || "",
          number_of_containers: detail.number_of_containers || "",
          container_total_weight: detail.container_total_weight || 0,
          license_number: detail.license_number || "",
          license_expiry: detail.license_expiry || "",
          seal1: detail.seal1 || "",
          seal2: detail.seal2 || "",
          line: detail.line || "",
          base_charge: detail.base_charge || 0,
          additional_charges: detail.additional_charges || 0,
          total_charge: detail.total_charge || 0,
          service_charges: detail.service_charges || "{}",
        }));

        // Filter unique vehicles based on vehicle_number
        const uniqueVehicles = [];
        const vehicleMap = new Map();

        mappedContainerDetails.forEach((detail) => {
          if (detail.vehicle_number && !vehicleMap.has(detail.vehicle_number)) {
            vehicleMap.set(detail.vehicle_number, detail);
            uniqueVehicles.push(detail);
          }
        });

        // Calculate the total amount for this request (using only unique vehicles)
        const requestTotalAmount = calculateRequestTotalAmount(uniqueVehicles);
        console.log(
          `Total amount for request ${requestId} (unique vehicles):`,
          requestTotalAmount
        );

        // Fetch transaction data for this request
        try {
          const transactionResponse = await api.get(
            `/transactions/request/${requestId}`
          );
          if (
            transactionResponse.data.success &&
            transactionResponse.data.data.length > 0
          ) {
            // Add transaction data to the first container detail
            const transaction = transactionResponse.data.data[0];
            if (uniqueVehicles.length > 0) {
              uniqueVehicles[0].transaction = transaction;

              // Compare transaction amount with calculated total
              const transactionAmount = parseFloat(
                transaction.transporter_charge || 0
              );
              if (transactionAmount !== requestTotalAmount) {
                console.warn(
                  `Amount mismatch for request ${requestId}: Transaction amount: ${transactionAmount}, Calculated total: ${requestTotalAmount}`
                );
              }
            }
          }
        } catch (transactionError) {
          console.log("No transaction data found for request:", requestId);
        }

        // Add the calculated total amount to each detail for reference
        uniqueVehicles.forEach((detail) => {
          detail.request_total_amount = requestTotalAmount;
          detail.individual_vehicle_charge = detail.total_charge; // Keep individual charge separate
        });

        return uniqueVehicles;
      }
      return [];
    } catch (error) {
      if (error.status === 404 || error.message?.includes("not found")) {
        console.log(
          "No existing transporter details found for request:",
          requestId
        );
        return [];
      } else {
        console.error("Error loading transporter details:", error);
        toast.error(error.message || "Error loading container details");
        return [];
      }
    } finally {
      setIsLoadingContainerDetails(false);
    }
  };

  const fetchShipments = async () => {
    try {
      const response = await api.get("/transport-requests/my-requests");
      if (response.data?.success) {
        // Process shipments to include calculated total amounts
        const shipmentsWithTotals = await Promise.all(
          response.data.requests.map(async (shipment) => {
            try {
              // Fetch transporter details for each shipment to calculate total
              const transporterResponse =
                await transporterAPI.getTransporterByRequestId(shipment.id);
              if (transporterResponse.success) {
                const details = Array.isArray(transporterResponse.data)
                  ? transporterResponse.data
                  : [transporterResponse.data];

                // Filter unique vehicles based on vehicle_number
                const uniqueVehicles = [];
                const vehicleMap = new Map();

                details.forEach((detail) => {
                  if (
                    detail.vehicle_number &&
                    !vehicleMap.has(detail.vehicle_number)
                  ) {
                    vehicleMap.set(detail.vehicle_number, detail);
                    uniqueVehicles.push(detail);
                  }
                });

                const calculatedTotal =
                  calculateRequestTotalAmount(uniqueVehicles);

                return {
                  ...shipment,
                  requested_price: calculatedTotal, // Override requested_price with calculated total
                  original_requested_price: shipment.requested_price, // Keep original for reference
                  vehicle_count: uniqueVehicles.length, // Use unique vehicle count
                };
              }
            } catch (error) {
              console.log(
                `No transporter details found for shipment ${shipment.id}`
              );
            }

            return {
              ...shipment,
              requested_price: parseFloat(shipment.requested_price || 0),
              original_requested_price: shipment.requested_price,
              vehicle_count: shipment.no_of_vehicles || 1,
            };
          })
        );

        setShipments(shipmentsWithTotals);
        setFilteredShipments(shipmentsWithTotals);
        console.log(
          "Fetched shipments with calculated totals (unique vehicles):",
          shipmentsWithTotals
        );
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

  const handleViewDetails = async (shipment) => {
    setSelectedShipment(shipment);
    setTransportRequestId(shipment.id);
    setNumberOfVehicles(shipment.no_of_vehicles || 1);

    // Load container details before showing modal
    const containerData = await loadTransporterDetails(shipment.id);

    // Calculate the total amount from container details
    const requestTotalAmount = calculateRequestTotalAmount(containerData);

    // Ensure each container detail has the correct total amount
    const updatedContainerData = containerData.map((detail) => ({
      ...detail,
      request_total_amount: requestTotalAmount, // Use the calculated requestTotalAmount
      total_charge: detail.total_charge || 0,
    }));

    setContainerDetails(updatedContainerData);

    // Update the selected shipment with the calculated total amount
    const updatedShipment = {
      ...shipment,
      total_amount: requestTotalAmount, // Pass requestTotalAmount as total_amount
      vehicle_total_amount: requestTotalAmount,
      requested_price: requestTotalAmount, // Also update requested_price if needed
    };

    setSelectedShipment(updatedShipment);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedShipment(null);
    setContainerDetails([]);
    setTransportRequestId(null);
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
          shipment={{
            ...selectedShipment,
            total_amount: selectedShipment.requested_price, // Ensure total amount is available
            vehicle_total_amount: selectedShipment.requested_price,
          }}
          containerDetails={containerDetails}
          onClose={handleCloseModal}
          onDownloadInvoice={handleDownloadInvoice}
        />
      )}

      {/* Loading overlay for container details */}
      {isLoadingContainerDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading container details...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipmentsPage;
