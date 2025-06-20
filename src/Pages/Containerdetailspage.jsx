import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { transporterAPI } from "../utils/Api";
import { useNavigate } from "react-router-dom";

const ContainerDetailsPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [containers, setContainers] = useState([]);
  const [transportRequestId, setTransportRequestId] = useState("");
  const [vehicleDataList, setVehicleDataList] = useState([]);
  const [existingTransporterData, setExistingTransporterData] = useState([]); // Store existing transporter data

  // Initialize with data from sessionStorage
  useEffect(() => {
    const storedContainerData = sessionStorage.getItem("containerData");
    const storedRequestId = sessionStorage.getItem("transportRequestId");
    
    if (storedRequestId) {
      setTransportRequestId(storedRequestId);
    }
    
    if (storedContainerData) {
      try {
        const parsedData = JSON.parse(storedContainerData);
        setVehicleDataList(parsedData);
        
        // Map vehicle data to container format - exactly matching table structure
        const containerData = parsedData.map((vehicle, index) => ({
          id: vehicle.id || null,
          containerNo: vehicle.containerNo || "",
          numberOfContainers: vehicle.numberOfContainers || "",
          containerType: vehicle.containerType || "",
          containerSize: vehicle.containerSize || "",
          line: vehicle.line || "",
          seal1: vehicle.seal1 || "",
          seal2: vehicle.seal2 || "",
          containerTotalWeight: vehicle.containerTotalWeight || "",
          cargoTotalWeight: vehicle.cargoTotalWeight || "",
          remarks: vehicle.remarks || "",
          vehicleNumber: vehicle.vehicleNumber || "",
          vehicleIndex: vehicle.vehicleIndex || (index + 1),
        }));
        setContainers(containerData.length > 0 ? containerData : [createEmptyContainer()]);
      } catch (error) {
        console.error("Error parsing container data:", error);
        setContainers([createEmptyContainer()]);
      }
    } else {
      setContainers([createEmptyContainer()]);
    }
  }, []);

  // Fetch existing transporter data
  const fetchExistingTransporterData = async () => {
    if (!transportRequestId) return;
    
    try {
      const response = await transporterAPI.getTransporterByRequestId(transportRequestId);
      
      if (response.success) {
        const transporterData = Array.isArray(response.data) ? response.data : [response.data];
        setExistingTransporterData(transporterData);
        console.log("Existing transporter data loaded:", transporterData);
      }
    } catch (error) {
      console.error("Error fetching existing transporter data:", error);
      // If no transporter data exists yet, that's okay - we'll handle it in the update
    }
  };

  // Load existing transporter data when transportRequestId is available
  useEffect(() => {
    if (transportRequestId) {
      fetchExistingTransporterData();
    }
  }, [transportRequestId]);

  const onBack = () => {
    // Update sessionStorage with current container data before going back
    const updatedVehicleData = containers.map(container => ({
      id: container.id,
      containerNo: container.containerNo,
      numberOfContainers: container.numberOfContainers,
      containerType: container.containerType,
      containerSize: container.containerSize,
      line: container.line,
      seal1: container.seal1,
      seal2: container.seal2,
      containerTotalWeight: container.containerTotalWeight,
      cargoTotalWeight: container.cargoTotalWeight,
      remarks: container.remarks,
      vehicleNumber: container.vehicleNumber,
      vehicleIndex: container.vehicleIndex,
    }));
    
    sessionStorage.setItem("containerData", JSON.stringify(updatedVehicleData));
    navigate(-1); // Go back to previous page
  };

  // Create empty container object
  const createEmptyContainer = () => ({
    id: null,
    containerNo: "",
    numberOfContainers: "",
    containerType: "",
    containerSize: "",
    line: "",
    seal1: "",
    seal2: "",
    containerTotalWeight: "",
    cargoTotalWeight: "",
    remarks: "",
    vehicleNumber: "",
    vehicleIndex: containers.length + 1,
  });

  // Add new container
  const addContainer = () => {
    const newContainer = createEmptyContainer();
    newContainer.vehicleIndex = containers.length + 1;
    setContainers([...containers, newContainer]);
  };

  // Remove container
  const removeContainer = (index) => {
    if (containers.length > 1) {
      const updatedContainers = containers.filter((_, i) => i !== index);
      // Update vehicle indices after removal
      const reindexedContainers = updatedContainers.map((container, i) => ({
        ...container,
        vehicleIndex: i + 1
      }));
      setContainers(reindexedContainers);
    } else {
      toast.warning("At least one container entry is required");
    }
  };

  // Update container data - This function works with the table
  const updateVehicleData = (index, field, value) => {
    const updatedContainers = containers.map((container, i) =>
      i === index ? { ...container, [field]: value } : container
    );
    setContainers(updatedContainers);
  };

  // Validate container data
  const validateContainers = () => {
    const errors = [];
    containers.forEach((container, index) => {
      if (!container.containerNo.trim()) {
        errors.push(`Container ${index + 1}: Container number is required`);
      }
      if (
        !container.numberOfContainers ||
        parseInt(container.numberOfContainers) <= 0
      ) {
        errors.push(
          `Container ${index + 1}: Number of containers must be greater than 0`
        );
      }
    });
    return errors;
  };

  // Get existing transporter data for a specific container/vehicle
  const getExistingTransporterData = (containerIndex) => {
    if (existingTransporterData.length === 0) {
      return null;
    }
    
    // Try to find matching transporter data by vehicle sequence or use first one
    const matchingData = existingTransporterData.find(
      (data) => data.vehicle_sequence === containerIndex + 1
    ) || existingTransporterData[Math.min(containerIndex, existingTransporterData.length - 1)];
    
    return matchingData;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateContainers();
    if (errors.length > 0) {
      toast.error(`Please fix the following errors:\n${errors.join("\n")}`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Map each container to match the backend's expected format
      const updatePromises = containers.map((container, index) => {
        // Get existing transporter data for this container
        const existingData = getExistingTransporterData(index);
        
        // If no existing transporter data, show error
        if (!existingData) {
          throw new Error(`No transporter data found for container ${index + 1}. Please add transporter details first.`);
        }

        // Parse existing service charges
        let serviceCharges = "{}";
        if (existingData.service_charges) {
          try {
            serviceCharges = typeof existingData.service_charges === 'string' 
              ? existingData.service_charges 
              : JSON.stringify(existingData.service_charges);
          } catch (e) {
            console.error("Error parsing service charges:", e);
            serviceCharges = "{}";
          }
        }

        return transporterAPI.updateTransporter(container.id || existingData.id, {
          transport_request_id: transportRequestId,
          
          // Container-specific data (what we're updating)
          container_no: container.containerNo,
          line: container.line,
          seal_no: container.seal1, // Using seal1 as primary seal
          number_of_containers: parseInt(container.numberOfContainers) || 0,
          seal1: container.seal1,
          seal2: container.seal2,
          container_total_weight: parseFloat(container.containerTotalWeight) || 0,
          cargo_total_weight: parseFloat(container.cargoTotalWeight) || 0,
          container_type: container.containerType,
          container_size: container.containerSize,
          vehicle_number: container.vehicleNumber,
          
          // Preserve existing transporter data (don't send dummy data)
          transporter_name: existingData.transporter_name,
          driver_name: existingData.driver_name,
          driver_contact: existingData.driver_contact,
          license_number: existingData.license_number,
          license_expiry: existingData.license_expiry,
          base_charge: existingData.base_charge || 0,
          additional_charges: existingData.additional_charges || 0,
          service_charges: serviceCharges,
          total_charge: existingData.total_charge || 0
        });
      });

      const results = await Promise.all(updatePromises);
      
      // Check if all updates were successful
      const allSuccessful = results.every(response => response.success);

      if (allSuccessful) {
        toast.success(`Successfully updated ${containers.length} container(s)`);
        
        // Update sessionStorage with the updated data
        const updatedVehicleData = containers.map(container => ({
          id: container.id,
          containerNo: container.containerNo,
          numberOfContainers: container.numberOfContainers,
          containerType: container.containerType,
          containerSize: container.containerSize,
          line: container.line,
          seal1: container.seal1,
          seal2: container.seal2,
          containerTotalWeight: container.containerTotalWeight,
          cargoTotalWeight: container.cargoTotalWeight,
          remarks: container.remarks,
          vehicleNumber: container.vehicleNumber,
          vehicleIndex: container.vehicleIndex,
        }));
        
        sessionStorage.setItem("containerData", JSON.stringify(updatedVehicleData));
        navigate(-1);
      } else {
        throw new Error('Some container updates failed');
      }
    } catch (error) {
      console.error("Error updating container details:", error);
      toast.error(
        error.response?.data?.message || 
        error.message || 
        "Failed to update container details"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load existing container data
  const loadContainerData = async () => {
    if (!transportRequestId) return;
    
    setIsLoading(true);
    try {
      const response = await transporterAPI.get(
        `/transport-requests/${transportRequestId}/containers`
      );
      
      if (response.data.success && response.data.containers) {
        const loadedContainers = response.data.containers.map((container, index) => ({
          id: container.id,
          containerNo: container.containerNo || "",
          numberOfContainers: container.numberOfContainers?.toString() || "",
          containerType: container.containerType || "",
          containerSize: container.containerSize || "",
          line: container.line || "",
          seal1: container.seal1 || "",
          seal2: container.seal2 || "",
          containerTotalWeight: container.containerTotalWeight?.toString() || "",
          cargoTotalWeight: container.cargoTotalWeight?.toString() || "",
          remarks: container.remarks || "",
          vehicleNumber: container.vehicleNumber || "",
          vehicleIndex: container.vehicleIndex || (index + 1),
        }));
        
        setContainers(loadedContainers.length > 0 ? loadedContainers : [createEmptyContainer()]);
        
        // Update sessionStorage with loaded data
        sessionStorage.setItem("containerData", JSON.stringify(loadedContainers));
        toast.success("Container data loaded successfully");
      }
    } catch (error) {
      console.error("Error loading container data:", error);
      toast.error("Failed to load existing container data");
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount if transportRequestId exists
  useEffect(() => {
    if (transportRequestId && containers.length === 1 && !containers[0].containerNo) {
      loadContainerData();
    }
  }, [transportRequestId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading container details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Container Details Management
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Request ID:{" "}
                  <span className="font-medium">{transportRequestId}</span>
                </p>
                {existingTransporterData.length > 0 && (
                  <p className="text-sm text-green-600 mt-1">
                    ✓ {existingTransporterData.length} transporter record(s) found
                  </p>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={loadContainerData}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh Data
                </button>
                <button
                  onClick={onBack}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Warning if no transporter data */}
        {existingTransporterData.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  No transporter data found
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Please add transporter details first before updating container information.
                    The container update requires existing transporter data to preserve vehicle and driver information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content - Table Format */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Container Information ({containers.length} Container
                {containers.length > 1 ? "s" : ""})
              </h2>
              <button
                onClick={addContainer}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Container
              </button>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Table Structure */}
              <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
  <thead className="bg-gray-50">
    <tr>
      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Vehicle #</th>
      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Container Number *</th>
      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number of Containers *</th>
      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Container Type</th>
      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Container Size</th>
      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipping Line</th>
      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seal 1</th>
      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seal 2</th>
      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trailer Weight (kg)</th>
      <th className="px-3 pr-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo Weight (kg)</th>
         </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {containers.map((container, index) => (
      <tr key={`container-${index}`} className="hover:bg-gray-50">
        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
            {container.vehicleIndex}
          </span>
        </td>
        {["containerNo", "numberOfContainers", "containerType", "containerSize", "line", "seal1", "seal2", "containerTotalWeight", "cargoTotalWeight"].map((fieldKey) => (
          <td key={fieldKey} className="px-3 py-2 whitespace-nowrap">
            <input
              type={fieldKey.includes("Weight") || fieldKey === "numberOfContainers" ? "number" : "text"}
              required={fieldKey === "containerNo" || fieldKey === "numberOfContainers"}
              min={fieldKey === "numberOfContainers" || fieldKey.includes("Weight") ? "0" : undefined}
              step={fieldKey.includes("Weight") ? "0.01" : undefined}
              className="w-full h-12 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={container[fieldKey]}
              onChange={(e) =>
                updateVehicleData(
                  index,
                  fieldKey,
                  fieldKey === "containerNo" || fieldKey.startsWith("seal")
                    ? e.target.value.toUpperCase()
                    : e.target.value
                )
              }
              placeholder={fieldKey.replace(/([A-Z])/g, " $1").trim()}
            />
          </td>
        ))}
        <td className="px-3 py-2 whitespace-nowrap text-center">
          {containers.length > 1 && (
            <button
              type="button"
              onClick={() => removeContainer(index)}
              className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
              title="Remove Container"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </td>
      </tr>
    ))}
  </tbody>
</table>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || existingTransporterData.length === 0}
                  className={`
                    px-8 py-3 rounded-md text-white font-medium transition-all duration-200
                    ${
                      isSubmitting || existingTransporterData.length === 0
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    }
                    flex items-center
                  `}
                  title={existingTransporterData.length === 0 ? "Add transporter details first" : "Update container details"}
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Updating Containers...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Update Container Details
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContainerDetailsPage;