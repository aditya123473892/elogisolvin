import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
  Truck,
  Calendar,
  Clock,
  Weight,
  DollarSign,
  Download,
} from "lucide-react";

const parseServiceType = (serviceType) => {
  if (!serviceType) return [];
  try {
    const parsed =
      typeof serviceType === "string" ? JSON.parse(serviceType) : serviceType;
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Error parsing service type:", e);
    return [];
  }
};

const parseServicePrices = (servicePrices) => {
  if (!servicePrices) return {};
  try {
    return typeof servicePrices === "string"
      ? JSON.parse(servicePrices)
      : servicePrices;
  } catch (e) {
    console.error("Error parsing service prices:", e);
    return {};
  }
};

const formatCurrency = (amount) => {
  if (!amount || amount === 0) return "Not specified";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
};

const formatDateTime = (date, time) => {
  if (!date) return "Not specified";
  const formattedDate = new Date(date).toLocaleDateString("en-IN");
  return time ? `${formattedDate} at ${time}` : formattedDate;
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

// Function to group vehicles by unique identifier and consolidate containers
const groupVehiclesByIdentifier = (transporterDetails) => {
  if (!transporterDetails || transporterDetails.length === 0) return [];

  const vehicleMap = new Map();

  transporterDetails.forEach((detail) => {
    // Create a unique key for each vehicle (vehicle_number + transporter_name for safety)
    const vehicleKey = `${detail.vehicle_number}_${detail.transporter_name}`;

    if (vehicleMap.has(vehicleKey)) {
      // Add container to existing vehicle
      const existingVehicle = vehicleMap.get(vehicleKey);
      if (detail.container_no) {
        existingVehicle.containers.push({
          container_no: detail.container_no,
          line: detail.line,
          seal_no: detail.seal_no,
          id: detail.id,
        });
      }
    } else {
      // Create new vehicle entry
      const vehicleData = {
        ...detail,
        containers: detail.container_no
          ? [
              {
                container_no: detail.container_no,
                line: detail.line,
                seal_no: detail.seal_no,
                id: detail.id,
              },
            ]
          : [],
      };
      vehicleMap.set(vehicleKey, vehicleData);
    }
  });

  return Array.from(vehicleMap.values());
};

// Function to generate individual vehicle GR
const generateVehicleGR = (selectedRequest, transporter, vehicleIndex) => {
  const serviceTypes = parseServiceType(selectedRequest.service_type);

  const grContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Vehicle GR - ${
          selectedRequest.formatted_request_id ||
          `Booking #${selectedRequest.id}`
        } - Vehicle ${vehicleIndex + 1}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px;
            color: #000;
            background: white;
          }
          .gr-container { max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .company-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .document-title { font-size: 18px; font-weight: bold; margin-top: 10px; }
          .section { margin-bottom: 20px; }
          .section-title { 
            font-size: 16px; 
            font-weight: bold; 
            background: #f0f0f0; 
            padding: 8px; 
            border: 1px solid #000;
            margin-bottom: 10px;
          }
          .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            margin-bottom: 15px;
          }
          .info-item { margin-bottom: 8px; }
          .label { font-weight: bold; display: inline-block; width: 140px; }
          .value { display: inline-block; }
          .vehicle-section { 
            border: 2px solid #000; 
            margin-bottom: 20px; 
            padding: 15px;
          }
          .vehicle-header { 
            background: #e0e0e0; 
            padding: 10px; 
            margin: -15px -15px 15px -15px;
            font-weight: bold;
            font-size: 16px;
          }
          .container-details { 
            border: 1px solid #ccc; 
            padding: 10px; 
            margin: 10px 0;
            background: #f9f9f9;
          }
          .signature-section { 
            margin-top: 40px; 
            display: grid; 
            grid-template-columns: 1fr 1fr 1fr; 
            gap: 30px;
          }
          .signature-box { 
            text-align: center; 
            border-top: 1px solid #000; 
            padding-top: 10px;
          }
          .footer { 
            text-align: center; 
            margin-top: 30px; 
            font-size: 12px; 
            border-top: 1px solid #ccc; 
            padding-top: 10px;
          }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="gr-container">
          <!-- Header -->
          <div class="header">
            <div class="company-name">TRANSPORT LOGISTICS COMPANY</div>
            <div style="font-size: 14px; color: #666;">
              Address: Transport Hub, Industrial Area, City - 123456<br/>
              Phone: +91-XXXXXXXXXX | Email: info@transportlogistics.com
            </div>
            <div class="document-title">VEHICLE GOODS RECEIPT (GR)</div>
            <div style="font-size: 14px; margin-top: 10px;">
              <strong>GR No:</strong> ${
                selectedRequest.formatted_request_id ||
                `GR-${selectedRequest.id}`
              }-V${vehicleIndex + 1} | 
              <strong> Date:</strong> ${new Date().toLocaleDateString("en-IN")}
            </div>
          </div>

          <!-- Customer Information -->
          <div class="section">
            <div class="section-title">CUSTOMER INFORMATION</div>
            <div class="info-grid">
              <div>
                <div class="info-item">
                  <span class="label">Customer Name:</span>
                  <span class="value">${
                    selectedRequest.customer_name || "Not specified"
                  }</span>
                </div>
                <div class="info-item">
                  <span class="label">Customer Email:</span>
                  <span class="value">${
                    selectedRequest.customer_email || "Not specified"
                  }</span>
                </div>
                <div class="info-item">
                  <span class="label">Consignee:</span>
                  <span class="value">${
                    selectedRequest.consignee || "Not specified"
                  }</span>
                </div>
              </div>
              <div>
                <div class="info-item">
                  <span class="label">Consigner:</span>
                  <span class="value">${
                    selectedRequest.consigner || "Not specified"
                  }</span>
                </div>
                <div class="info-item">
                  <span class="label">Request ID:</span>
                  <span class="value">${
                    selectedRequest.formatted_request_id ||
                    `REQ-${selectedRequest.id}`
                  }</span>
                </div>
                <div class="info-item">
                  <span class="label">Status:</span>
                  <span class="value" style="font-weight: bold; text-transform: uppercase;">
                    ${selectedRequest.status || "PENDING"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Shipment Details -->
          <div class="section">
            <div class="section-title">SHIPMENT DETAILS</div>
            <div class="info-grid">
              <div>
                <div class="info-item">
                  <span class="label">Pickup Location:</span>
                  <span class="value">${
                    selectedRequest.pickup_location || "Not specified"
                  }</span>
                </div>
                <div class="info-item">
                  <span class="label">Delivery Location:</span>
                  <span class="value">${
                    selectedRequest.delivery_location || "Not specified"
                  }</span>
                </div>
                <div class="info-item">
                  <span class="label">Commodity:</span>
                  <span class="value">${
                    selectedRequest.commodity || "Not specified"
                  }</span>
                </div>
                <div class="info-item">
                  <span class="label">Cargo Type:</span>
                  <span class="value">${
                    selectedRequest.cargo_type || "Not specified"
                  }</span>
                </div>
              </div>
              <div>
                <div class="info-item">
                  <span class="label">Expected Pickup:</span>
                  <span class="value">${formatDateTime(
                    selectedRequest.expected_pickup_date,
                    selectedRequest.expected_pickup_time
                  )}</span>
                </div>
                <div class="info-item">
                  <span class="label">Expected Delivery:</span>
                  <span class="value">${formatDateTime(
                    selectedRequest.expected_delivery_date,
                    selectedRequest.expected_delivery_time
                  )}</span>
                </div>
                <div class="info-item">
                  <span class="label">Service Types:</span>
                  <span class="value">${
                    serviceTypes.length > 0
                      ? serviceTypes.join(", ")
                      : "Not specified"
                  }</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Vehicle Details -->
          <div class="vehicle-section">
            <div class="vehicle-header">
              VEHICLE DETAILS - ${transporter.vehicle_number || "Not specified"}
              ${
                transporter.vehicle_sequence
                  ? ` (Sequence: ${transporter.vehicle_sequence})`
                  : ""
              }
            </div>
            
            <div class="info-grid">
              <div>
                <div class="info-item">
                  <span class="label">Transporter:</span>
                  <span class="value">${
                    transporter.transporter_name || "Not specified"
                  }</span>
                </div>
                <div class="info-item">
                  <span class="label">Driver Name:</span>
                  <span class="value">${
                    transporter.driver_name || "Not specified"
                  }</span>
                </div>
                <div class="info-item">
                  <span class="label">Driver Contact:</span>
                  <span class="value">${
                    transporter.driver_contact || "Not specified"
                  }</span>
                </div>
              </div>
              <div>
                <div class="info-item">
                  <span class="label">License Number:</span>
                  <span class="value">${
                    transporter.license_number || "Not specified"
                  }</span>
                </div>
                <div class="info-item">
                  <span class="label">License Expiry:</span>
                  <span class="value">
                    ${
                      transporter.license_expiry
                        ? new Date(
                            transporter.license_expiry
                          ).toLocaleDateString("en-IN")
                        : "Not specified"
                    }
                  </span>
                </div>
              </div>
            </div>

            ${
              transporter.containers && transporter.containers.length > 0
                ? `
              <div>
                <div style="font-weight: bold; margin: 15px 0 10px 0;">
                  Container Details (${
                    transporter.containers.length
                  } container${transporter.containers.length > 1 ? "s" : ""}):
                </div>
                ${transporter.containers
                  .map(
                    (container, containerIndex) => `
                  <div class="container-details">
                    <div style="font-weight: bold; margin-bottom: 8px;">
                      Container ${containerIndex + 1}
                    </div>
                    <div class="info-grid">
                      <div>
                        <div class="info-item">
                          <span class="label">Container No:</span>
                          <span class="value">${
                            container.container_no || "Not specified"
                          }</span>
                        </div>
                        <div class="info-item">
                          <span class="label">Line:</span>
                          <span class="value">${
                            container.line || "Not specified"
                          }</span>
                        </div>
                      </div>
                      <div>
                        <div class="info-item">
                          <span class="label">Seal Number:</span>
                          <span class="value">${
                            container.seal_no || "Not specified"
                          }</span>
                        </div>
                      </div>
                    </div>
                  </div>
                `
                  )
                  .join("")}
              </div>
            `
                : ""
            }

            <!-- Charges -->
            <div style="margin-top: 15px; padding: 10px; background: #f0f0f0; border: 1px solid #ccc;">
              <div style="font-weight: bold; margin-bottom: 8px;">CHARGES:</div>
              <div class="info-grid">
                <div>
                  <div class="info-item">
                    <span class="label">Base Charge:</span>
                    <span class="value">${formatCurrency(
                      transporter.total_charge
                    )}</span>
                  </div>
                </div>
                <div>
                  <div class="info-item">
                    <span class="label">Additional Charges:</span>
                    <span class="value">${formatCurrency(
                      transporter.additional_charges
                    )}</span>
                  </div>
                </div>
              </div>
              <div style="border-top: 1px solid #999; padding-top: 8px; margin-top: 8px;">
                <div class="info-item">
                  <span class="label" style="font-size: 16px;">Vehicle Total:</span>
                  <span class="value" style="font-size: 16px; font-weight: bold;">
                    ${formatCurrency(
                      (transporter.total_charge || 0) +
                        (transporter.additional_charges || 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          ${
            selectedRequest.admin_comment
              ? `
            <!-- Admin Comments -->
            <div class="section">
              <div class="section-title">ADMIN COMMENTS</div>
              <div style="padding: 10px; border: 1px solid #ccc; background: #f9f9f9;">
                ${selectedRequest.admin_comment}
              </div>
            </div>
          `
              : ""
          }

          <!-- Signature Section -->
          <div class="signature-section">
            <div class="signature-box">
              <div>Customer Signature</div>
              <div style="font-size: 12px; margin-top: 5px;">Date: ___________</div>
            </div>
            <div class="signature-box">
              <div>Driver Signature</div>
              <div style="font-size: 12px; margin-top: 5px;">Date: ___________</div>
            </div>
            <div class="signature-box">
              <div>Company Representative</div>
              <div style="font-size: 12px; margin-top: 5px;">Date: ___________</div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div>This is a computer generated vehicle-specific document.</div>
            <div style="margin-top: 5px;">
              Generated on: ${new Date().toLocaleString("en-IN")} | 
              Vehicle GR Reference: ${
                selectedRequest.formatted_request_id ||
                `GR-${selectedRequest.id}`
              }-V${vehicleIndex + 1}
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  printWindow.document.write(grContent);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 250);
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

  const serviceTypes = parseServiceType(selectedRequest.service_type);
  const servicePrices = parseServicePrices(selectedRequest.service_prices);
  const groupedTransporters = groupVehiclesByIdentifier(transporterDetails);

  const handleVehicleGRDownload = (transporter, index) => {
    generateVehicleGR(selectedRequest, transporter, index);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900">
              {selectedRequest.formatted_request_id ||
                `Booking #${selectedRequest.id}`}{" "}
              - Complete Details
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
                {/* Customer Information */}
                <div className="bg-white p-4 rounded-lg border">
                  <h5 className="font-medium text-gray-900 mb-3">
                    Customer Information
                  </h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Customer Name
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedRequest.customer_name || "Not specified"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Customer Email
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedRequest.customer_email || "Not specified"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Consignee
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedRequest.consignee || "Not specified"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Consigner
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedRequest.consigner || "Not specified"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vehicle & Cargo Information */}
                <div className="bg-white p-4 rounded-lg border">
                  <h5 className="font-medium text-gray-900 mb-3">
                    Vehicle & Cargo Information
                  </h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Vehicle Type
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedRequest.vehicle_type || "Not specified"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Vehicle Size
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedRequest.vehicle_size || "Not specified"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Commodity
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedRequest.commodity || "Not specified"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Cargo Type
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedRequest.cargo_type || "Not specified"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Number of Vehicles
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedRequest.no_of_vehicles || 1}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Vehicle Status
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedRequest.vehicle_status || "Not specified"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        <Weight className="h-4 w-4 inline mr-1" />
                        Cargo Weight (kg)
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedRequest.cargo_weight || "Not specified"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        20ft Containers
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedRequest.containers_20ft || 0}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        40ft Containers
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedRequest.containers_40ft || 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Types & Pricing */}
                <div className="bg-white p-4 rounded-lg border">
                  <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Service Types & Pricing
                  </h5>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Types
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {serviceTypes.length > 0 ? (
                        serviceTypes.map((service, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {service}
                          </span>
                        ))
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          No services specified
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Requested Price
                      </label>
                      <div className="text-sm text-gray-900 font-medium">
                        {formatCurrency(selectedRequest.requested_price)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Service Prices
                      </label>
                      <div className="text-sm text-gray-900">
                        {Object.keys(servicePrices).length > 0 ? (
                          <div className="space-y-1">
                            {Object.entries(servicePrices).map(
                              ([service, price]) => (
                                <div
                                  key={service}
                                  className="flex justify-between"
                                >
                                  <span className="text-gray-600">
                                    {service}:
                                  </span>
                                  <span className="font-medium">
                                    {formatCurrency(price)}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          "No service prices specified"
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="bg-white p-4 rounded-lg border">
                  <h5 className="font-medium text-gray-900 mb-3">
                    Location Information
                  </h5>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Pickup Location
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedRequest.pickup_location || "Not specified"}
                      </div>
                    </div>
                    {selectedRequest.stuffing_location && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Stuffing Location
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedRequest.stuffing_location}
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Delivery Location
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedRequest.delivery_location || "Not specified"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Schedule Information */}
                <div className="bg-white p-4 rounded-lg border">
                  <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Schedule Information
                  </h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Expected Pickup
                      </label>
                      <div className="text-sm text-gray-900">
                        {formatDateTime(
                          selectedRequest.expected_pickup_date,
                          selectedRequest.expected_pickup_time
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Expected Delivery
                      </label>
                      <div className="text-sm text-gray-900">
                        {formatDateTime(
                          selectedRequest.expected_delivery_date,
                          selectedRequest.expected_delivery_time
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Request Created
                      </label>
                      <div className="text-sm text-gray-900">
                        {new Date(selectedRequest.created_at).toLocaleString(
                          "en-IN"
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Last Updated
                      </label>
                      <div className="text-sm text-gray-900">
                        {new Date(selectedRequest.updated_at).toLocaleString(
                          "en-IN"
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transporter Details */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Truck className="h-5 w-5 mr-2" />
                Transporter Details
              </h4>

              {groupedTransporters && groupedTransporters.length > 0 ? (
                <div className="space-y-6">
                  {groupedTransporters.map((transporter, index) => (
                    <div
                      key={`${transporter.vehicle_number}_${index}`}
                      className="bg-white p-4 rounded-lg border mb-4"
                    >
                      {/* Vehicle Header with Download Button */}
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="font-medium text-gray-900">
                          Vehicle {index + 1}{" "}
                          {transporter.vehicle_sequence
                            ? `(Sequence: ${transporter.vehicle_sequence})`
                            : ""}
                        </h5>
                        <button
                          onClick={() =>
                            handleVehicleGRDownload(transporter, index)
                          }
                          className="flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 transition-colors"
                          title={`Download GR for Vehicle ${index + 1}`}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download GR
                        </button>
                      </div>

                      {/* Vehicle Basic Details */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Transporter Name
                          </label>
                          <div className="text-sm text-gray-900">
                            {transporter.transporter_name || "Not specified"}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Vehicle Number
                          </label>
                          <div className="text-sm text-gray-900">
                            {transporter.vehicle_number || "Not specified"}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Driver Name
                          </label>
                          <div className="text-sm text-gray-900">
                            {transporter.driver_name || "Not specified"}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Driver Contact
                          </label>
                          <div className="text-sm text-gray-900">
                            {transporter.driver_contact || "Not specified"}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            License Number
                          </label>
                          <div className="text-sm text-gray-900">
                            {transporter.license_number || "Not specified"}
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
                                ).toLocaleDateString("en-IN")
                              : "Not specified"}
                          </div>
                        </div>
                      </div>

                      {/* Container Details - Multiple containers per vehicle */}
                      {transporter.containers &&
                        transporter.containers.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <h6 className="font-medium text-gray-900 mb-3">
                              Container Details ({transporter.containers.length}{" "}
                              container
                              {transporter.containers.length > 1 ? "s" : ""})
                            </h6>
                            <div className="space-y-3">
                              {transporter.containers.map(
                                (container, containerIndex) => (
                                  <div
                                    key={container.id || containerIndex}
                                    className="bg-gray-50 p-3 rounded-lg"
                                  >
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-sm font-medium text-gray-700">
                                        Container {containerIndex + 1}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600">
                                          Container Number
                                        </label>
                                        <div className="text-sm text-gray-900">
                                          {container.container_no ||
                                            "Not specified"}
                                        </div>
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600">
                                          Line
                                        </label>
                                        <div className="text-sm text-gray-900">
                                          {container.line || "Not specified"}
                                        </div>
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600">
                                          Seal Number
                                        </label>
                                        <div className="text-sm text-gray-900">
                                          {container.seal_no || "Not specified"}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      <div className="mt-4 pt-4 border-t">
                        <h6 className="font-medium text-gray-900 mb-2">
                          Charges
                        </h6>
                        <div className="text-sm text-gray-900">
                          <div className="font-semibold text-gray-900">
                            Total Charge:{" "}
                            {formatCurrency(transporter.total_charge)}
                          </div>
                        </div>
                        <div className="text-sm text-gray-900">
                          <div className="font-semibold text-gray-900">
                            Additional Charge:{" "}
                            {formatCurrency(transporter.additional_charges)}
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
                disabled={updating || !adminComment.trim()}
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
                disabled={updating || !adminComment.trim()}
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
                disabled={updating || !adminComment.trim()}
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
                disabled={updating || !adminComment.trim()}
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
