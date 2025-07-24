import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { transporterAPI } from "../utils/Api";
import { useNavigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";

const VinDetailsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [containers, setContainers] = useState([]);
  const [transportRequestId, setTransportRequestId] = useState("");
  const [vehicleDataList, setVehicleDataList] = useState([]);
  const [existingTransporterData, setExistingTransporterData] = useState([]);
  const [groupedContainers, setGroupedContainers] = useState({});
  const [expandedVehicle, setExpandedVehicle] = useState(null);
  const [vehicleType, setVehicleType] = useState("");
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Function to initialize data - called when component mounts
  const initializeData = async () => {
    setIsLoading(true);
    try {
      // Get data from sessionStorage
      const storedRequestId = sessionStorage.getItem("transportRequestId");
      const storedVehicleType = sessionStorage.getItem("vehicleType");
      
      if (!storedRequestId) {
        toast.error("No transport request ID found");
        navigate(-1);
        return;
      }
      
      setTransportRequestId(storedRequestId);
      setVehicleType(storedVehicleType || "");
      
      // Fetch transporter data for this request
      await fetchTransporterData(storedRequestId);
      
      // Determine number of VIN entries based on vehicle type
      let vinCount = 0;
      if (storedVehicleType && storedVehicleType.startsWith("Tr-")) {
        // Extract number from Tr-X format
        const match = storedVehicleType.match(/Tr-(\d+)/);
        if (match && match[1]) {
          vinCount = parseInt(match[1], 10);
        }
      } else if (storedVehicleType === 'Ven') {
        vinCount = 4; // Ven is equivalent to Tr-4
      }
      
      // Initialize containers based on VIN count
      if (vinCount > 0) {
        initializeContainers(vinCount);
      } else {
        // If not a TR type, navigate back
        toast.error("Invalid vehicle type for VIN details");
        navigate(-1);
        return;
      }
      
      // Update grouped containers
      updateGroupedContainers();
      
      setIsDataLoaded(true);
    } catch (error) {
      console.error("Error initializing data:", error);
      toast.error("Failed to initialize data: " + (error.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch transporter data for a request
  const fetchTransporterData = async (requestId) => {
    try {
      const response = await transporterAPI.getTransporterByRequestId(requestId);

      if (response.success) {
        const transporterData = Array.isArray(response.data)
          ? response.data
          : [response.data];
        setExistingTransporterData(transporterData);
        
        // Extract vehicle data for dropdown
        const uniqueVehicles = [];
        const vehicleMap = {};
        
        transporterData.forEach((item) => {
          if (item.vehicle_number && !vehicleMap[item.vehicle_number]) {
            vehicleMap[item.vehicle_number] = true;
            uniqueVehicles.push({
              vehicleNumber: item.vehicle_number,
              transporterName: item.transporter_name || "",
            });
          }
        });
        
        setVehicleDataList(uniqueVehicles);
        return transporterData;
      } else {
        throw new Error(response.message || "Failed to fetch transporter data");
      }
    } catch (error) {
      console.error("Error fetching transporter data:", error);
      throw error;
    }
  };

  // Initialize containers based on count - EXACTLY the number specified by TR type
  const initializeContainers = (count) => {
    // First check if we have existing containers from API
    const existingContainers = [];
    
    // If we don't have existing containers or need more, create new ones
    const newContainers = [];
    for (let i = 0; i < count; i++) {
      if (i < existingContainers.length) {
        newContainers.push(existingContainers[i]);
      } else {
        const newContainer = createEmptyContainer();
        newContainer.vehicleIndex = i + 1;
        
        // Assign vehicle number if available
        if (vehicleDataList.length > 0) {
          newContainer.vehicleNumber = vehicleDataList[0].vehicleNumber;
        }
        
        newContainers.push(newContainer);
      }
    }
    
    // Set containers to exactly the count specified - no more, no less
    setContainers(newContainers);
  };

  // Update grouped containers
  const updateGroupedContainers = () => {
    const grouped = {};
    containers.forEach((container) => {
      const vehicleNumber = container.vehicleNumber || "unassigned";
      if (!grouped[vehicleNumber]) {
        grouped[vehicleNumber] = [];
      }
      grouped[vehicleNumber].push(container);
    });

    setGroupedContainers(grouped);

    if (expandedVehicle === null && Object.keys(grouped).length > 0) {
      setExpandedVehicle(Object.keys(grouped)[0]);
    }
  };

  // Call initializeData when component mounts
  useEffect(() => {
    if (!isDataLoaded) {
      initializeData();
    }
  }, [isDataLoaded]);

  // Create empty container object
  const createEmptyContainer = () => ({
    id: null,
    containerNo: "",
    vehicleNumber: "",
    vehicleIndex: containers.length + 1,
  });

  const onBack = () => {
    navigate(-1);
  };

  // We don't allow adding containers beyond the TR number
  // This function is modified to not allow adding more containers than the TR number
  const addContainer = (vehicleNumber = "") => {
    // Get the TR number from vehicle type
    let maxContainers = 0;
    if (vehicleType && vehicleType.startsWith("Tr-")) {
      const match = vehicleType.match(/Tr-(\d+)/);
      if (match && match[1]) {
        maxContainers = parseInt(match[1], 10);
      }
    } else if (vehicleType === 'Ven') {
      maxContainers = 4;
    }
    
    // Check if we've reached the maximum number of containers
    if (containers.length >= maxContainers) {
      toast.warning(`Cannot add more than ${maxContainers} VIN entries for ${vehicleType}`);
      return;
    }
    
    const newContainer = createEmptyContainer();
    newContainer.vehicleIndex = containers.length + 1;
    newContainer.vehicleNumber = vehicleNumber;
    const updatedContainers = [...containers, newContainer];
    setContainers(updatedContainers);
    updateGroupedContainers();
  };

  // Remove container - modified to not allow fewer than the TR number
  const removeContainer = async (index) => {
    // Get the TR number from vehicle type
    let minContainers = 0;
    if (vehicleType && vehicleType.startsWith("Tr-")) {
      const match = vehicleType.match(/Tr-(\d+)/);
      if (match && match[1]) {
        minContainers = parseInt(match[1], 10);
      }
    } else if (vehicleType === 'Ven') {
      minContainers = 4;
    }
    
    // Check if we've reached the minimum number of containers
    if (containers.length <= minContainers) {
      toast.warning(`Cannot have fewer than ${minContainers} VIN entries for ${vehicleType}`);
      return;
    }
    
    // Rest of the removal logic
    const containerToRemove = containers[index];

    // If the container has an ID, it exists in the database and needs to be deleted
    if (containerToRemove.id) {
      try {
        setIsLoading(true);
        const response = await transporterAPI.deleteContainer(
          containerToRemove.id
        );

        if (response.success) {
          toast.success("Container deleted successfully");
        } else {
          toast.error("Failed to delete container from database");
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error deleting container:", error);
        toast.error(error.message || "Failed to delete container");
        setIsLoading(false);
        return;
      } finally {
        setIsLoading(false);
      }
    }

    // Remove from local state
    const updatedContainers = containers.filter((_, i) => i !== index);
    // Update vehicle indices after removal
    const reindexedContainers = updatedContainers.map((container, i) => ({
      ...container,
      vehicleIndex: i + 1,
    }));
    setContainers(reindexedContainers);
    updateGroupedContainers();

    toast.success("Container deleted successfully");
  };

  // Update container data
  const updateContainerData = (index, field, value) => {
    // For containerNo field, enforce the 4 letters + 7 digits format
    if (field === "containerNo") {
      // Convert to uppercase
      value = value.toUpperCase();

      // If the value is longer than 11 characters, truncate it
      if (value.length > 11) {
        value = value.substring(0, 11);
      }

      // For the first 4 characters, only allow letters
      if (value.length <= 4) {
        value = value.replace(/[^A-Z]/g, "");
      }
      // For characters after position 4, only allow digits
      else {
        const letters = value.substring(0, 4).replace(/[^A-Z]/g, "");
        const digits = value.substring(4).replace(/[^0-9]/g, "");
        value = letters + digits;
      }
    }

    const updatedContainers = containers.map((container, i) =>
      i === index ? { ...container, [field]: value } : container
    );
    setContainers(updatedContainers);
    updateGroupedContainers();
  };

  // Toggle vehicle expansion
  const toggleVehicleExpansion = (vehicleNumber) => {
    setExpandedVehicle(
      expandedVehicle === vehicleNumber ? null : vehicleNumber
    );
  };

  // Validate container data
  const validateContainers = () => {
    const errors = [];
    containers.forEach((container, index) => {
      if (!container.containerNo.trim()) {
        errors.push(`Container ${index + 1}: Container number is required`);
      } else {
        // Check container number format: 4 letters followed by 7 digits
        const containerNoRegex = /^[A-Z]{4}[0-9]{7}$/;
        if (!containerNoRegex.test(container.containerNo)) {
          errors.push(
            `Container ${index + 1}: Container number must be 4 letters followed by 7 digits (e.g., ABCD1234567)`
          );
        }
      }

      if (!container.vehicleNumber) {
        errors.push(`Container ${index + 1}: Vehicle number is required`);
      }
    });
    return errors;
  };

  // Get existing transporter data for a specific container/vehicle
  const getExistingTransporterData = (vehicleNumber) => {
    if (existingTransporterData.length === 0) {
      return null;
    }

    // Find by vehicle number
    let matchingData = existingTransporterData.find(
      (data) => data.vehicle_number === vehicleNumber
    );

    // If not found and we have any transporter data, use the first one as fallback
    if (!matchingData && existingTransporterData.length > 0) {
      matchingData = existingTransporterData[0];
    }

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
      // Group containers by vehicle number for processing
      const containersByVehicle = {};
      containers.forEach((container) => {
        if (!containersByVehicle[container.vehicleNumber]) {
          containersByVehicle[container.vehicleNumber] = [];
        }
        containersByVehicle[container.vehicleNumber].push(container);
      });

      const updatePromises = [];

      // Process each vehicle's containers
      for (const [vehicleNumber, vehicleContainers] of Object.entries(
        containersByVehicle
      )) {
        // Get existing transporter data for this vehicle
        const existingData = getExistingTransporterData(vehicleNumber);

        // If no existing transporter data, show error
        if (!existingData) {
          throw new Error(
            `No transporter data found for vehicle ${vehicleNumber}. Please add transporter details first.`
          );
        }

        // Separate existing containers (with ID) from new ones (without ID)
        const existingContainers = vehicleContainers.filter(
          (container) => container.id
        );
        const newContainers = vehicleContainers.filter(
          (container) => !container.id
        );

        // Format containers for API (only container number and vehicle number)
        const formatContainer = (container) => ({
          container_no: container.containerNo,
          vehicle_number: container.vehicleNumber,
        });

        // Update existing containers individually
        for (const container of existingContainers) {
          updatePromises.push(
            transporterAPI
              .updateContainerDetails(container.id, formatContainer(container))
              .then((response) => ({
                success: response.success,
                message: `Updated container ${container.containerNo}`,
                data: response.data,
              }))
              .catch((error) => {
                console.error("Error updating container:", error);
                return {
                  success: false,
                  message: `Failed to update container ${container.containerNo}: ${error.message || "Unknown error"}`,
                  error,
                };
              })
          );
        }

        // Add new containers using addContainersToVehicle only if there are new containers
        if (newContainers.length > 0) {
          const formattedNewContainers = newContainers.map(formatContainer);
          updatePromises.push(
            transporterAPI
              .addContainersToVehicle(
                transportRequestId,
                vehicleNumber,
                formattedNewContainers
              )
              .then((response) => ({
                success: response.success,
                message: `Added ${formattedNewContainers.length} new containers to vehicle ${vehicleNumber}`,
                data: response.data,
              }))
              .catch((error) => {
                console.error("Error adding containers:", error);
                return {
                  success: false,
                  message: `Failed to add containers to vehicle ${vehicleNumber}: ${error.message || "Unknown error"}`,
                  error,
                };
              })
          );
        }
      }

      const results = await Promise.all(updatePromises);

      // Check results and show appropriate messages
      const successResults = results.filter((r) => r.success);
      const failedResults = results.filter((r) => !r.success);

      if (failedResults.length > 0) {
        // Show errors for failed operations
        failedResults.forEach((result) => {
          toast.error(result.message);
        });
      }

      if (successResults.length > 0) {
        // Show success message
        toast.success(
          `Successfully updated ${successResults.length} container entries`
        );

        // Navigate back to previous page
        setTimeout(() => {
          navigate(-1);
        }, 2000);
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(error.message || "Failed to submit container details");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer position="top-right" autoClose={5000} />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">VIN Details</h1>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
        >
          Back
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Container for all VIN entries */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">VIN Entries for {vehicleType}</h2>
            <p className="text-sm text-gray-600 mb-4">
              Please enter exactly {containers.length} VIN entries for this {vehicleType} request.
            </p>
            
            {/* Display containers grouped by vehicle */}
            {Object.entries(groupedContainers).map(([vehicleNumber, vehicleContainers]) => (
              <div key={vehicleNumber} className="mb-6 border rounded-lg overflow-hidden">
                <div
                  className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer"
                  onClick={() => toggleVehicleExpansion(vehicleNumber)}
                >
                  <h3 className="font-medium">
                    Vehicle: {vehicleNumber || "Unassigned"}
                    <span className="text-sm text-gray-500 ml-2">
                      ({vehicleContainers.length} VINs)
                    </span>
                  </h3>
                </div>

                {expandedVehicle === vehicleNumber && (
                  <div className="p-4">
                    {vehicleContainers.map((container, index) => {
                      const containerIndex = containers.findIndex(
                        (c) => c === container
                      );
                      return (
                        <div
                          key={index}
                          className="flex flex-wrap items-center mb-4 pb-4 border-b last:border-b-0 last:pb-0 last:mb-0"
                        >
                          <div className="w-full md:w-1/12 mb-2 md:mb-0">
                            <span className="font-medium text-gray-700">
                              #{container.vehicleIndex}
                            </span>
                          </div>
                          <div className="w-full md:w-5/12 mb-2 md:mb-0">
                            <input
                              type="text"
                              value={container.containerNo}
                              onChange={(e) =>
                                updateContainerData(
                                  containerIndex,
                                  "containerNo",
                                  e.target.value
                                )
                              }
                              placeholder="VIN (e.g., ABCD1234567)"
                              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Format: 4 letters + 7 digits
                            </p>
                          </div>
                          <div className="w-full md:w-5/12 mb-2 md:mb-0">
                            <select
                              value={container.vehicleNumber}
                              onChange={(e) =>
                                updateContainerData(
                                  containerIndex,
                                  "vehicleNumber",
                                  e.target.value
                                )
                              }
                              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select Vehicle</option>
                              {vehicleDataList.map((vehicle, idx) => (
                                <option
                                  key={idx}
                                  value={vehicle.vehicleNumber}
                                >
                                  {vehicle.vehicleNumber} (
                                  {vehicle.transporterName})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Submit button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : "Save VIN Details"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default VinDetailsPage;