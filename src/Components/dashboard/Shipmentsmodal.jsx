import React, { useState, useEffect } from "react";
import api from "../../utils/Api";
import { toast } from "react-toastify";
import PaymentModal from "./PaymentModal";
import TransactionHistory from "./TransactionHistory";

const ShipmentDetailsModal = ({
  shipment,
  containerDetails,
  onClose,
  onDownloadInvoice,
}) => {
  const [transactions, setTransactions] = useState([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (shipment && shipment.id) {
      fetchTransactions(shipment.id);
    }
  }, [shipment]);

  const fetchTransactions = async (requestId) => {
    setIsLoadingTransactions(true);
    try {
      const response = await api.get(`/transactions/request/${requestId}`);
      if (response.data.success) {
        setTransactions(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      // Don't show error toast as transactions might not exist yet
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const handlePaymentComplete = (updatedTransaction) => {
    // Refresh transactions after payment
    if (shipment && shipment.id) {
      fetchTransactions(shipment.id);
    }
    toast.success("Payment recorded successfully");
  };

  if (!shipment) return null;

  const getStatusBadge = (status) => {
    const statusConfig = {
      Pending: {
        color: "bg-amber-50 text-amber-700 border-amber-200",
        label: "Pending",
        icon: "⏳",
      },
      Approved: {
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        label: "Approved",
        icon: "✓",
      },
      "In Transit": {
        color: "bg-blue-50 text-blue-700 border-blue-200",
        label: "In Transit",
        icon: "🚛",
      },
      Delivered: {
        color: "bg-green-50 text-green-700 border-green-200",
        label: "Delivered",
        icon: "📦",
      },
      Cancelled: {
        color: "bg-red-50 text-red-700 border-red-200",
        label: "Cancelled",
        icon: "✕",
      },
    };

    const config = statusConfig[status] || statusConfig.Pending;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${config.color}`}
      >
        <span>{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const parseServices = (serviceString) => {
    try {
      const services = JSON.parse(serviceString || "[]");
      return Array.isArray(services) ? services : [String(services)];
    } catch {
      return ["N/A"];
    }
  };

  const parseServicePrices = (servicePricesString) => {
    try {
      return JSON.parse(servicePricesString || "{}");
    } catch {
      return {};
    }
  };
  const getTotalAmount = () => {
    // First priority: Use the total_amount from shipment (which should be requestTotalAmount)
    if (shipment.total_amount) {
      return shipment.total_amount;
    }

    // Second priority: Use transporter_charge from transaction
    if (transactions.length > 0 && transactions[0].transporter_charge) {
      return parseFloat(transactions[0].transporter_charge);
    }

    // Third priority: Calculate from container details
    if (containerDetails && containerDetails.length > 0) {
      const calculatedTotal = containerDetails.reduce((total, detail) => {
        return total + parseFloat(detail.total_charge || 0);
      }, 0);
      return calculatedTotal;
    }

    // Fallback: Use requested_price from shipment
    if (shipment.requested_price) {
      return parseFloat(shipment.requested_price);
    }

    return 0;
  };

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

  const InfoCard = ({ iconText, title, children, className = "" }) => (
    <div
      className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-50 rounded-lg text-blue-600 text-lg">
          {iconText}
        </div>
        <h4 className="font-semibold text-gray-900 text-lg">{title}</h4>
      </div>
      {children}
    </div>
  );

  const InfoRow = ({ label, value, className = "" }) => (
    <div className={`flex justify-between items-start py-2 ${className}`}>
      <span className="text-gray-600 font-medium">{label}:</span>
      <span className="text-gray-900 font-medium text-right ml-4">{value}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Shipment Details</h3>
              <p className="text-blue-100 mt-1">ID: {shipment.id}</p>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(shipment.status)}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white text-xl"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Basic Information */}
            <InfoCard iconText="📄" title="Basic Information">
              <div className="space-y-1">
                <InfoRow label="Customer ID" value={shipment.customer_id} />
                <InfoRow
                  label="Created"
                  value={formatDate(shipment.created_at)}
                />
                <InfoRow
                  label="Updated"
                  value={
                    shipment.updated_at
                      ? formatDate(shipment.updated_at)
                      : "N/A"
                  }
                />
              </div>
            </InfoCard>

            {/* Cargo Details */}
            <InfoCard iconText="📦" title="Cargo Details">
              <div className="space-y-1">
                <InfoRow
                  label="Commodity"
                  value={shipment.commodity || "N/A"}
                />
                <InfoRow
                  label="Cargo Type"
                  value={
                    <span
                      className={`font-medium ${
                        shipment.cargo_type === "Hazardous"
                          ? "text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs"
                          : ""
                      }`}
                    >
                      {shipment.cargo_type || "N/A"}
                    </span>
                  }
                />
                <InfoRow
                  label="Weight"
                  value={
                    <span className="font-mono text-blue-600">
                      {shipment.cargo_weight
                        ? `${shipment.cargo_weight.toLocaleString()} kg`
                        : "N/A"}
                    </span>
                  }
                />
                <InfoRow
                  label="Consigner"
                  value={shipment.consigner || "N/A"}
                />
                <InfoRow
                  label="Consignee"
                  value={shipment.consignee || "N/A"}
                />
              </div>
            </InfoCard>

            {/* Vehicle & Transport */}
            <InfoCard iconText="🚛" title="Vehicle & Transport">
              <div className="space-y-1">
                <InfoRow
                  label="Vehicle Type"
                  value={shipment.vehicle_type || "N/A"}
                />
                <InfoRow
                  label="Vehicle Size"
                  value={
                    shipment.vehicle_size
                      ? `${shipment.vehicle_size} ft`
                      : "N/A"
                  }
                />
                <InfoRow
                  label="Number of Vehicles"
                  value={shipment.no_of_vehicles || "N/A"}
                />
                <InfoRow
                  label="Stuffing Location"
                  value={shipment.stuffing_location || "N/A"}
                />
              </div>
            </InfoCard>

            {/* Container Summary */}
            <InfoCard iconText="📦" title="Container Summary">
              <div className="space-y-1">
                <InfoRow
                  label="20ft Containers"
                  value={shipment.containers_20ft || 0}
                />
                <InfoRow
                  label="40ft Containers"
                  value={shipment.containers_40ft || 0}
                />
                <InfoRow
                  label="Total Containers"
                  value={
                    <span className="font-semibold text-blue-600">
                      {shipment.total_containers || 0}
                    </span>
                  }
                />
              </div>
            </InfoCard>

            {/* Route & Schedule */}
            <InfoCard
              iconText="📍"
              title="Route & Schedule"
              className="lg:col-span-2"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-green-600 text-lg">📍</span>
                      <span className="font-semibold text-green-800">
                        Pickup
                      </span>
                    </div>
                    <p className="text-gray-900 font-medium text-sm">
                      {shipment.pickup_location || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Expected: {formatDate(shipment.expected_pickup_date)}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-blue-600 text-lg">📍</span>
                      <span className="font-semibold text-blue-800">
                        Delivery
                      </span>
                    </div>
                    <p className="text-gray-900 font-medium text-sm">
                      {shipment.delivery_location || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Expected: {formatDate(shipment.expected_delivery_date)}
                    </p>
                  </div>
                </div>
              </div>
            </InfoCard>

            {/* Services & Pricing */}

            {/* Container Details */}
            {containerDetails && containerDetails.length > 0 && (
              <InfoCard
                iconText="🚛"
                title="Container & Transport Details"
                className="lg:col-span-2 xl:col-span-3"
              >
                <div className="space-y-6">
                  {containerDetails.map((container, index) => (
                    <div
                      key={container.id}
                      className="bg-gray-50 rounded-lg p-5 border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h6 className="font-semibold text-lg text-gray-900">
                          Transport Unit #{index + 1}
                        </h6>
                        <div className="text-sm text-gray-500">
                          ID: {container.id}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Driver & Vehicle Info */}
                        <div className="space-y-2">
                          <h7 className="font-medium text-gray-700 text-sm">
                            Driver & Vehicle
                          </h7>
                          <div className="space-y-1 text-sm">
                            <InfoRow
                              label="Driver"
                              value={container.driver_name || "N/A"}
                            />
                            <InfoRow
                              label="Contact"
                              value={
                                container.driver_contact ? (
                                  <a
                                    href={`tel:${container.driver_contact}`}
                                    className="text-blue-600 hover:underline"
                                  >
                                    {container.driver_contact}
                                  </a>
                                ) : (
                                  "N/A"
                                )
                              }
                            />
                            <InfoRow
                              label="Vehicle No."
                              value={container.vehicle_number || "N/A"}
                            />
                            <InfoRow
                              label="Transporter"
                              value={container.transporter_name || "N/A"}
                            />
                          </div>
                        </div>

                        {/* Container Info */}
                        {container.container_no && (
                          <div className="space-y-2">
                            <h7 className="font-medium text-gray-700 text-sm">
                              Container Details
                            </h7>
                            <div className="space-y-1 text-sm">
                              <InfoRow
                                label="Container No."
                                value={container.container_no}
                              />
                              <InfoRow
                                label="Size"
                                value={
                                  container.container_size
                                    ? `${container.container_size}ft`
                                    : "N/A"
                                }
                              />
                              <InfoRow
                                label="Type"
                                value={container.container_type || "N/A"}
                              />
                              <InfoRow
                                label="Count"
                                value={container.number_of_containers || "N/A"}
                              />
                              <InfoRow
                                label="Weight"
                                value={
                                  container.container_total_weight
                                    ? `${container.container_total_weight.toLocaleString()} kg`
                                    : "N/A"
                                }
                              />
                            </div>
                          </div>
                        )}

                        {/* Seals & License */}
                        <div className="space-y-2">
                          <h7 className="font-medium text-gray-700 text-sm">
                            Documentation
                          </h7>
                          <div className="space-y-1 text-sm">
                            <InfoRow
                              label="License No."
                              value={container.license_number || "N/A"}
                            />
                            <InfoRow
                              label="License Expiry"
                              value={formatDate(container.license_expiry)}
                            />
                            {container.seal1 && (
                              <InfoRow label="Seal 1" value={container.seal1} />
                            )}
                            {container.seal2 && (
                              <InfoRow label="Seal 2" value={container.seal2} />
                            )}
                            {container.line && (
                              <InfoRow label="Line" value={container.line} />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Charges Breakdown */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h7 className="font-medium text-gray-700 text-sm mb-3 block">
                          Charges Breakdown
                        </h7>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-white p-3 rounded-lg text-center">
                            <div className="text-xs text-gray-500">
                              Base Charge
                            </div>
                            <div className="font-semibold text-blue-600">
                              ₹{container.base_charge?.toLocaleString() || 0}
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded-lg text-center">
                            <div className="text-xs text-gray-500">
                              Additional
                            </div>
                            <div className="font-semibold text-orange-600">
                              ₹
                              {container.additional_charges?.toLocaleString() ||
                                0}
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded-lg text-center">
                            <div className="text-xs text-gray-500">
                              Service Charges
                            </div>
                            <div className="font-semibold text-purple-600">
                              ₹
                              {Object.values(
                                parseServicePrices(
                                  container.service_charges || "{}"
                                )
                              )
                                .reduce(
                                  (sum, charge) =>
                                    sum + parseFloat(charge || 0),
                                  0
                                )
                                .toLocaleString()}
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded-lg text-center">
                            <div className="text-xs text-gray-500">Total</div>
                            <div className="font-bold text-green-600">
                              ₹{container.total_charge?.toLocaleString() || 0}
                            </div>
                          </div>
                        </div>

                        {/* Service Charges Detail */}
                        {container.service_charges && (
                          <div className="mt-3">
                            <div className="text-xs text-gray-500 mb-2">
                              Service Charges Detail:
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(
                                parseServicePrices(container.service_charges)
                              ).map(([service, charge]) => (
                                <span
                                  key={service}
                                  className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"
                                >
                                  {service.trim()}: ₹{charge}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </InfoCard>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <span>💰</span>
                Vendor Payment
              </button>
            </div>

            {/* Transaction History */}
            <InfoCard className="lg:col-span-2 xl:col-span-3">
              {isLoadingTransactions ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">
                    Loading payment details...
                  </p>
                </div>
              ) : (
                <TransactionHistory
                  transactions={transactions}
                  totalAmount={getTotalAmount()}
                />
              )}
            </InfoCard>

            {/* Admin Comment */}
            {shipment.admin_comment && (
              <InfoCard
                iconText="👤"
                title="Admin Comment"
                className="lg:col-span-2 xl:col-span-3"
              >
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-gray-800 leading-relaxed">
                    {shipment.admin_comment}
                  </p>
                </div>
              </InfoCard>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Last updated:{" "}
              {shipment.updated_at
                ? formatDateTime(shipment.updated_at)
                : "N/A"}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          shipment={{
            ...shipment,
            total_amount: getTotalAmount(), // Pass the calculated total amount
            transporter_details:
              containerDetails && containerDetails.length > 0
                ? {
                    ...containerDetails[0],
                    request_total_amount: getTotalAmount(), // Also add it to transporter details
                  }
                : null,
          }}
          onClose={() => setShowPaymentModal(false)}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
};

export default ShipmentDetailsModal;
