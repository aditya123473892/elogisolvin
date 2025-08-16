import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../utils/Api";
import { transporterAPI } from "../utils/Api";

const ShipmentReports = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, searchTerm, statusFilter, dateRange]);

  // Helper function to calculate total amount for a request (same as ShipmentsPage)
  const calculateRequestTotalAmount = (containerDetails) => {
    if (!Array.isArray(containerDetails) || containerDetails.length === 0) {
      return 0;
    }

    return containerDetails.reduce((total, detail) => {
      const vehicleTotal = parseFloat(detail.total_charge || 0);
      return total + vehicleTotal;
    }, 0);
  };

  const fetchReports = async () => {
    try {
      setIsLoading(true);

      // Fetch shipments data using the same endpoint as ShipmentsPage
      const shipmentsResponse = await api.get(
        "/transport-requests/my-requests"
      );

      if (shipmentsResponse.data?.success) {
        const shipments = shipmentsResponse.data.requests;

        // Process each shipment to get complete data including transporter details and transactions
        const reportsWithDetails = await Promise.all(
          shipments.map(async (shipment) => {
            try {
              // Fetch transporter details for profit/loss calculation
              let transporterDetails = [];
              let vehicleCharges = 0;
              let vehicleCount = 0;

              try {
                const transporterResponse =
                  await transporterAPI.getTransporterByRequestId(shipment.id);
                if (transporterResponse.success) {
                  const details = Array.isArray(transporterResponse.data)
                    ? transporterResponse.data
                    : [transporterResponse.data];

                  // Filter unique vehicles based on vehicle_number (same logic as ShipmentsPage)
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
                  vehicleCharges = calculateRequestTotalAmount(uniqueVehicles);
                  vehicleCount = uniqueVehicles.length;
                }
              } catch (error) {
                console.log(
                  `No transporter details found for shipment ${shipment.id}`
                );
              }

              // Fetch transaction data using the same approach as PaymentModal
              let transactionData = null;
              let totalPaid = 0;
              let grNumber = `GR-${shipment.id}`;

              try {
                const transactionResponse = await api.get(
                  `/transactions/request/${shipment.id}`
                );
                if (
                  transactionResponse.data.success &&
                  transactionResponse.data.data.length > 0
                ) {
                  transactionData = transactionResponse.data.data[0];
                  totalPaid = parseFloat(transactionData.total_paid || 0);
                  grNumber = transactionData.gr_no || grNumber;
                }
              } catch (error) {
                console.log(
                  `No transaction data found for shipment ${shipment.id}`
                );
              }

              // Calculate service charges using the same logic as ShipmentsPage
              const serviceCharges =
                vehicleCharges > 0
                  ? vehicleCharges
                  : parseFloat(shipment.requested_price || 0);

              // Calculate profit/loss
              const profitLoss = serviceCharges - vehicleCharges;
              const profitLossPercentage =
                serviceCharges > 0 ? (profitLoss / serviceCharges) * 100 : 0;

              // Determine payment status
              const paymentStatus =
                totalPaid >= serviceCharges
                  ? "Fully Paid"
                  : totalPaid > 0
                  ? "Partially Paid"
                  : "Unpaid";
              const outstandingAmount = Math.max(0, serviceCharges - totalPaid);

              return {
                ...shipment,
                // IDs and tracking
                gr_no: grNumber,
                trip_no: `TRIP-${shipment.id}`,
                invoice_no: `INV-${new Date(
                  shipment.created_at
                ).getFullYear()}-${String(shipment.id).padStart(4, "0")}`,

                // Financial data
                service_charges: serviceCharges,
                vehicle_charges: vehicleCharges,
                profit_loss: profitLoss,
                profit_loss_percentage: profitLossPercentage,
                total_paid: totalPaid,
                outstanding_amount: outstandingAmount,
                payment_status: paymentStatus,

                // Additional details
                vehicle_count: vehicleCount,
                transporter_details: transporterDetails,
                transaction_data: transactionData,
                customer_name: `Customer ${shipment.customer_id}`, // You may want to fetch actual customer name
                total_containers:
                  (shipment.containers_20ft || 0) +
                  (shipment.containers_40ft || 0),
              };
            } catch (error) {
              console.error(`Error processing shipment ${shipment.id}:`, error);
              return {
                ...shipment,
                gr_no: `GR-${shipment.id}`,
                trip_no: `TRIP-${shipment.id}`,
                invoice_no: `INV-${new Date(
                  shipment.created_at
                ).getFullYear()}-${String(shipment.id).padStart(4, "0")}`,
                service_charges: parseFloat(shipment.requested_price || 0),
                vehicle_charges: 0,
                profit_loss: parseFloat(shipment.requested_price || 0),
                profit_loss_percentage: 100,
                total_paid: 0,
                outstanding_amount: parseFloat(shipment.requested_price || 0),
                payment_status: "Unpaid",
                vehicle_count: shipment.no_of_vehicles || 1,
                transporter_details: [],
                transaction_data: null,
                customer_name: `Customer ${shipment.customer_id}`,
                total_containers:
                  (shipment.containers_20ft || 0) +
                  (shipment.containers_40ft || 0),
              };
            }
          })
        );

        setReports(reportsWithDetails);
        console.log("Processed reports with real data:", reportsWithDetails);
      } else {
        console.log("No shipments data found or unsuccessful response");
        setReports([]);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to fetch shipment reports");
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = reports.filter((report) => {
      const matchesSearch =
        String(report.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(report.gr_no).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(report.trip_no)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(report.customer_name)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(report.pickup_location || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(report.delivery_location || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(report.tracking_id || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

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
  };

  const refreshData = () => {
    setIsLoading(true);
    fetchReports();
    toast.success("Reports data refreshed successfully");
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Pending: { color: "bg-yellow-100 text-yellow-800", icon: "⏳" },
      Approved: { color: "bg-blue-100 text-blue-800", icon: "✓" },
      "In Transit": { color: "bg-purple-100 text-purple-800", icon: "🚛" },
      Delivered: { color: "bg-green-100 text-green-800", icon: "📦" },
      Cancelled: { color: "bg-red-100 text-red-800", icon: "✕" },
    };

    const config = statusConfig[status] || statusConfig.Pending;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        <span>{config.icon}</span>
        {status}
      </span>
    );
  };

  const getProfitLossIndicator = (profitLoss) => {
    if (profitLoss > 0) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (profitLoss < 0) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return <div className="w-4 h-4 bg-gray-300 rounded-full"></div>;
  };

  const exportToCSV = () => {
    const headers = [
      "Request ID",
      "Tracking ID",
      "GR No",
      "Trip No",
      "Invoice No",
      "Customer ID",
      "Pickup Location",
      "Delivery Location",
      "Vehicle Type",
      "Commodity",
      "Status",
      "Service Charges",
      "Vehicle Charges",
      "Profit/Loss",
      "Profit %",
      "Total Paid",
      "Outstanding",
      "Payment Status",
      "Created Date",
      "Delivery Date",
      "Containers 20ft",
      "Containers 40ft",
      "Total Containers",
      "Cargo Weight",
      "Vehicle Count",
    ];

    const csvData = filteredReports.map((report) => [
      report.id,
      report.tracking_id || "",
      report.gr_no,
      report.trip_no,
      report.invoice_no,
      report.customer_id,
      report.pickup_location || "",
      report.delivery_location || "",
      report.vehicle_type || "",
      report.commodity || "",
      report.status,
      report.service_charges,
      report.vehicle_charges,
      report.profit_loss,
      report.profit_loss_percentage.toFixed(2),
      report.total_paid,
      report.outstanding_amount,
      report.payment_status,
      new Date(report.created_at).toLocaleDateString(),
      report.expected_delivery_date
        ? new Date(report.expected_delivery_date).toLocaleDateString()
        : "",
      report.containers_20ft || 0,
      report.containers_40ft || 0,
      report.total_containers,
      report.cargo_weight || 0,
      report.vehicle_count,
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shipment-reports-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getSummaryStats = () => {
    const totalRevenue = filteredReports.reduce(
      (sum, report) => sum + (report.service_charges || 0),
      0
    );
    const totalCosts = filteredReports.reduce(
      (sum, report) => sum + (report.vehicle_charges || 0),
      0
    );
    const totalProfit = totalRevenue - totalCosts;
    const totalOutstanding = filteredReports.reduce(
      (sum, report) => sum + (report.outstanding_amount || 0),
      0
    );
    const totalPaid = filteredReports.reduce(
      (sum, report) => sum + (report.total_paid || 0),
      0
    );

    return {
      totalRevenue,
      totalCosts,
      totalProfit,
      totalOutstanding,
      totalPaid,
    };
  };

  const { totalRevenue, totalCosts, totalProfit, totalOutstanding, totalPaid } =
    getSummaryStats();

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "N/A";
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return "N/A";
    }
  };

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Shipment Reports
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Comprehensive view of all shipments with profit/loss analysis
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
                  onClick={exportToCSV}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Costs</p>
                <p className="text-2xl font-bold text-orange-600">
                  ₹{totalCosts.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Truck className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Net Profit</p>
                <p
                  className={`text-2xl font-bold ${
                    totalProfit >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  ₹{totalProfit.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                {totalProfit >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-green-600" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600" />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Paid</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{totalPaid.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Outstanding</p>
                <p className="text-2xl font-bold text-red-600">
                  ₹{totalOutstanding.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <FileText className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by ID, GR No, Customer, Location..."
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
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
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
                    Financial Summary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Status
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
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          ID: {report.id}
                        </div>
                        <div className="text-xs text-gray-500">
                          Tracking: {report.tracking_id || "N/A"}
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
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          {report.customer_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          From: {report.pickup_location || "N/A"}
                        </div>
                        <div className="text-xs text-gray-500">
                          To: {report.delivery_location || "N/A"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {report.commodity || "N/A"}
                        </div>
                        <div className="text-xs text-blue-600">
                          {report.vehicle_count} vehicles
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Revenue:
                          </span>
                          <span className="text-sm font-medium text-green-600">
                            ₹{(report.service_charges || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Costs:</span>
                          <span className="text-sm font-medium text-orange-600">
                            ₹{(report.vehicle_charges || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-t pt-2">
                          <div className="flex items-center gap-1">
                            {getProfitLossIndicator(report.profit_loss || 0)}
                            <span className="text-xs text-gray-500">P&L:</span>
                          </div>
                          <span
                            className={`text-sm font-bold ${
                              (report.profit_loss || 0) >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            ₹{(report.profit_loss || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Margin:</span>
                          <span
                            className={`text-xs font-medium ${
                              (report.profit_loss_percentage || 0) >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {(report.profit_loss_percentage || 0).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Paid:</span>
                          <span className="text-sm font-medium text-blue-600">
                            ₹{(report.total_paid || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Outstanding:
                          </span>
                          <span className="text-sm font-medium text-red-600">
                            ₹{(report.outstanding_amount || 0).toLocaleString()}
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setShowDetailModal(true);
                        }}
                        className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View Details
                      </button>
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
                  <h3 className="text-xl font-bold">Detailed Report</h3>
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
                      <span className="font-medium">{selectedReport.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Shipa NO:</span>
                      <span className="font-medium">
                        {selectedReport.SHIPA_NO}
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
                      <span>{getStatusBadge(selectedReport.status)}</span>
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
                      <span className="text-gray-500">Customer ID:</span>
                      <span className="font-medium">
                        {selectedReport.customer_id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">SHIPA No:</span>
                      <span className="font-medium">
                        {selectedReport.SHIPA_NO}
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
                    <div className="flex justify-between">
                      <span className="text-gray-500">Commodity:</span>
                      <span className="font-medium">
                        {selectedReport.commodity || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vehicle Type:</span>
                      <span className="font-medium">
                        {selectedReport.vehicle_type || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-yellow-600" />
                    Financial Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Service Charges:</span>
                      <span className="font-medium text-green-600">
                        ₹
                        {(selectedReport.service_charges || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vehicle Charges:</span>
                      <span className="font-medium text-orange-600">
                        ₹
                        {(selectedReport.vehicle_charges || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-500 font-medium">
                        Profit/Loss:
                      </span>
                      <span
                        className={`font-bold ${
                          (selectedReport.profit_loss || 0) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        ₹{(selectedReport.profit_loss || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Profit Margin:</span>
                      <span
                        className={`font-medium ${
                          (selectedReport.profit_loss_percentage || 0) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {(selectedReport.profit_loss_percentage || 0).toFixed(
                          2
                        )}
                        %
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    Payment Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Paid:</span>
                      <span className="font-medium text-blue-600">
                        ₹{(selectedReport.total_paid || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Outstanding:</span>
                      <span className="font-medium text-red-600">
                        ₹
                        {(
                          selectedReport.outstanding_amount || 0
                        ).toLocaleString()}
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
                    <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
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
                        {formatDate(selectedReport.expected_pickup_date) ||
                          "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Expected Delivery:</span>
                      <span className="font-medium">
                        {formatDate(selectedReport.expected_delivery_date) ||
                          "N/A"}
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
              </div>

              {/* Transporter Details */}
              {selectedReport.transporter_details &&
                selectedReport.transporter_details.length > 0 && (
                  <div className="mt-8">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Truck className="w-5 h-5 mr-2 text-green-600" />
                      Transporter Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedReport.transporter_details.map(
                        (transporter, index) => (
                          <div
                            key={index}
                            className="bg-white border rounded-lg p-4"
                          >
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Vehicle Number:
                                </span>
                                <span className="font-medium">
                                  {transporter.vehicle_number}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Driver Name:
                                </span>
                                <span className="font-medium">
                                  {transporter.driver_name || "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Driver Phone:
                                </span>
                                <span className="font-medium">
                                  {transporter.driver_phone || "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Total Charge:
                                </span>
                                <span className="font-medium text-orange-600">
                                  ₹
                                  {(
                                    transporter.total_charge || 0
                                  ).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Additional Charge:
                                </span>
                                <span className="font-medium text-orange-600">
                                  ₹
                                  {(
                                    transporter.additional_charges || 0
                                  ).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Additional Notes */}
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
                  const singleReportData = [selectedReport];
                  const headers = [
                    "Request ID",
                    "Tracking ID",
                    "GR No",
                    "Trip No",
                    "Invoice No",
                    "Customer ID",
                    "Pickup Location",
                    "Delivery Location",
                    "Vehicle Type",
                    "Commodity",
                    "Status",
                    "Service Charges",
                    "Vehicle Charges",
                    "Profit/Loss",
                    "Profit %",
                    "Total Paid",
                    "Outstanding",
                    "Payment Status",
                    "Created Date",
                    "Delivery Date",
                    "Containers 20ft",
                    "Containers 40ft",
                    "Total Containers",
                    "Cargo Weight",
                    "Vehicle Count",
                  ];

                  const csvData = singleReportData.map((report) => [
                    report.id,
                    report.tracking_id || "",
                    report.gr_no,
                    report.trip_no,
                    report.invoice_no,
                    report.customer_id,
                    report.pickup_location || "",
                    report.delivery_location || "",
                    report.vehicle_type || "",
                    report.commodity || "",
                    report.status,
                    report.service_charges,
                    report.vehicle_charges,
                    report.profit_loss,
                    report.profit_loss_percentage.toFixed(2),
                    report.total_paid,
                    report.outstanding_amount,
                    report.payment_status,
                    new Date(report.created_at).toLocaleDateString(),
                    report.expected_delivery_date
                      ? new Date(
                          report.expected_delivery_date
                        ).toLocaleDateString()
                      : "",
                    report.containers_20ft || 0,
                    report.containers_40ft || 0,
                    report.total_containers,
                    report.cargo_weight || 0,
                    report.vehicle_count,
                  ]);

                  const csvContent = [headers, ...csvData]
                    .map((row) => row.map((cell) => `"${cell}"`).join(","))
                    .join("\n");

                  const blob = new Blob([csvContent], { type: "text/csv" });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `shipment-report-${selectedReport.id}-${
                    new Date().toISOString().split("T")[0]
                  }.csv`;
                  a.click();
                  window.URL.revokeObjectURL(url);
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

export default ShipmentReports;
