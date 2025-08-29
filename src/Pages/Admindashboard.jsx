import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Truck,
  FileText,
  Calendar,
  MapPin,
  User,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Download,
  RefreshCw,
  Building,
  Package,
  Search,
  Filter,
  Eye,
  BarChart3,
  Users,
} from "lucide-react";

const AllReportsPage = () => {
  const [allTransactions, setAllTransactions] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [profitabilityFilter, setProfitabilityFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [sortBy, setSortBy] = useState("request_id");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all transactions
      const transactionsResponse = await fetch(
        "http://localhost:4000/api/transactions/all",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!transactionsResponse.ok) {
        throw new Error(
          `Failed to fetch transactions: ${transactionsResponse.status}`
        );
      }

      const transactionsData = await transactionsResponse.json();

      if (!transactionsData.success) {
        throw new Error(
          transactionsData.message || "Failed to fetch transactions"
        );
      }

      // Fetch all transport requests
      const requestsResponse = await fetch(
        "http://localhost:4000/api/transport-requests/all",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      let requestsData = { data: [] };
      if (requestsResponse.ok) {
        requestsData = await requestsResponse.json();
      }

      setAllTransactions(transactionsData.data || []);
      setAllRequests(requestsData.data || []);

      // Process and combine data (now async because we fetch transporter details)
      await processReportData(
        transactionsData.data || [],
        requestsData.data || []
      );
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const processReportData = async (transactions, requests) => {
    // Group transactions by request_id
    const transactionsByRequest = transactions.reduce((acc, transaction) => {
      const requestId = transaction.request_id;
      if (!acc[requestId]) {
        acc[requestId] = [];
      }
      acc[requestId].push(transaction);
      return acc;
    }, {});

    // Create a map of requests for quick lookup
    const requestsMap = requests.reduce((acc, request) => {
      acc[request.id] = request;
      return acc;
    }, {});

    // Generate report data
    const reports = await Promise.all(
      Object.keys(transactionsByRequest).map(async (requestId) => {
        // fetch transporter details for this request from API
        let transporterArray = [];
        try {
          const transporterResp = await fetch(
            `http://localhost:4000/api/transport-requests/${requestId}/transporter`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
              },
            }
          );
          if (transporterResp.ok) {
            const tdata = await transporterResp.json();
            if (tdata && tdata.success && Array.isArray(tdata.data)) {
              transporterArray = tdata.data;
            } else if (Array.isArray(tdata)) {
              transporterArray = tdata;
            }
          }
        } catch (e) {
          console.warn(
            `Failed to fetch transporter for request ${requestId}`,
            e
          );
        }

        // Group transporter entries by vehicle_number + transporter_name and collect containers
        const vehicleMap = new Map();
        transporterArray.forEach((t) => {
          const key = `${t.vehicle_number || "UNKNOWN"}_${
            t.transporter_name || t.transporter || "UNKNOWN"
          }`;
          const containerEntry = t.container_no
            ? {
                container_no: t.container_no,
                line: t.line,
                seal_no: t.seal_no,
                id: t.id,
                container_type: t.container_type,
                container_size: t.container_size,
                container_total_weight: t.container_total_weight,
              }
            : null;

          if (!vehicleMap.has(key)) {
            vehicleMap.set(key, {
              transporter_name:
                t.transporter_name || t.transporter || t.vendor_name || null,
              vehicle_number: t.vehicle_number || null,
              driver_name: t.driver_name || null,
              driver_contact: t.driver_contact || t.driver_phone || null,
              driver_phone: t.driver_phone || t.driver_contact || null,
              license_number: t.license_number || null,
              license_expiry: t.license_expiry || null,
              total_charge: Number(t.total_charge || 0),
              additional_charges: Number(t.additional_charges || 0),
              base_charge: Number(t.base_charge || 0),
              vehicle_sequence: t.vehicle_sequence,
              vin_no: t.vin_no,
              containers: containerEntry ? [containerEntry] : [],
            });
          } else if (containerEntry) {
            vehicleMap.get(key).containers.push(containerEntry);
          }
        });

        const transporterDetails = Array.from(vehicleMap.values());

        // Continue building report using transactions + request data
        const requestTransactions = transactionsByRequest[requestId];
        const request = requestsMap[requestId] || {};

        // safe numeric helpers
        const safeNum = (v) => {
          const n = Number(v);
          return Number.isFinite(n) ? n : 0;
        };

        // Calculate financial metrics
        const totalRevenue =
          safeNum(request.requested_price) ||
          safeNum(requestTransactions[0]?.requested_price) ||
          0;
        const totalVehicleCharges = transporterDetails.reduce(
          (sum, v) => sum + safeNum(v.total_charge),
          0
        );
        const totalPaid = requestTransactions.reduce(
          (sum, tx) => sum + safeNum(tx.total_paid),
          0
        );
        const grossProfit = totalRevenue - totalVehicleCharges;
        const outstandingAmount = totalRevenue - totalPaid;
        const profitMargin =
          totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

        const firstTransaction = requestTransactions[0] || {};

        const paymentStatus =
          totalPaid >= totalRevenue
            ? "Fully Paid"
            : totalPaid > 0
            ? "Partially Paid"
            : "Unpaid";

        // Prefer transporter name from fetched transporter array (if present)
        const reportTransporterName =
          (transporterArray[0] &&
            (transporterArray[0].transporter_name ||
              transporterArray[0].transporter ||
              transporterArray[0].vendor_name)) ||
          request.transporter_name ||
          `CUST-${requestId}`;

        // fallback expected dates from transaction if missing on request
        const expectedPickupDate =
          request.expected_pickup_date ||
          firstTransaction.expected_pickup_date ||
          firstTransaction.pickup_date ||
          null;
        const expectedDeliveryDate =
          request.expected_delivery_date ||
          firstTransaction.expected_delivery_date ||
          firstTransaction.delivery_date ||
          null;

        return {
          request_id: parseInt(requestId),
          id: parseInt(requestId),
          formatted_request_id:
            request.formatted_request_id || `REQ-${requestId}`,
          tracking_id: request.tracking_id || `TR-${requestId}`,
          gr_no: `GR-${requestId}`,
          trip_no: `TRIP-${requestId}`,
          invoice_no: `INV-${new Date(
            request.created_at || Date.now()
          ).getFullYear()}-${String(requestId).padStart(4, "0")}`,
          SHIPA_NO: request.SHIPA_NO || `SHIPA-${requestId}`,
          customer_name:
            request.customer_name ||
            firstTransaction.consigner ||
            "Not specified",
          transporter_name: reportTransporterName,
          pickup_location:
            request.pickup_location ||
            firstTransaction.pickup_location ||
            "Not specified",
          delivery_location:
            request.delivery_location ||
            firstTransaction.delivery_location ||
            "Not specified",
          commodity:
            request.commodity || firstTransaction.commodity || "General Cargo",
          vehicle_type:
            request.vehicle_type || firstTransaction.vehicle_type || "Standard",
          status: request.status || "completed",
          created_at: request.created_at || firstTransaction.created_at,
          updated_at: request.updated_at || firstTransaction.updated_at,
          expected_pickup_date: expectedPickupDate,
          expected_delivery_date: expectedDeliveryDate,
          actual_delivery_date: request.actual_delivery_date,
          vehicle_count:
            transporterDetails.length || requestTransactions.length || 0,
          no_of_vehicles:
            request.no_of_vehicles || requestTransactions.length || 0,
          containers_20ft: request.containers_20ft || 0,
          containers_40ft: request.containers_40ft || 0,
          total_containers:
            (request.containers_20ft || 0) + (request.containers_40ft || 0),
          cargo_weight: request.cargo_weight,
          special_instructions: request.special_instructions,
          total_revenue: totalRevenue,
          requested_price: totalRevenue,
          service_charges: totalRevenue,
          total_vehicle_charges: totalVehicleCharges,
          vehicle_charges: totalVehicleCharges,
          gross_profit: grossProfit,
          profit_loss: grossProfit,
          profit_margin: profitMargin,
          profit_loss_percentage: profitMargin,
          total_paid: totalPaid,
          outstanding_amount: outstandingAmount,
          payment_status: paymentStatus,
          is_profitable: grossProfit > 0,
          transactions: requestTransactions,
          request_details: request,
          transporter_details: transporterDetails,
          transaction_data: firstTransaction || null,
        };
      })
    );

    setReportData(reports);
    setFilteredReports(reports);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reportData, searchTerm, statusFilter, profitabilityFilter, dateRange]);

  const filterReports = () => {
    let filtered = reportData.filter((report) => {
      const matchesSearch =
        String(report.request_id)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(report.formatted_request_id)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(report.tracking_id)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(report.gr_no).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(report.customer_name)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(report.pickup_location)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(report.delivery_location)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(report.commodity)
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || report.status === statusFilter;

      const matchesProfitability =
        profitabilityFilter === "all" ||
        (profitabilityFilter === "profitable" && report.is_profitable) ||
        (profitabilityFilter === "loss" && !report.is_profitable);

      let matchesDate = true;
      if (dateRange.from && dateRange.to) {
        const reportDate = new Date(report.created_at);
        const fromDate = new Date(dateRange.from);
        const toDate = new Date(dateRange.to);
        matchesDate = reportDate >= fromDate && reportDate <= toDate;
      }

      return (
        matchesSearch && matchesStatus && matchesProfitability && matchesDate
      );
    });

    // Sort filtered data
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredReports(filtered);
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "₹0";
    return `₹${Number(amount).toLocaleString("en-IN")}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-IN");
    } catch {
      return "N/A";
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString("en-IN");
    } catch {
      return "N/A";
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "in progress":
      case "in transit":
        return "bg-blue-100 text-blue-800";
      case "completed":
      case "delivered":
        return "bg-purple-100 text-purple-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: "⏳" },
      approved: { color: "bg-blue-100 text-blue-800", icon: "✓" },
      "in progress": { color: "bg-purple-100 text-purple-800", icon: "🚛" },
      "in transit": { color: "bg-purple-100 text-purple-800", icon: "🚛" },
      delivered: { color: "bg-green-100 text-green-800", icon: "📦" },
      completed: { color: "bg-green-100 text-green-800", icon: "📦" },
      cancelled: { color: "bg-red-100 text-red-800", icon: "✕" },
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

  const getProfitLossIndicator = (profitLoss) => {
    if (profitLoss > 0) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (profitLoss < 0) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return <div className="w-4 h-4 bg-gray-300 rounded-full"></div>;
  };

  const refreshData = () => {
    fetchAllData();
  };

  const exportPaymentSheet = () => {
    const headers = [
      "S.NO",
      "Loading Date",
      "Cust.NAME",
      "Vehicle No.",
      "CONTAINER",
      "LINE",
      "SIZE",
      "Vendor Name PAYMENT A/C",
      "BOOKING RATE",
      "Advance",
      "Balance",
      "PAID DATE",
      "NEFT NO.",
    ];

    let serialNo = 1;
    const paymentData = [];

    filteredReports.forEach((report) => {
      if (report.transactions && report.transactions.length > 0) {
        report.transactions.forEach((transaction) => {
          const loadingDate = formatDate(report.created_at);
          const customerName = report.customer_name;
          const vehicleNo = transaction.vehicle_number || "N/A";

          // Collect container numbers and lines
          const containerNos = [];
          const containerLines = [];
          if (transaction.container_no) {
            containerNos.push(transaction.container_no);
          }
          if (transaction.line) {
            containerLines.push(transaction.line);
          }

          if (report.transporter_details && report.transporter_details.length) {
            // try to find matching transporter by vehicle number
            const matching = report.transporter_details.find(
              (t) =>
                (t.vehicle_number || "").toString().toLowerCase() ===
                (vehicleNo || "").toString().toLowerCase()
            );
            if (matching && Array.isArray(matching.containers)) {
              matching.containers.forEach((c) => {
                if (c.container_no) containerNos.push(c.container_no);
                if (c.line) containerLines.push(c.line);
              });
            }
            // if still empty, aggregate all containers/lines from transporter_details
            if (containerNos.length === 0 || containerLines.length === 0) {
              report.transporter_details.forEach((t) => {
                if (Array.isArray(t.containers)) {
                  t.containers.forEach((c) => {
                    if (c.container_no) containerNos.push(c.container_no);
                    if (c.line) containerLines.push(c.line);
                  });
                }
              });
            }
          }

          const containerInfo = containerNos.length
            ? [...new Set(containerNos)].join("; ")
            : "-";
          const lineInfo = containerLines.length
            ? [...new Set(containerLines)].join("; ")
            : transaction.line || report.request_details?.line || "-";

          const size =
            transaction.container_size ||
            (report.containers_40ft
              ? "40"
              : report.containers_20ft
              ? "20"
              : "N/A");

          // Use transporter name as vendor if available
          const vendorName =
            transaction.transporter_name ||
            report.transporter_name ||
            transaction.driver_name ||
            customerName;

          const bookingRate = transaction.transporter_charge || 0;
          const advancePaid = transaction.total_paid || 0;
          const balance = bookingRate - advancePaid;
          const paidDate = transaction.payment_date
            ? formatDate(transaction.payment_date)
            : "";
          const neftNo = transaction.reference_number || "";

          paymentData.push([
            serialNo++,
            loadingDate,
            customerName,
            vehicleNo,
            containerInfo,
            lineInfo,
            size,
            vendorName,
            bookingRate,
            advancePaid,
            balance,
            paidDate,
            neftNo,
          ]);
        });
      } else {
        const loadingDate = formatDate(report.created_at);
        const customerName = report.customer_name;
        const vehicleNo = "N/A";

        // Aggregate container numbers and lines from transporter_details if available
        let containerNos = [];
        let containerLines = [];
        if (report.transporter_details && report.transporter_details.length) {
          report.transporter_details.forEach((t) => {
            if (Array.isArray(t.containers)) {
              t.containers.forEach((c) => {
                if (c.container_no) containerNos.push(c.container_no);
                if (c.line) containerLines.push(c.line);
              });
            }
          });
        }
        const containerInfo = containerNos.length
          ? [...new Set(containerNos)].join("; ")
          : "-";
        const lineInfo = containerLines.length
          ? [...new Set(containerLines)].join("; ")
          : report.request_details?.line || "-";

        const size = report.containers_40ft
          ? "40"
          : report.containers_20ft
          ? "20"
          : "N/A";
        const vendorName = report.transporter_name || customerName;
        const bookingRate = report.total_vehicle_charges || 0;
        const advancePaid = report.total_paid || 0;

        const balance = bookingRate - advancePaid;
        const paidDate = "";
        const neftNo = "";

        paymentData.push([
          serialNo++,
          loadingDate,
          customerName,
          vehicleNo,
          containerInfo,
          lineInfo,
          size,
          vendorName,
          bookingRate,
          advancePaid,
          balance,
          paidDate,
          neftNo,
        ]);
      }
    });

    const totalAdvanceToBePaid = paymentData.reduce(
      (sum, row) => sum + (Number(row[9]) || 0),
      0
    );

    const summaryRows = [
      ["", "", "", "", "", "", "", "", "", "", "", "", ""],
      [
        "Date of Requisition",
        formatDate(new Date()),
        "",
        "",
        "",
        "",
        "",
        "Total Advance to be paid",
        totalAdvanceToBePaid,
        "",
        "",
        "",
        "",
      ],
      ["", "", "", "", "", "", "", "", "", "", "", "", ""],
    ];

    const csvContent = [...summaryRows, headers, ...paymentData]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment-sheet-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const headers = [
      "Request ID",
      "Tracking ID",
      "GR No",
      "Trip No",
      "Invoice No",
      "Customer Name",
      "Customer ID",
      "Line",
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

    const csvData = filteredReports.map((report) => {
      // compute line value: prefer request_details.line, else collect unique lines from transporter_details containers or transporter.line
      let lineVal = "";
      if (report.request_details?.line) {
        lineVal = report.request_details.line;
      } else if (
        report.transporter_details &&
        report.transporter_details.length
      ) {
        const lines = [];
        report.transporter_details.forEach((t) => {
          if (Array.isArray(t.containers)) {
            t.containers.forEach((c) => {
              if (c.line) lines.push(c.line);
            });
          }
          if (t.line) lines.push(t.line);
        });
        lineVal = lines.length ? [...new Set(lines)].join("; ") : "";
      }

      return [
        report.request_id,
        report.tracking_id || "",
        report.gr_no,
        report.trip_no,
        report.invoice_no,
        report.customer_name,
        report.transporter_name,
        lineVal,
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
        formatDate(report.created_at),
        formatDate(report.expected_delivery_date),
        report.containers_20ft || 0,
        report.containers_40ft || 0,
        report.total_containers,
        report.cargo_weight || 0,
        report.vehicle_count,
      ];
    });

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `all-reports-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate summary statistics
  const totalRequests = filteredReports.length;
  const profitableRequests = filteredReports.filter(
    (r) => r.is_profitable
  ).length;
  const totalRevenue = filteredReports.reduce(
    (sum, r) => sum + r.total_revenue,
    0
  );
  const totalCosts = filteredReports.reduce(
    (sum, r) => sum + r.total_vehicle_charges,
    0
  );
  const totalProfit = filteredReports.reduce(
    (sum, r) => sum + r.gross_profit,
    0
  );
  const totalOutstanding = filteredReports.reduce(
    (sum, r) => sum + r.outstanding_amount,
    0
  );
  const totalPaid = filteredReports.reduce((sum, r) => sum + r.total_paid, 0);
  const overallProfitMargin =
    totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading all reports...</p>
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
                  All Transport Reports
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Comprehensive P&L analysis for all transport requests
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={refreshData}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition-colors"
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                  />
                  {loading ? "Refreshing..." : "Refresh"}
                </button>
                <button
                  onClick={exportToCSV}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Reports
                </button>
                <button
                  onClick={exportPaymentSheet}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Payment Sheet
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Total Requests
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalRequests}
                </p>
                <p className="text-xs text-gray-500">
                  {profitableRequests} profitable (
                  {totalRequests > 0
                    ? ((profitableRequests / totalRequests) * 100).toFixed(1)
                    : 0}
                  %)
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Costs</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(totalCosts)}
                </p>
              </div>
              <Truck className="h-8 w-8 text-orange-600" />
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
                  {formatCurrency(totalProfit)}
                </p>
                <p className="text-xs text-gray-500">
                  {overallProfitMargin.toFixed(1)}% margin
                </p>
              </div>
              <BarChart3
                className={`h-8 w-8 ${
                  totalProfit >= 0 ? "text-green-600" : "text-red-600"
                }`}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Outstanding</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalOutstanding)}
                </p>
                <p className="text-xs text-gray-500">
                  Paid: {formatCurrency(totalPaid)}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search requests..."
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

            <select
              value={profitabilityFilter}
              onChange={(e) => setProfitabilityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="profitable">Profitable</option>
              <option value="loss">Loss Making</option>
            </select>

            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, from: e.target.value }))
                }
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="From Date"
              />
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, to: e.target.value }))
                }
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <tr key={report.request_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          ID: {report.request_id}
                        </div>
                        <div className="text-xs text-gray-500">
                          Tracking: {report.tracking_id}
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
                          From: {report.pickup_location}
                        </div>
                        <div className="text-xs text-gray-500">
                          To: {report.delivery_location}
                        </div>
                        <div className="text-xs text-gray-500">
                          {report.commodity}
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
                            {formatCurrency(report.total_revenue)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Costs:</span>
                          <span className="text-sm font-medium text-orange-600">
                            {formatCurrency(report.total_vehicle_charges)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-t pt-2">
                          <div className="flex items-center gap-1">
                            {getProfitLossIndicator(report.gross_profit)}
                            <span className="text-xs text-gray-500">P&L:</span>
                          </div>
                          <span
                            className={`text-sm font-bold ${
                              report.gross_profit >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatCurrency(report.gross_profit)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Margin:</span>
                          <span
                            className={`text-xs font-medium ${
                              report.profit_margin >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {report.profit_margin.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Paid:</span>
                          <span className="text-sm font-medium text-blue-600">
                            {formatCurrency(report.total_paid)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Outstanding:
                          </span>
                          <span className="text-sm font-medium text-red-600">
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
                {reportData.length === 0
                  ? "No transaction data available."
                  : "No reports match your current filters."}
              </p>
            </div>
          )}
        </div>

        {/* Results Count */}
        {filteredReports.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            Showing {filteredReports.length} of {reportData.length} reports
          </div>
        )}
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
                    Request ID: {selectedReport.request_id}
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
                        {selectedReport.request_id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Formatted ID:</span>
                      <span className="font-medium">
                        {selectedReport.formatted_request_id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tracking ID:</span>
                      <span className="font-medium">
                        {selectedReport.tracking_id}
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
                      <span className="text-gray-500">SHIPA Number:</span>
                      <span className="font-medium">
                        {selectedReport.SHIPA_NO}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span>{getStatusBadge(selectedReport.status)}</span>
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
                      <span className="text-gray-500">Customer Name:</span>
                      <span className="font-medium">
                        {selectedReport.customer_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Customer ID:</span>
                      <span className="font-medium">
                        {selectedReport.transporter_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Pickup Location:</span>
                      <span className="font-medium">
                        {selectedReport.pickup_location}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Delivery Location:</span>
                      <span className="font-medium">
                        {selectedReport.delivery_location}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Commodity:</span>
                      <span className="font-medium">
                        {selectedReport.commodity}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vehicle Type:</span>
                      <span className="font-medium">
                        {selectedReport.vehicle_type}
                      </span>
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
                    <div className="flex justify-between">
                      <span className="text-gray-500">Transporter Name</span>
                      <span className="font-medium text-orange-600">
                        {selectedReport.transporter_name || "Not specified"}
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
                    <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
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
                      <span className="text-gray-500">20ft Containers:</span>
                      <span className="font-medium">
                        {selectedReport.containers_20ft}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">40ft Containers:</span>
                      <span className="font-medium">
                        {selectedReport.containers_40ft}
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
                        {formatDate(selectedReport.expected_pickup_date)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Expected Delivery:</span>
                      <span className="font-medium">
                        {formatDate(selectedReport.expected_delivery_date)}
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
                                  {transporter.vehicle_number || "N/A"}
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
                                  {formatCurrency(transporter.total_charge)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Additional Charge:
                                </span>
                                <span className="font-medium text-orange-600">
                                  {formatCurrency(
                                    transporter.additional_charges
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Transaction Details */}
              {selectedReport.transactions &&
                selectedReport.transactions.length > 0 && (
                  <div className="mt-8">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-blue-600" />
                      Transaction Details
                    </h4>
                    <div className="bg-white border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Transaction ID
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Vehicle
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Charges
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Paid
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Outstanding
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {selectedReport.transactions.map(
                              (transaction, index) => (
                                <tr key={index}>
                                  <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                    {transaction.id}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-500">
                                    {transaction.vehicle_number || "N/A"}
                                  </td>
                                  <td className="px-4 py-2 text-sm font-medium text-orange-600">
                                    {formatCurrency(
                                      transaction.transporter_charge
                                    )}
                                  </td>
                                  <td className="px-4 py-2 text-sm font-medium text-blue-600">
                                    {formatCurrency(transaction.total_paid)}
                                  </td>
                                  <td className="px-4 py-2 text-sm font-medium text-red-600">
                                    {formatCurrency(
                                      (transaction.transporter_charge || 0) -
                                        (transaction.total_paid || 0)
                                    )}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
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
                    "Customer Name",
                    "Customer ID",
                    "Line",
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

                  const csvData = singleReportData.map((report) => {
                    let lineVal = "";
                    if (report.request_details?.line) {
                      lineVal = report.request_details.line;
                    } else if (
                      report.transporter_details &&
                      report.transporter_details.length
                    ) {
                      const lines = [];
                      report.transporter_details.forEach((t) => {
                        if (Array.isArray(t.containers)) {
                          t.containers.forEach((c) => {
                            if (c.line) lines.push(c.line);
                          });
                        }
                        if (t.line) lines.push(t.line);
                      });
                      lineVal = lines.length
                        ? [...new Set(lines)].join("; ")
                        : "";
                    }

                    return [
                      report.request_id,
                      report.tracking_id,
                      report.gr_no,
                      report.trip_no,
                      report.invoice_no,
                      report.customer_name,
                      report.transporter_name,
                      lineVal,
                      report.pickup_location,
                      report.delivery_location,
                      report.vehicle_type,
                      report.commodity,
                      report.status,
                      report.service_charges,
                      report.vehicle_charges,
                      report.profit_loss,
                      report.profit_loss_percentage.toFixed(2),
                      report.total_paid,
                      report.outstanding_amount,
                      report.payment_status,
                      formatDate(report.created_at),
                      formatDate(report.expected_delivery_date),
                      report.containers_20ft,
                      report.containers_40ft,
                      report.total_containers,
                      report.cargo_weight || 0,
                      report.vehicle_count,
                    ];
                  });

                  const csvContent = [headers, ...csvData]
                    .map((row) => row.map((cell) => `"${cell}"`).join(","))
                    .join("\n");

                  const blob = new Blob([csvContent], { type: "text/csv" });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `transport-report-${selectedReport.request_id}-${
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

export default AllReportsPage;
