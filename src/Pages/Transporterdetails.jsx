import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { transporterAPI } from "../utils/Api"; // Import the specific API methods

export const TransporterDetails = ({
  transportRequestId,
  transporterData,
  setTransporterData,
  isEditMode = false,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transporterId, setTransporterId] = useState(null);

  // Initialize transporter data with default values
  // In the useEffect for initializing transporter data, add the new field
  useEffect(() => {
    if (!transporterData || Object.keys(transporterData).length === 0) {
      setTransporterData({
        transporterName: "",
        vehicleNumber: "",
        vehicleMake: "",
        modelYear: "",
        driverName: "",
        driverContact: "",
        licenseNumber: "",
        licenseExpiry: "",
        baseCharge: "",
        additionalCharges: "",
        totalCharge: 0,
        containerNo: "",
        line: "",
        sealNo: "",
        numberOfContainers: "", // New field
      });
    }
  }, [transporterData, setTransporterData]);

  // Load existing transporter details if in edit mode or when transportRequestId changes
  // Update the useEffect dependency array
  // Update the useEffect dependency array
  // First, define the loadTransporterDetails function
  const loadTransporterDetails = async () => {
    setIsLoading(true);
    try {
      // Use the API method instead of direct api call
      const response = await transporterAPI.getTransporterByRequestId(
        transportRequestId
      );

      if (response.success) {
        const details = response.data;
        // Store the transporter ID for future updates
        setTransporterId(details.id);

        // In the loadTransporterDetails function, add the new field when mapping from API response
        setTransporterData({
          id: details.id,
          transporterName: details.transporter_name || "",
          vehicleNumber: details.vehicle_number || "",
          vehicleMake: details.vehicle_make || "",
          modelYear: details.model_year || "",
          driverName: details.driver_name || "",
          driverContact: details.driver_contact || "",
          licenseNumber: details.license_number || "",
          licenseExpiry: details.license_expiry || "",
          baseCharge: details.base_charge || 0,
          additionalCharges: details.additional_charges || 0,
          totalCharge: details.total_charge || 0,
          containerNo: details.container_no || "",
          line: details.line || "",
          sealNo: details.seal_no || "",
          numberOfContainers: details.number_of_containers || "", // New field
        });

        // In the handleSubmit function, add the new field to the payload
        const payload = {
          transport_request_id: transportRequestId,
          transporter_name: transporterData.transporterName,
          vehicle_number: transporterData.vehicleNumber,
          vehicle_make: transporterData.vehicleMake || null,
          model_year: transporterData.modelYear
            ? parseInt(transporterData.modelYear)
            : null,
          driver_name: transporterData.driverName,
          driver_contact: transporterData.driverContact,
          license_number: transporterData.licenseNumber,
          license_expiry: transporterData.licenseExpiry,
          base_charge: parseFloat(transporterData.baseCharge) || 0,
          additional_charges:
            parseFloat(transporterData.additionalCharges) || 0,
          total_charge:
            parseFloat(transporterData.totalCharge) ||
            parseFloat(transporterData.baseCharge) +
              parseFloat(transporterData.additionalCharges) ||
            0,
          container_no: transporterData.containerNo || null,
          line: transporterData.line || null,
          seal_no: transporterData.sealNo || null,
          number_of_containers: transporterData.numberOfContainers
            ? parseInt(transporterData.numberOfContainers)
            : null, // New field
        };
        toast.info("Transporter details loaded");
      }
    } catch (error) {
      // Handle the case where no transporter details exist (404 or similar)
      if (error.status === 404 || error.message?.includes("not found")) {
        // No existing details found, reset transporter ID and keep empty form
        setTransporterId(null);
        console.log("No existing transporter details found");
      } else {
        console.error("Error loading transporter details:", error);
        toast.error(error.message || "Error loading transporter details");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Then, use it in the useEffect
  useEffect(() => {
    if (transportRequestId) {
      loadTransporterDetails();
    }
  }, [transportRequestId]); // Remove loadTransporterDetails from dependency array

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!transportRequestId) {
      toast.error("Transport request ID is required");
      return;
    }

    setIsSubmitting(true);

    // In the handleSubmit function
    try {
      // In the handleSubmit function, update the payload to include total_charge
      const payload = {
        transport_request_id: transportRequestId,
        transporter_name: transporterData.transporterName,
        vehicle_number: transporterData.vehicleNumber,
        vehicle_make: transporterData.vehicleMake || null,
        model_year: transporterData.modelYear
          ? parseInt(transporterData.modelYear)
          : null,
        driver_name: transporterData.driverName,
        driver_contact: transporterData.driverContact,
        license_number: transporterData.licenseNumber,
        license_expiry: transporterData.licenseExpiry,
        base_charge: parseFloat(transporterData.baseCharge) || 0,
        additional_charges: parseFloat(transporterData.additionalCharges) || 0,
        total_charge:
          parseFloat(transporterData.totalCharge) ||
          parseFloat(transporterData.baseCharge) +
            parseFloat(transporterData.additionalCharges) ||
          0,
      };

      let response;

      // Check if we have an existing transporter ID (either from loaded data or previous save)
      if (transporterId || transporterData.id) {
        // Update existing transporter details using the API method
        const idToUse = transporterId || transporterData.id;
        response = await transporterAPI.updateTransporter(idToUse, payload);
      } else {
        // Create new transporter details using the API method
        response = await transporterAPI.createTransporter(
          transportRequestId,
          payload
        );
      }

      if (response.success) {
        toast.success(
          response.message || "Transporter details saved successfully!"
        );

        // Update the form data with the response data if available
        if (response.data) {
          const newTransporterId = response.data.id;
          setTransporterId(newTransporterId);

          setTransporterData((prev) => ({
            ...prev,
            id: newTransporterId,
            totalCharge: response.data.total_charge,
          }));
        }
      }
    } catch (error) {
      console.error("Error saving transporter details:", error);
      toast.error(error.message || "Error saving transporter details");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow mt-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Transporter Details
          </h3>
        </div>
        <div className="p-6 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading transporter details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow mt-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Transporter Details
        </h3>
        {transportRequestId && (
          <p className="text-sm text-gray-600 mt-1">
            Request ID: {transportRequestId}
          </p>
        )}
        {transporterId && (
          <p className="text-sm text-gray-500 mt-1">
            Transporter ID: {transporterId}
          </p>
        )}
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transporter Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Transporter Name *
              </label>
              <input
                type="text"
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={transporterData?.transporterName || ""}
                onChange={(e) =>
                  setTransporterData((prev) => ({
                    ...prev,
                    transporterName: e.target.value,
                  }))
                }
                placeholder="Enter transporter name"
                required
              />
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Vehicle Number *
              </label>
              <input
                type="text"
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={transporterData?.vehicleNumber || ""}
                onChange={(e) =>
                  setTransporterData((prev) => ({
                    ...prev,
                    vehicleNumber: e.target.value,
                  }))
                }
                placeholder="Enter vehicle number"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Vehicle Make
              </label>
              <input
                type="text"
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={transporterData?.vehicleMake || ""}
                onChange={(e) =>
                  setTransporterData((prev) => ({
                    ...prev,
                    vehicleMake: e.target.value,
                  }))
                }
                placeholder="e.g., Tata, Ashok Leyland"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Vehicle Model Year
              </label>
              <input
                type="number"
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={transporterData?.modelYear || ""}
                onChange={(e) =>
                  setTransporterData((prev) => ({
                    ...prev,
                    modelYear: e.target.value,
                  }))
                }
                placeholder="YYYY"
                min="1990"
                max={new Date().getFullYear()}
              />
            </div>
          </div>

          {/* Driver Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Driver Name *
              </label>
              <input
                type="text"
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={transporterData?.driverName || ""}
                onChange={(e) =>
                  setTransporterData((prev) => ({
                    ...prev,
                    driverName: e.target.value,
                  }))
                }
                placeholder="Enter driver name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Driver Contact *
              </label>
              <input
                type="tel"
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={transporterData?.driverContact || ""}
                onChange={(e) =>
                  setTransporterData((prev) => ({
                    ...prev,
                    driverContact: e.target.value,
                  }))
                }
                placeholder="Enter driver contact number"
                pattern="[0-9]{10}"
                title="Please enter a 10-digit contact number"
                required
              />
            </div>
          </div>

          {/* License Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Driver License Number *
              </label>
              <input
                type="text"
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={transporterData?.licenseNumber || ""}
                onChange={(e) =>
                  setTransporterData((prev) => ({
                    ...prev,
                    licenseNumber: e.target.value,
                  }))
                }
                placeholder="Enter license number"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                License Expiry Date *
              </label>
              <input
                type="date"
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={transporterData?.licenseExpiry || ""}
                onChange={(e) =>
                  setTransporterData((prev) => ({
                    ...prev,
                    licenseExpiry: e.target.value,
                  }))
                }
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
          </div>

          {/* Transporter Charges Section */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h4 className="font-medium text-gray-700">Transporter Charges</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Base Charge (INR) *
                </label>
                <input
                  type="number"
                  className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={transporterData?.baseCharge || ""}
                  onChange={(e) =>
                    setTransporterData((prev) => ({
                      ...prev,
                      baseCharge: parseFloat(e.target.value) || 0,
                      totalCharge:
                        (parseFloat(e.target.value) || 0) +
                        (prev?.additionalCharges || 0),
                    }))
                  }
                  placeholder="Enter base charge"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Additional Charges (INR)
                </label>
                <input
                  type="number"
                  className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={transporterData?.additionalCharges || ""}
                  onChange={(e) =>
                    setTransporterData((prev) => ({
                      ...prev,
                      additionalCharges: parseFloat(e.target.value) || 0,
                      totalCharge:
                        (prev?.baseCharge || 0) +
                        (parseFloat(e.target.value) || 0),
                    }))
                  }
                  placeholder="Enter additional charges"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Total Charge (INR)
                </label>
                <input
                  type="number"
                  className="w-full border rounded-md p-2 bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={transporterData?.totalCharge || 0}
                  readOnly
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Container Details Section */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h4 className="font-medium text-gray-700">Container Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Container Number
                </label>
                <input
                  type="text"
                  className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={transporterData?.containerNo || ""}
                  onChange={(e) =>
                    setTransporterData((prev) => ({
                      ...prev,
                      containerNo: e.target.value,
                    }))
                  }
                  placeholder="Enter container number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Number of Containers
                </label>
                <input
                  type="number"
                  className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={transporterData?.numberOfContainers || ""}
                  onChange={(e) =>
                    setTransporterData((prev) => ({
                      ...prev,
                      numberOfContainers: e.target.value,
                    }))
                  }
                  placeholder="Enter number of containers"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Line</label>
                <input
                  type="text"
                  className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={transporterData?.line || ""}
                  onChange={(e) =>
                    setTransporterData((prev) => ({
                      ...prev,
                      line: e.target.value,
                    }))
                  }
                  placeholder="Enter shipping line"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Seal Number
                </label>
                <input
                  type="text"
                  className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={transporterData?.sealNo || ""}
                  onChange={(e) =>
                    setTransporterData((prev) => ({
                      ...prev,
                      sealNo: e.target.value,
                    }))
                  }
                  placeholder="Enter seal number"
                />
              </div>
            </div>
          </div>
          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                px-6 py-2 rounded-md text-white font-medium
                ${
                  isSubmitting
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                }
                transition-colors flex items-center
              `}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  {transporterId ? "Updating..." : "Saving..."}
                </>
              ) : (
                <>
                  {transporterId
                    ? "Update Transporter Details"
                    : "Save Transporter Details"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
