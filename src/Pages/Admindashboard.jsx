// src\Pages\Admindashboard.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  Search,
  Filter,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Truck,
  FileText,
  Eye,
  RefreshCw,
  MapPin,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../utils/Api"; // Assuming this is the same API utility used in ShipmentReports
import { transporterAPI } from "../utils/Api";
import { generateInvoice } from "../utils/pdfGenerator";
import RequestModal from "../Components/Requestmodal";

// Utility functions for parsing and formatting
const parseJSON = (data, defaultValue) => {
  try {
    return typeof data === "string" ? JSON.parse(data) : data || defaultValue;
  } catch (e) {
    console.error("Error parsing JSON:", e);
    return defaultValue;
  }
};

const formatCurrency = (amount) =>
  amount || amount === 0
    ? `₹${Number(amount).toLocaleString("en-IN")}`
    : "Not specified";

const formatDate = (dateString) =>
  dateString ? new Date(dateString).toLocaleDateString() : "N/A";

const formatDateTime = (dateString) =>
  dateString ? new Date(dateString).toLocaleString() : "N/A";

// Component for Summary Cards
const SummaryCard = ({ title, value, color, currency = true }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border">
    <p className="text-sm text-gray-500 font-medium">{title}</p>
    <p className={`text-2xl font-bold ${color}`}>
      {currency ? `₹${value.toLocaleString()}` : value}
    </p>
  </div>
);

// Component for Status Badge
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { color: "bg-yellow-100 text-yellow-800", icon: "⏳" },
    approved: { color: "bg-green-100 text-green-800", icon: "✓" },
    "in progress": { color: "bg-blue-100 text-blue-800", icon: "🚛" },
    completed: { color: "bg-purple-100 text-purple-800", icon: "📦" },
    rejected: { color: "bg-red-100 text-red-800", icon: "✕" },
  };
  const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
    >
      <span>{config.icon}</span>
      {status}
    </span>
  );
};

// Component for Profit/Loss Indicator
const ProfitLossIndicator = ({ profitLoss }) => {
  if (profitLoss > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (profitLoss < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <div className="w-4 h-4 bg-gray-300 rounded-full"></div>;
};

const AdminDashboard = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [transporterDetails, setTransporterDetails] = useState(null);
  const [adminComment, setAdminComment] = useState("");
  const [updating, setUpdating] = useState(false);
  const [exportType, setExportType] = useState("detailed");

  // Cache for transporter details to avoid redundant API calls
  const transporterCache = useMemo(() => new Map(), []);

  // Helper function to calculate total amount for a request (aligned with ShipmentReports)
  const calculateRequestTotalAmount = useCallback((containerDetails) => {
    if (!Array.isArray(containerDetails) || containerDetails.length === 0) {
      return 0;
    }
    return containerDetails.reduce(
      (total, detail) => total + parseFloat(detail.total_charge || 0),
      0
    );
  }, []);

  // Fetch transaction data for a request
  const fetchTransactionData = useCallback(async (requestId) => {
    try {
      const response = await api.get(`/transactions/request/${requestId}`);
      if (response.data.success && response.data.data.length > 0) {
        return response.data.data[0];
      }
      return null;
    } catch (error) {
      console.log(`No transaction data for shipment ${requestId}`);
      return null;
    }
  }, []);

  // Fetch and process reports
  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/transport-requests/all");
      const shipments = response.data.requests;

      const reportsWithDetails = await Promise.all(
        shipments.map(async (shipment) => {
          let transporterDetails = [];
          let vehicleCharges = 0;
          let vehicleCount = 0;
          let vehicleContainerMapping = {};
          let containerNumbers = "";

          try {
            if (transporterCache.has(shipment.id)) {
              transporterDetails = transporterCache.get(shipment.id);
            } else {
              const transporterResponse =
                await transporterAPI.getTransporterByRequestId(shipment.id);
              if (transporterResponse.success) {
                const details = Array.isArray(transporterResponse.data)
                  ? transporterResponse.data
                  : [transporterResponse.data];
                // Group containers by vehicle_number
                vehicleContainerMapping = details.reduce((acc, detail) => {
                  const vehicleNum = detail.vehicle_number || "Unknown";
                  if (!acc[vehicleNum]) {
                    acc[vehicleNum] = {
                      containers: [],
                      container_types: [],
                      container_sizes: [],
                      total_charge: 0,
                      additional_charges: 0,
                      driver_name: detail.driver_name || "N/A",
                      driver_phone: detail.driver_phone || "N/A",
                    };
                  }
                  if (detail.container_no) {
                    acc[vehicleNum].containers.push(detail.container_no);
                    acc[vehicleNum].container_types.push(
                      detail.container_type || "N/A"
                    );
                    acc[vehicleNum].container_sizes.push(
                      detail.container_size || "N/A"
                    );
                  }
                  acc[vehicleNum].total_charge += parseFloat(
                    detail.total_charge || 0
                  );
                  acc[vehicleNum].additional_charges += parseFloat(
                    detail.additional_charges || 0
                  );
                  // Update driver info if not set or different (assuming consistent per vehicle)
                  if (
                    detail.driver_name &&
                    acc[vehicleNum].driver_name === "N/A"
                  ) {
                    acc[vehicleNum].driver_name = detail.driver_name || "N/A";
                  }
                  if (
                    detail.driver_phone &&
                    acc[vehicleNum].driver_phone === "N/A"
                  ) {
                    acc[vehicleNum].driver_phone = detail.driver_phone || "N/A";
                  }
                  return acc;
                }, {});
                containerNumbers = details
                  .map((t) => t.container_no || "N/A")
                  .filter(Boolean)
                  .join(", ");
                // Filter unique vehicles
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
                transporterDetails = uniqueVehicles;
                transporterCache.set(shipment.id, transporterDetails);
              }
            }
            vehicleCharges = calculateRequestTotalAmount(transporterDetails);
            vehicleCount = [
              ...new Set(transporterDetails.map((d) => d.vehicle_number)),
            ].length;
          } catch (error) {
            console.log(`No transporter details for shipment ${shipment.id}`);
          }

          const transactionData = await fetchTransactionData(shipment.id);
          const totalPaid = transactionData
            ? parseFloat(transactionData.total_paid || 0)
            : 0;
          const grNumber = transactionData?.gr_no || `GR-${shipment.id}`;
          const serviceCharges = parseFloat(shipment.requested_price || 0);
          const profitLoss = serviceCharges - vehicleCharges;
          const profitLossPercentage =
            serviceCharges > 0 ? (profitLoss / serviceCharges) * 100 : 0;
          const paymentStatus =
            totalPaid >= serviceCharges
              ? "Fully Paid"
              : totalPaid > 0
              ? "Partially Paid"
              : "Unpaid";
          const outstandingAmount = Math.max(0, serviceCharges - totalPaid);

          return {
            ...shipment,
            gr_no: grNumber,
            trip_no: `TRIP-${shipment.id}`,
            invoice_no: `INV-${new Date(
              shipment.created_at
            ).getFullYear()}-${String(shipment.id).padStart(4, "0")}`,
            shipa_no: shipment.SHIPA_NO || "N/A",
            container_numbers: containerNumbers,
            service_charges: serviceCharges,
            vehicle_charges: vehicleCharges,
            profit_loss: profitLoss,
            profit_loss_percentage: profitLossPercentage,
            total_paid: totalPaid,
            outstanding_amount: outstandingAmount,
            payment_status: paymentStatus,
            vehicle_count: vehicleCount,
            transporter_details: transporterDetails,
            vehicle_container_mapping: vehicleContainerMapping,
            transaction_data: transactionData,
            customer_name:
              shipment.customer_name || `Customer ${shipment.customer_id}`,
            total_containers:
              (shipment.containers_20ft || 0) + (shipment.containers_40ft || 0),
            service_types: parseJSON(shipment.service_type, []),
            service_prices: parseJSON(shipment.service_prices, {}),
            formatted_request_id:
              shipment.formatted_request_id || `Booking #${shipment.id}`,
          };
        })
      );

      setReports(reportsWithDetails);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to fetch admin reports");
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }, [transporterCache, calculateRequestTotalAmount, fetchTransactionData]);

  // Fetch transporter details for modal
  const fetchTransporterDetails = useCallback(
    async (requestId) => {
      try {
        if (transporterCache.has(requestId)) {
          setTransporterDetails(transporterCache.get(requestId));
          return;
        }
        const response = await api.get(
          `/transport-requests/${requestId}/transporter`
        );
        if (response.data.success) {
          const details = Array.isArray(response.data.data)
            ? response.data.data
            : [response.data.data];
          setTransporterDetails(details);
          transporterCache.set(requestId, details);
        } else {
          setTransporterDetails(null);
        }
      } catch (error) {
        console.log("No transporter details found for request:", requestId);
        setTransporterDetails(null);
      }
    },
    [transporterCache]
  );

  // Filter reports based on search, status, and date range
  const filterReports = useCallback(() => {
    const filtered = reports.filter((report) => {
      const matchesSearch = [
        String(report.id),
        report.gr_no,
        report.trip_no,
        report.customer_name,
        report.customer_email || "",
        report.pickup_location || "",
        report.delivery_location || "",
        report.tracking_id || "",
        report.commodity || "",
        report.shipa_no || "",
      ].some((field) => field.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" || report.status === statusFilter;

      let matchesDate = true;
      if (dateRange.from && dateRange.to) {
        const reportDate = new Date(report.created_at);
        const fromDate = new Date(dateRange.from);
        const toDate = new Date(dateRange.to);
        matchesDate = reportDate >= fromDate && reportDate <= toDate;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });

    setFilteredReports(filtered);
  }, [reports, searchTerm, statusFilter, dateRange]);

  // Refresh data
  const refreshData = () => {
    setIsLoading(true);
    fetchReports();
    toast.success("Reports data refreshed successfully");
  };

  // Handle status update
  const handleStatusUpdate = async (requestId, status) => {
    try {
      setUpdating(true);
      await api.put(`/transport-requests/${requestId}/status`, {
        status,
        adminComment: adminComment.trim(),
      });
      setShowDetailModal(false);
      fetchReports();
      toast.success(`Request ${status} successfully`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(error.message || "Failed to update request status");
    } finally {
      setUpdating(false);
    }
  };

  // Handle invoice download
  const handleDownloadInvoice = async (report) => {
    try {
      const loadingToast = toast.loading("Generating invoice...");
      const response = await api.get(
        `/transport-requests/${report.id}/transporter`
      );
      const transporterDetails = response.data.success
        ? response.data.data
        : null;
      const doc = generateInvoice(report, transporterDetails);
      if (!doc) throw new Error("Failed to generate PDF document");
      const timestamp = new Date().toISOString().split("T")[0];
      doc.save(`invoice-${report.id}-${timestamp}.pdf`);
      toast.dismiss(loadingToast);
      toast.success("Invoice downloaded successfully!");
    } catch (error) {
      console.error("Invoice download error:", error);
      toast.error("Failed to generate invoice. Please try again.");
    }
  };

  // Handle view report
  const handleViewReport = async (report) => {
    setSelectedReport(report);
    setAdminComment(report.admin_comment || "");
    await fetchTransporterDetails(report.id);
    setShowDetailModal(true);
  };

  // Export to Excel
  const exportToExcel = useCallback(() => {
    try {
      const loadingToast = toast.loading("Generating Excel report...");
      let data, sheetName, fileNameSuffix;

      if (exportType === "detailed") {
        data = filteredReports.map((report) => ({
          "Request ID": report.id,
          "Tracking ID": report.tracking_id || "N/A",
          "GR No": report.gr_no,
          "Trip No": report.trip_no,
          "Invoice No": report.invoice_no,
          "SHIPA No": report.shipa_no,
          "Container Numbers": report.container_numbers,
          "Vehicle-Container Mapping":
            Object.entries(report.vehicle_container_mapping)
              .map(
                ([vehicle, info]) =>
                  `${vehicle}: ${info.containers.join(
                    ", "
                  )} [${info.container_types.join(
                    ", "
                  )}/${info.container_sizes.join(", ")}]`
              )
              .join("; ") || "N/A",
          "Customer Name": report.customer_name,
          "Customer Email": report.customer_email || "N/A",
          "Pickup Location": report.pickup_location || "N/A",
          "Delivery Location": report.delivery_location || "N/A",
          "Vehicle Type": report.vehicle_type || "N/A",
          Commodity: report.commodity || "N/A",
          Status: report.status,
          "Service Charges": report.service_charges,
          "Vehicle Charges": report.vehicle_charges,
          "Profit/Loss": report.profit_loss,
          "Profit %": report.profit_loss_percentage.toFixed(2),
          "Total Paid": report.total_paid,
          Outstanding: report.outstanding_amount,
          "Payment Status": report.payment_status,
          "Created Date": formatDate(report.created_at),
          "Delivery Date": formatDate(report.expected_delivery_date),
          "Containers 20ft": report.containers_20ft || 0,
          "Containers 40ft": report.containers_40ft || 0,
          "Total Containers": report.total_containers,
          "Cargo Weight": report.cargo_weight || 0,
          "Vehicle Count": report.vehicle_count,
        }));
        sheetName = "Detailed Reports";
        fileNameSuffix = "detailed";
      } else {
        const grouped = {};
        filteredReports.forEach((report) => {
          const dt = new Date(report.created_at);
          let key;
          if (exportType === "daily") key = dt.toLocaleDateString();
          else if (exportType === "monthly")
            key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(
              2,
              "0"
            )}`;
          else key = dt.getFullYear().toString();

          if (!grouped[key]) {
            grouped[key] = {
              Period: key,
              Revenue: 0,
              Costs: 0,
              Profit: 0,
              Paid: 0,
              Outstanding: 0,
              Requests: 0,
            };
          }
          grouped[key].Revenue += report.service_charges || 0;
          grouped[key].Costs += report.vehicle_charges || 0;
          grouped[key].Profit += report.profit_loss || 0;
          grouped[key].Paid += report.total_paid || 0;
          grouped[key].Outstanding += report.outstanding_amount || 0;
          grouped[key].Requests += 1;
        });
        data = Object.values(grouped).sort((a, b) =>
          a.Period.localeCompare(b.Period)
        );
        sheetName = `${
          exportType.charAt(0).toUpperCase() + exportType.slice(1)
        } Summary`;
        fileNameSuffix = exportType;
      }

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(
        wb,
        `admin-reports-${fileNameSuffix}-${
          new Date().toISOString().split("T")[0]
        }.xlsx`
      );
      toast.dismiss(loadingToast);
      toast.success("Report exported successfully!");
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.dismiss();
      toast.error("Failed to export report");
    }
  }, [exportType, filteredReports]);

  // Calculate summary stats
  const summaryStats = filteredReports.reduce(
    (acc, report) => ({
      totalRevenue: acc.totalRevenue + (report.service_charges || 0),
      totalCosts: acc.totalCosts + (report.vehicle_charges || 0),
      totalPaid: acc.totalPaid + (report.total_paid || 0),
      totalOutstanding: acc.totalOutstanding + (report.outstanding_amount || 0),
    }),
    { totalRevenue: 0, totalCosts: 0, totalPaid: 0, totalOutstanding: 0 }
  );
  summaryStats.totalProfit =
    summaryStats.totalRevenue - summaryStats.totalCosts;

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    filterReports();
  }, [filterReports]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Reports
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Comprehensive view of all transport requests with financial and
                operational insights
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={refreshData}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              <button
                onClick={exportToExcel}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export to Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <SummaryCard
            title="Total Revenue"
            value={summaryStats.totalRevenue}
            color="text-green-600"
          />
          <SummaryCard
            title="Total Costs"
            value={summaryStats.totalCosts}
            color="text-orange-600"
          />
          <SummaryCard
            title="Net Profit"
            value={summaryStats.totalProfit}
            color={
              summaryStats.totalProfit >= 0 ? "text-green-600" : "text-red-600"
            }
          />
          <SummaryCard
            title="Total Paid"
            value={summaryStats.totalPaid}
            color="text-blue-600"
          />
          <SummaryCard
            title="Outstanding"
            value={summaryStats.totalOutstanding}
            color="text-red-600"
          />
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by ID, GR No, Customer, Email, Location, SHIPA No..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="in progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, from: e.target.value }))
                }
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="From Date"
              />
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, to: e.target.value }))
                }
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="To Date"
              />
            </div>
            <select
              value={exportType}
              onChange={(e) => setExportType(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="detailed">Detailed Reports</option>
              <option value="daily">Daily Summary</option>
              <option value="monthly">Monthly Summary</option>
              <option value="yearly">Yearly Summary</option>
            </select>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer & Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service & Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle-Container Mapping
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Financial Summary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          {report.formatted_request_id}
                        </div>
                        <div className="text-xs text-gray-500">
                          GR: {report.gr_no}
                        </div>
                        <div className="text-xs text-gray-500">
                          Trip: {report.trip_no}
                        </div>
                        <div className="text-xs text-gray-500">
                          Invoice: {report.invoice_no}
                        </div>
                        <div className="text-xs text-gray-500">
                          SHIPA: {report.shipa_no}
                        </div>
                        <StatusBadge status={report.status} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-sm">
                        <div className="font-medium">
                          {report.customer_name}
                        </div>
                        <div className="text-gray-500">
                          {report.customer_email || "N/A"}
                        </div>
                        <div className="flex items-center text-gray-500 text-xs">
                          <MapPin className="w-4 h-4 mr-1" />
                          {report.pickup_location} → {report.delivery_location}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-sm">
                        <div className="font-medium">{report.commodity}</div>
                        <div className="text-gray-500">
                          {report.vehicle_type} ({report.vehicle_size})
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {report.service_types.map((service, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
                            >
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-sm">
                        {Object.entries(report.vehicle_container_mapping).map(
                          ([vehicle, info]) => (
                            <div key={vehicle} className="text-gray-700">
                              {vehicle}: {info.containers.join(", ")} [
                              {info.container_types.join(", ")}/
                              {info.container_sizes.join(", ")}]
                            </div>
                          )
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Service:</span>
                          <span className="text-green-600">
                            {formatCurrency(report.service_charges)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Vehicle:</span>
                          <span className="text-orange-600">
                            {formatCurrency(report.vehicle_charges)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-1">
                          <span className="text-gray-500">Profit:</span>
                          <span
                            className={`${
                              report.profit_loss >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatCurrency(report.profit_loss)} (
                            {report.profit_loss_percentage.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Paid:</span>
                          <span className="text-blue-600">
                            {formatCurrency(report.total_paid)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Outstanding:</span>
                          <span className="text-red-600">
                            {formatCurrency(report.outstanding_amount)}
                          </span>
                        </div>
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            report.payment_status === "Fully Paid"
                              ? "bg-green-100 text-green-800"
                              : report.payment_status === "Partially Paid"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {report.payment_status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex space-x-2 justify-end">
                        <button
                          onClick={() => handleViewReport(report)}
                          className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View Details
                        </button>
                        {report.status?.toLowerCase() === "approved" && (
                          <button
                            onClick={() => handleDownloadInvoice(report)}
                            className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Invoice
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredReports.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                No reports found matching your criteria.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Detailed Admin Report</h3>
                  <p className="text-blue-100">
                    Request ID: {selectedReport.id}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Request Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    Request Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Request ID:</span>
                      <span className="font-medium">
                        {selectedReport.formatted_request_id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">SHIPA No:</span>
                      <span className="font-medium">
                        {selectedReport.shipa_no}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tracking ID:</span>
                      <span className="font-medium">
                        {selectedReport.tracking_id || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">GR Number:</span>
                      <span className="font-medium">
                        {selectedReport.gr_no}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Trip Number:</span>
                      <span className="font-medium">
                        {selectedReport.trip_no}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Invoice Number:</span>
                      <span className="font-medium">
                        {selectedReport.invoice_no}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span>
                        <StatusBadge status={selectedReport.status} />
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created Date:</span>
                      <span className="font-medium">
                        {formatDate(selectedReport.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer & Route Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Truck className="w-5 h-5 mr-2 text-green-600" />
                    Customer & Route
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Customer:</span>
                      <span className="font-medium">
                        {selectedReport.customer_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Customer Email:</span>
                      <span className="font-medium">
                        {selectedReport.customer_email || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Consignee:</span>
                      <span className="font-medium">
                        {selectedReport.consignee || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Consigner:</span>
                      <span className="font-medium">
                        {selectedReport.consigner || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Pickup Location:</span>
                      <span className="font-medium">
                        {selectedReport.pickup_location || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Delivery Location:</span>
                      <span className="font-medium">
                        {selectedReport.delivery_location || "N/A"}
                      </span>
                    </div>
                    {selectedReport.stuffing_location && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">
                          Stuffing Location:
                        </span>
                        <span className="font-medium">
                          {selectedReport.stuffing_location}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Service & Vehicle Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Truck className="w-5 h-5 mr-2 text-blue-600" />
                    Service & Vehicle
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vehicle Type:</span>
                      <span className="font-medium">
                        {selectedReport.vehicle_type || "N/A"}{" "}
                        {selectedReport.vehicle_size &&
                          `(${selectedReport.vehicle_size})`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Commodity:</span>
                      <span className="font-medium">
                        {selectedReport.commodity || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cargo Type:</span>
                      <span className="font-medium">
                        {selectedReport.cargo_type || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Services:</span>
                      <div>
                        {selectedReport.service_types.length > 0 ? (
                          selectedReport.service_types.map((service, idx) => (
                            <span
                              key={idx}
                              className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-1 mb-1"
                            >
                              {service}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500">None</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                    Financial Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Service Charges:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(selectedReport.service_charges)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vehicle Charges:</span>
                      <span className="font-medium text-orange-600">
                        {formatCurrency(selectedReport.vehicle_charges)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-500 font-medium">
                        Profit/Loss:
                      </span>
                      <span
                        className={`font-bold ${
                          selectedReport.profit_loss >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(selectedReport.profit_loss)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Profit Margin:</span>
                      <span
                        className={`font-medium ${
                          selectedReport.profit_loss_percentage >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {selectedReport.profit_loss_percentage.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
                    Payment Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Paid:</span>
                      <span className="font-medium text-blue-600">
                        {formatCurrency(selectedReport.total_paid)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Outstanding:</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(selectedReport.outstanding_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Payment Status:</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedReport.payment_status === "Fully Paid"
                            ? "bg-green-100 text-green-800"
                            : selectedReport.payment_status === "Partially Paid"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {selectedReport.payment_status}
                      </span>
                    </div>
                    {selectedReport.transaction_data && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Transaction ID:</span>
                          <span className="font-medium">
                            {selectedReport.transaction_data.id}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Payment Method:</span>
                          <span className="font-medium">
                            {selectedReport.transaction_data.payment_method ||
                              "N/A"}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Cargo Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-purple-600" />
                    Cargo Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Container Numbers:</span>
                      <span className="font-medium">
                        {selectedReport.container_numbers || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">20ft Containers:</span>
                      <span className="font-medium">
                        {selectedReport.containers_20ft || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">40ft Containers:</span>
                      <span className="font-medium">
                        {selectedReport.containers_40ft || 0}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-500 font-medium">
                        Total Containers:
                      </span>
                      <span className="font-bold">
                        {selectedReport.total_containers}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cargo Weight:</span>
                      <span className="font-medium">
                        {selectedReport.cargo_weight || "N/A"}{" "}
                        {selectedReport.cargo_weight ? "kg" : ""}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vehicle Count:</span>
                      <span className="font-medium">
                        {selectedReport.vehicle_count}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                    Timeline
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created:</span>
                      <span className="font-medium">
                        {formatDateTime(selectedReport.created_at)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Updated:</span>
                      <span className="font-medium">
                        {formatDateTime(selectedReport.updated_at)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Expected Pickup:</span>
                      <span className="font-medium">
                        {formatDate(selectedReport.expected_pickup_date)}{" "}
                        {selectedReport.expected_pickup_time || ""}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Expected Delivery:</span>
                      <span className="font-medium">
                        {formatDate(selectedReport.expected_delivery_date)}{" "}
                        {selectedReport.expected_delivery_time || ""}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Actual Delivery:</span>
                      <span className="font-medium">
                        {formatDate(selectedReport.actual_delivery_date) ||
                          "Pending"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vehicle-Container Mapping */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Truck className="w-5 h-5 mr-2 text-green-600" />
                    Vehicle-Container Mapping
                  </h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(
                      selectedReport.vehicle_container_mapping
                    ).map(([vehicle, info]) => (
                      <div key={vehicle} className="flex justify-between">
                        <span className="text-gray-500">{vehicle}:</span>
                        <span className="font-medium">
                          {info.containers.join(", ")} [
                          {info.container_types.join(", ")}/
                          {info.container_sizes.join(", ")}]
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Admin Actions */}
              <div className="mt-8 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-red-600" />
                  Admin Actions
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Admin Comment
                    </label>
                    <textarea
                      value={adminComment}
                      onChange={(e) => setAdminComment(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="4"
                      placeholder="Enter comments or notes..."
                    />
                  </div>
                  <div className="flex space-x-4">
                    {["approved", "rejected", "in progress", "completed"].map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() =>
                            handleStatusUpdate(selectedReport.id, status)
                          }
                          disabled={updating}
                          className={`px-4 py-2 rounded-lg text-white font-medium ${
                            status === "approved"
                              ? "bg-green-600 hover:bg-green-700"
                              : status === "rejected"
                              ? "bg-red-600 hover:bg-red-700"
                              : status === "in progress"
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "bg-purple-600 hover:bg-purple-700"
                          } ${updating ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Transporter Details */}
              {Object.keys(selectedReport.vehicle_container_mapping).length >
                0 && (
                <div className="mt-8">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Truck className="w-5 h-5 mr-2 text-green-600" />
                    Transporter Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(
                      selectedReport.vehicle_container_mapping
                    ).map(([vehicle, info], index) => (
                      <div
                        key={index}
                        className="bg-white border rounded-lg p-4"
                      >
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Vehicle Number:
                            </span>
                            <span className="font-medium">{vehicle}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Container Numbers:
                            </span>
                            <span className="font-medium">
                              {info.containers.join(", ") || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Container Types:
                            </span>
                            <span className="font-medium">
                              {info.container_types.join(", ") || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Container Sizes:
                            </span>
                            <span className="font-medium">
                              {info.container_sizes.join(", ") || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Driver Name:</span>
                            <span className="font-medium">
                              {info.driver_name || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Driver Phone:</span>
                            <span className="font-medium">
                              {info.driver_phone || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Total Charge:</span>
                            <span className="font-medium text-orange-600">
                              {formatCurrency(info.total_charge)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Additional Charge:
                            </span>
                            <span className="font-medium text-orange-600">
                              {formatCurrency(info.additional_charges)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              {selectedReport.special_instructions && (
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Special Instructions:
                  </h4>
                  <p className="text-sm text-gray-700">
                    {selectedReport.special_instructions}
                  </p>
                </div>
              )}
            </div>
            <div className="border-t bg-gray-50 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const data = [
                    {
                      "Request ID": selectedReport.id,
                      "Tracking ID": selectedReport.tracking_id || "N/A",
                      "GR No": selectedReport.gr_no,
                      "Trip No": selectedReport.trip_no,
                      "Invoice No": selectedReport.invoice_no,
                      "SHIPA No": selectedReport.shipa_no,
                      "Container Numbers": selectedReport.container_numbers,
                      "Vehicle-Container Mapping":
                        Object.entries(selectedReport.vehicle_container_mapping)
                          .map(
                            ([vehicle, info]) =>
                              `${vehicle}: ${info.containers.join(
                                ", "
                              )} [${info.container_types.join(
                                ", "
                              )}/${info.container_sizes.join(", ")}]`
                          )
                          .join("; ") || "N/A",
                      "Customer Name": selectedReport.customer_name,
                      "Customer Email": selectedReport.customer_email || "N/A",
                      Consignee: selectedReport.consignee || "N/A",
                      Consigner: selectedReport.consigner || "N/A",
                      "Pickup Location":
                        selectedReport.pickup_location || "N/A",
                      "Delivery Location":
                        selectedReport.delivery_location || "N/A",
                      "Vehicle Type": selectedReport.vehicle_type || "N/A",
                      Commodity: selectedReport.commodity || "N/A",
                      Status: selectedReport.status,
                      "Service Charges": selectedReport.service_charges,
                      "Vehicle Charges": selectedReport.vehicle_charges,
                      "Profit/Loss": selectedReport.profit_loss,
                      "Profit %":
                        selectedReport.profit_loss_percentage.toFixed(2),
                      "Total Paid": selectedReport.total_paid,
                      Outstanding: selectedReport.outstanding_amount,
                      "Payment Status": selectedReport.payment_status,
                      "Created Date": formatDate(selectedReport.created_at),
                      "Delivery Date": formatDate(
                        selectedReport.expected_delivery_date
                      ),
                      "Containers 20ft": selectedReport.containers_20ft || 0,
                      "Containers 40ft": selectedReport.containers_40ft || 0,
                      "Total Containers": selectedReport.total_containers,
                      "Cargo Weight": selectedReport.cargo_weight || 0,
                      "Vehicle Count": selectedReport.vehicle_count,
                    },
                  ];
                  const ws = XLSX.utils.json_to_sheet(data);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, "Report");
                  XLSX.writeFile(
                    wb,
                    `admin-report-${selectedReport.id}-${
                      new Date().toISOString().split("T")[0]
                    }.xlsx`
                  );
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminDashboard;
