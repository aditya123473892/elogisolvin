import React from "react";
import {
  Download,
  X,
  Truck,
  Package,
  MapPin,
  Calendar,
  User,
  FileText,
  DollarSign,
} from "lucide-react";

const ShipmentDetailsModal = ({ shipment, onClose, onDownloadInvoice }) => {
  if (!shipment) return null;

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        color: "bg-amber-50 text-amber-700 border-amber-200",
        label: "Pending",
        icon: "⏳",
      },
      approved: {
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        label: "Approved",
        icon: "✓",
      },
      in_transit: {
        color: "bg-blue-50 text-blue-700 border-blue-200",
        label: "In Transit",
        icon: "🚛",
      },
      delivered: {
        color: "bg-green-50 text-green-700 border-green-200",
        label: "Delivered",
        icon: "📦",
      },
      cancelled: {
        color: "bg-red-50 text-red-700 border-red-200",
        label: "Cancelled",
        icon: "✕",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
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

  const InfoCard = ({ icon: Icon, title, children, className = "" }) => (
    <div
      className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Icon className="w-5 h-5 text-blue-600" />
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
      <div className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
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
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Basic Information */}
            <InfoCard icon={FileText} title="Basic Information">
              <div className="space-y-1">
                <InfoRow label="Customer ID" value={shipment.customer_id} />
                <InfoRow
                  label="Created"
                  value={new Date(shipment.created_at).toLocaleDateString()}
                />
                <InfoRow
                  label="Updated"
                  value={new Date(shipment.updated_at).toLocaleDateString()}
                />
                <InfoRow
                  label="Requested Price"
                  value={
                    <span className="text-green-600 font-semibold">
                      ₹{shipment.requested_price?.toLocaleString()}
                    </span>
                  }
                />
              </div>
            </InfoCard>

            {/* Cargo Details */}
            <InfoCard icon={Package} title="Cargo Details">
              <div className="space-y-1">
                <InfoRow label="Commodity" value={shipment.commodity} />
                <InfoRow label="Cargo Type" value={shipment.cargo_type} />
                <InfoRow
                  label="Weight"
                  value={
                    <span className="font-mono text-blue-600">
                      {shipment.cargo_weight} kg
                    </span>
                  }
                />
                <InfoRow label="Consigner" value={shipment.consigner} />
                <InfoRow label="Consignee" value={shipment.consignee} />
              </div>
            </InfoCard>

            {/* Vehicle & Transport */}
            <InfoCard icon={Truck} title="Vehicle & Transport">
              <div className="space-y-1">
                <InfoRow label="Vehicle Type" value={shipment.vehicle_type} />
                <InfoRow
                  label="Vehicle Size"
                  value={`${shipment.vehicle_size} ft`}
                />
                <InfoRow
                  label="Number of Vehicles"
                  value={shipment.no_of_vehicles}
                />
                {shipment.driver_name && (
                  <>
                    <InfoRow label="Driver" value={shipment.driver_name} />
                    <InfoRow
                      label="Phone"
                      value={
                        <a
                          href={`tel:${shipment.driver_phone}`}
                          className="text-blue-600 hover:underline"
                        >
                          {shipment.driver_phone}
                        </a>
                      }
                    />
                  </>
                )}
              </div>
            </InfoCard>

            {/* Container Details */}
            <InfoCard icon={Package} title="Container Details">
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
                {shipment.stuffing_location && (
                  <InfoRow
                    label="Stuffing Location"
                    value={shipment.stuffing_location}
                  />
                )}
              </div>
            </InfoCard>

            {/* Route & Schedule */}
            <InfoCard
              icon={MapPin}
              title="Route & Schedule"
              className="lg:col-span-2"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-green-800">
                        Pickup
                      </span>
                    </div>
                    <p className="text-gray-900 font-medium">
                      {shipment.pickup_location}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Expected:{" "}
                      {shipment.expected_pickup_date
                        ? new Date(
                            shipment.expected_pickup_date
                          ).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-blue-800">
                        Delivery
                      </span>
                    </div>
                    <p className="text-gray-900 font-medium">
                      {shipment.delivery_location}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Expected:{" "}
                      {shipment.expected_delivery_date
                        ? new Date(
                            shipment.expected_delivery_date
                          ).toLocaleDateString()
                        : "N/A"}
                    </p>
                    {shipment.estimated_delivery && (
                      <p className="text-sm text-blue-600 mt-1">
                        Est. Delivery:{" "}
                        {new Date(shipment.estimated_delivery).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </InfoCard>

            {/* Services & Pricing */}
            <InfoCard
              icon={DollarSign}
              title="Services & Pricing"
              className="lg:col-span-2 xl:col-span-3"
            >
              <div className="space-y-4">
                <div>
                  <h5 className="font-medium text-gray-700 mb-3">Services</h5>
                  <div className="flex flex-wrap gap-2">
                    {parseServices(shipment.service_type).map(
                      (service, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm"
                        >
                          {service}
                        </span>
                      )
                    )}
                  </div>
                </div>

                {shipment.service_prices && (
                  <div>
                    <h5 className="font-medium text-gray-700 mb-3">
                      Service Pricing
                    </h5>
                    <div className="bg-gray-50 rounded-lg p-4 border">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(shipment.service_prices).map(
                          ([service, price]) => (
                            <div
                              key={service}
                              className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm"
                            >
                              <span className="text-gray-700 font-medium">
                                {service}
                              </span>
                              <span className="text-green-600 font-semibold">
                                ₹{price}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </InfoCard>

            {/* Admin Comment */}
            {shipment.admin_comment && (
              <InfoCard
                icon={User}
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
              Last updated: {new Date(shipment.updated_at).toLocaleString()}
            </div>
            <div className="flex gap-3">
              {onDownloadInvoice && (
                <button
                  onClick={() => onDownloadInvoice(shipment)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download Invoice
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipmentDetailsModal;
