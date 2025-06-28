import React, { useState, useEffect } from "react";
import api from "../../utils/Api";
import { toast,ToastContainer } from "react-toastify";
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
  const [selectedVehicle, setSelectedVehicle] = useState(null);

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
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const handlePaymentComplete = (updatedTransaction) => {
    if (shipment && shipment.id) {
      fetchTransactions(shipment.id);
    }
    toast.success("Payment recorded successfully");
  };

  if (!shipment) return null;

  const getStatusBadge = (status) => {
    const statusConfig = {
      Pending: {
        color: "bg-amber-100 text-amber-800 ring-amber-200",
        label: "Pending",
        icon: "⏳",
      },
      Approved: {
        color: "bg-emerald-100 text-emerald-800 ring-emerald-200",
        label: "Approved",
        icon: "✓",
      },
      "In Transit": {
        color: "bg-blue-100 text-blue-800 ring-blue-200",
        label: "In Transit",
        icon: "🚛",
      },
      Delivered: {
        color: "bg-green-100 text-green-800 ring-green-200",
        label: "Delivered",
        icon: "📦",
      },
      Cancelled: {
        color: "bg-red-100 text-red-800 ring-red-200",
        label: "Cancelled",
        icon: "✕",
      },
    };

    const config = statusConfig[status] || statusConfig.Pending;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ring-1 ring-inset ${config.color}`}
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
    if (shipment.total_amount) {
      return shipment.total_amount;
    }
    if (transactions.length > 0 && transactions[0].transporter_charge) {
      return parseFloat(transactions[0].transporter_charge);
    }
    if (containerDetails && containerDetails.length > 0) {
      const calculatedTotal = containerDetails.reduce((total, detail) => {
        return total + parseFloat(detail.total_charge || 0);
      }, 0);
      return calculatedTotal;
    }
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
      className={`bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 text-xl">
          {iconText}
        </div>
        <h4 className="font-bold text-gray-900 text-lg">{title}</h4>
      </div>
      {children}
    </div>
  );

  const InfoRow = ({ label, value, className = "" }) => (
    <div className={`flex justify-between items-start py-2.5 ${className}`}>
      <span className="text-gray-500 font-medium text-sm">{label}:</span>
      <span className="text-gray-800 font-semibold text-sm text-right ml-4 max-w-[60%]">{value}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold tracking-tight">Shipment Details</h3>
              <p className="text-indigo-100 mt-1 text-sm font-medium">ID: {shipment.id}</p>
            </div>
            <div className="flex items-center gap-4">
              {getStatusBadge(shipment.status)}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white text-lg"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Basic Information */}
            <InfoCard iconText="📄" title="Basic Information">
              <div className="space-y-1">
                <InfoRow label="Customer ID" value={shipment.customer_id} />
                <InfoRow label="Created" value={formatDate(shipment.created_at)} />
                <InfoRow label="Updated" value={shipment.updated_at ? formatDate(shipment.updated_at) : "N/A"} />
              </div>
            </InfoCard>

            {/* Cargo Details */}
            <InfoCard iconText="📦" title="Cargo Details">
              <div className="space-y-1">
                <InfoRow label="Commodity" value={shipment.commodity || "N/A"} />
                <InfoRow
                  label="Cargo Type"
                  value={
                    <span
                      className={`font-semibold text-xs px-2.5 py-1 rounded-full ${
                        shipment.cargo_type === "Hazardous"
                          ? "bg-red-50 text-red-600"
                          : "bg-gray-50 text-gray-600"
                      }`}
                    >
                      {shipment.cargo_type || "N/A"}
                    </span>
                  }
                />
                <InfoRow
                  label="Weight"
                  value={
                    <span className="font-mono text-indigo-600">
                      {shipment.cargo_weight ? `${shipment.cargo_weight.toLocaleString()} kg` : "N/A"}
                    </span>
                  }
                />
                <InfoRow label="Consigner" value={shipment.consigner || "N/A"} />
                <InfoRow label="Consignee" value={shipment.consignee || "N/A"} />
              </div>
            </InfoCard>

            {/* Vehicle & Transport */}
            <InfoCard iconText="🚛" title="Vehicle & Transport">
              <div className="space-y-1">
                <InfoRow label="Vehicle Type" value={shipment.vehicle_type || "N/A"} />
                <InfoRow label="Vehicle Size" value={shipment.vehicle_size ? `${shipment.vehicle_size} ft` : "N/A"} />
                <InfoRow label="Number of Vehicles" value={shipment.no_of_vehicles || "N/A"} />
                <InfoRow label="Stuffing Location" value={shipment.stuffing_location || "N/A"} />
              </div>
            </InfoCard>

            {/* Container Summary */}
            <InfoCard iconText="📦" title="Container Summary">
              <div className="space-y-1">
                <InfoRow label="20ft Containers" value={shipment.containers_20ft || 0} />
                <InfoRow label="40ft Containers" value={shipment.containers_40ft || 0} />
                <InfoRow
                  label="Total Containers"
                  value={<span className="font-bold text-indigo-600">{shipment.total_containers || 0}</span>}
                />
              </div>
            </InfoCard>

            {/* Route & Schedule */}
            <InfoCard iconText="📍" title="Route & Schedule" className="md:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-green-600 text-lg">📍</span>
                    <span className="font-bold text-green-800">Pickup</span>
                  </div>
                  <p className="text-gray-800 font-semibold text-sm">{shipment.pickup_location || "N/A"}</p>
                  <p className="text-xs text-gray-500 mt-1">Expected: {formatDate(shipment.expected_pickup_date)}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-blue-600 text-lg">📍</span>
                    <span className="font-bold text-blue-800">Delivery</span>
                  </div>
                  <p className="text-gray-800 font-semibold text-sm">{shipment.delivery_location || "N/A"}</p>
                  <p className="text-xs text-gray-500 mt-1">Expected: {formatDate(shipment.expected_delivery_date)}</p>
                </div>
              </div>
            </InfoCard>

            {/* Vehicle Details */}
            {containerDetails && containerDetails.length > 0 && (
              <InfoCard iconText="🚛" title="Vehicle Details" className="md:col-span-2 xl:col-span-3">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle No.</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transporter</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Charge</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {containerDetails.map((container, index) => (
                        <tr key={`vehicle-${container.id}`} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{container.vehicle_number || "N/A"}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{container.driver_name || "N/A"}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            {container.driver_contact ? (
                              <a href={`tel:${container.driver_contact}`} className="text-indigo-600 hover:underline">
                                {container.driver_contact}
                              </a>
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{container.license_number || "N/A"}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{container.transporter_name || "N/A"}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-green-600">₹{container.total_charge?.toLocaleString() || 0}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => {
                                setSelectedVehicle(container);
                                setShowPaymentModal(true);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-xs font-semibold shadow-sm"
                            >
                              <span>💰</span>
                              Pay
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </InfoCard>
            )}

            {/* Container Details */}
            {containerDetails && containerDetails.length > 0 && containerDetails.some(container => container.container_no) && (
              <InfoCard iconText="📦" title="Container Details" className="md:col-span-2 xl:col-span-3">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Container No.</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seal 1</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seal 2</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Line</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {containerDetails.filter(container => container.container_no).map((container, index) => (
                        <tr key={`container-${container.id}`} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{container.container_no || "N/A"}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{container.container_size ? `${container.container_size}ft` : "N/A"}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{container.container_type || "N/A"}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{container.number_of_containers || "N/A"}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            {container.container_total_weight ? `${container.container_total_weight.toLocaleString()} kg` : "N/A"}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{container.seal1 || "N/A"}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{container.seal2 || "N/A"}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{container.line || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </InfoCard>
            )}

            {/* Transaction History */}
            <InfoCard iconText="💸" title="Transaction History" className="md:col-span-2 xl:col-span-3">
              {isLoadingTransactions ? (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-3 text-gray-500 text-sm">Loading payment details...</p>
                </div>
              ) : (
                <TransactionHistory transactions={transactions} totalAmount={getTotalAmount()} />
              )}
            </InfoCard>

            {/* Admin Comment */}
            {shipment.admin_comment && (
              <InfoCard iconText="👤" title="Admin Comment" className="md:col-span-2 xl:col-span-3">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
                  <p className="text-gray-800 leading-relaxed text-sm">{shipment.admin_comment}</p>
                </div>
              </InfoCard>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-100 p-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              Last updated: {shipment.updated_at ? formatDateTime(shipment.updated_at) : "N/A"}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          shipment={{ ...shipment, total_amount: getTotalAmount() }}
          vehicleData={selectedVehicle || (containerDetails && containerDetails.length > 0 ? containerDetails[0] : null)}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedVehicle(null);
          }}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
};

export default ShipmentDetailsModal;