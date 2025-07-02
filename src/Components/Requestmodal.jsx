import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
  Truck,
} from "lucide-react";

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

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "in progress":
      return "bg-blue-100 text-blue-800";
    case "completed":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-yellow-100 text-yellow-800";
  }
};

export default function RequestModal({
  selectedRequest,
  transporterDetails,
  adminComment,
  setAdminComment,
  updating,
  onClose,
  onStatusUpdate,
}) {
  if (!selectedRequest) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900">
              Request #{selectedRequest.id} - Complete Details
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service Request Details */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Service Request Details
              </h4>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Customer Name
                    </label>
                    <div className="text-sm text-gray-900">
                      {selectedRequest.customer_name}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Customer Email
                    </label>
                    <div className="text-sm text-gray-900">
                      {selectedRequest.customer_email}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Consignee
                    </label>
                    <div className="text-sm text-gray-900">
                      {selectedRequest.consignee}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Consigner
                    </label>
                    <div className="text-sm text-gray-900">
                      {selectedRequest.consigner}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Vehicle Type
                    </label>
                    <div className="text-sm text-gray-900">
                      {selectedRequest.vehicle_type}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Vehicle Size
                    </label>
                    <div className="text-sm text-gray-900">
                      {selectedRequest.vehicle_size}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Commodity
                    </label>
                    <div className="text-sm text-gray-900">
                      {selectedRequest.commodity}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Cargo Type
                    </label>
                    <div className="text-sm text-gray-900">
                      {selectedRequest.cargo_type}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Cargo Weight (kg)
                    </label>
                    <div className="text-sm text-gray-900">
                      {selectedRequest.cargo_weight}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      20ft Containers
                    </label>
                    <div className="text-sm text-gray-900">
                      {selectedRequest.containers_20ft}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      40ft Containers
                    </label>
                    <div className="text-sm text-gray-900">
                      {selectedRequest.containers_40ft}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Types
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {parseServiceType(selectedRequest.service_type).map(
                      (service, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {service}
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Pickup Location
                    </label>
                    <div className="text-sm text-gray-900">
                      {selectedRequest.pickup_location}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Stuffing Location
                    </label>
                    <div className="text-sm text-gray-900">
                      {selectedRequest.stuffing_location}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Delivery Location
                    </label>
                    <div className="text-sm text-gray-900">
                      {selectedRequest.delivery_location}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Expected Pickup Date
                    </label>
                    <div className="text-sm text-gray-900">
                      {selectedRequest.expected_pickup_date
                        ? new Date(
                            selectedRequest.expected_pickup_date
                          ).toLocaleDateString()
                        : "Not specified"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Expected Delivery Date
                    </label>
                    <div className="text-sm text-gray-900">
                      {selectedRequest.expected_delivery_date
                        ? new Date(
                            selectedRequest.expected_delivery_date
                          ).toLocaleDateString()
                        : "Not specified"}
                    </div>
                  </div>
                </div>

                <div></div>
              </div>
            </div>

            {/* Transporter Details */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Truck className="h-5 w-5 mr-2" />
                Transporter Details
              </h4>

              {transporterDetails && transporterDetails.length > 0 ? (
                <div className="space-y-6">
                  {transporterDetails.map((transporter, index) => (
                    <div
                      key={transporter.id || index}
                      className="bg-white p-4 rounded-lg border mb-4"
                    >
                      <h5 className="font-medium text-gray-900 mb-3">
                        Vehicle {index + 1}{" "}
                        {transporter.vehicle_sequence
                          ? `(Sequence: ${transporter.vehicle_sequence})`
                          : ""}
                      </h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Transporter Name
                          </label>
                          <div className="text-sm text-gray-900">
                            {transporter.transporter_name}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Vehicle Number
                          </label>
                          <div className="text-sm text-gray-900">
                            {transporter.vehicle_number}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Driver Name
                          </label>
                          <div className="text-sm text-gray-900">
                            {transporter.driver_name}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Driver Contact
                          </label>
                          <div className="text-sm text-gray-900">
                            {transporter.driver_contact}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            License Number
                          </label>
                          <div className="text-sm text-gray-900">
                            {transporter.license_number}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            License Expiry
                          </label>
                          <div className="text-sm text-gray-900">
                            {transporter.license_expiry
                              ? new Date(
                                  transporter.license_expiry
                                ).toLocaleDateString()
                              : "Not specified"}
                          </div>
                        </div>
                      </div>

                      {/* Container Details */}
                      {transporter.container_no && (
                        <div className="mt-4 pt-4 border-t">
                          <h6 className="font-medium text-gray-900 mb-2">
                            Container Details
                          </h6>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Container Number
                              </label>
                              <div className="text-sm text-gray-900">
                                {transporter.container_no}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Line
                              </label>
                              <div className="text-sm text-gray-900">
                                {transporter.line}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Seal Number
                              </label>
                              <div className="text-sm text-gray-900">
                                {transporter.seal_no}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t">
                        <h6 className="font-medium text-gray-900 mb-2">
                          Charges
                        </h6>
                        <div className="text-sm text-gray-900">
                          <div className="font-semibold text-gray-900">
                            Total Charge: ₹{transporter.total_charge}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Truck className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No Transporter Details
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Transporter details have not been assigned yet.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Admin Comment and Actions */}
          <div className="mt-6 bg-gray-50 rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              Admin Review
            </h4>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Status
              </label>
              <span
                className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(
                  selectedRequest.status
                )}`}
              >
                {selectedRequest.status || "pending"}
              </span>
            </div>

            {selectedRequest.admin_comment && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Previous Admin Comment
                </label>
                <div className="bg-white p-3 rounded border text-sm text-gray-900">
                  {selectedRequest.admin_comment}
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Admin Comment *
              </label>
              <textarea
                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="4"
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                placeholder="Enter your comment about this request..."
                required
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={() => onStatusUpdate(selectedRequest.id, "rejected")}
                disabled={updating}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 focus:ring-2 focus:ring-red-500 flex items-center"
              >
                {updating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                {updating ? "Updating..." : "Reject"}
              </button>
              <button
                onClick={() => onStatusUpdate(selectedRequest.id, "approved")}
                disabled={updating}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 focus:ring-2 focus:ring-green-500 flex items-center"
              >
                {updating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {updating ? "Updating..." : "Approve"}
              </button>
              <button
                onClick={() =>
                  onStatusUpdate(selectedRequest.id, "in progress")
                }
                disabled={updating}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 focus:ring-2 focus:ring-blue-500 flex items-center"
              >
                {updating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                ) : (
                  <AlertCircle className="h-4 w-4 mr-2" />
                )}
                {updating ? "Updating..." : "In Progress"}
              </button>
              <button
                onClick={() => onStatusUpdate(selectedRequest.id, "completed")}
                disabled={updating}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 focus:ring-2 focus:ring-purple-500 flex items-center"
              >
                {updating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {updating ? "Updating..." : "Complete"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
