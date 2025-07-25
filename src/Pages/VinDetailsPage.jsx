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

  // Helper function to get VIN count from vehicle type
  const getVinCountFromVehicleType = (vType) => {
    if (!vType) return 0;
    
    if (vType.startsWith("Tr-")) {
      const match = vType.match(/Tr-(\d+)/);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
    } else if (vType === 'Ven') {
      return 4;
    }
    return 0;
  };

  // Create empty container object
  const createEmptyContainer = (index, vehicleNumber = "") => ({
    id: null,
    containerNo: "",
    vehicleNumber: vehicleNumber,
    vehicleIndex: index,
  });

  // Update grouped containers
  const updateGroupedContainers = (containerList = containers) => {
    const grouped = {};
    containerList.forEach((container) => {
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

  // Function to initialize containers with empty values
  const initializeContainers = (count, vehicles = []) => {
    const newContainers = [];
    const defaultVehicleNumber = vehicles.length > 0 ? vehicles[0].vehicleNumber : "";
    
    for (let i = 0; i < count; i++) {
      const newContainer = createEmptyContainer(i + 1, defaultVehicleNumber);
      newContainers.push(newContainer);
    }
    
    console.log("Initializing containers:", newContainers);
    setContainers(newContainers);
    updateGroupedContainers(newContainers);
  };

  // Function to fetch transporter data
  const fetchTransporterData = async (requestId) => {
    try {
      const response = await transporterAPI.getTransporterByRequestId(requestId);
      if (response.success && response.data) {
        setExistingTransporterData(response.data);
        
        // Extract vehicle numbers for dropdown
     // Return vehicles for use in other functions
      }
      return [];
    } catch (error) {
      console.error("Error fetching transporter data:", error);
      toast.error("Failed to load transporter data");
      return [];
    }
  };

  // Function to load container data from API
  const loadContainerData = async (requestId, vType, vehicles = []) => {
    if (!requestId) {
      toast.error("Transport request ID is missing");
      return;
    }

    const vinCount = getVinCountFromVehicleType(vType);
    console.log("VIN Count calculated:", vinCount, "for vehicle type:", vType);
    
    if (vinCount === 0) {
      console.log("No VIN count available, skipping container initialization");
      return;
    }

    if (vehicles.length === 0) {
      console.log("No vehicles available, initializing empty containers");
      initializeContainers(vinCount, vehicles);
      return;
    }
  
    try {
      // Since containers are organized by vehicle, fetch containers for each vehicle
      const allLoadedContainers = [];
      
      for (const vehicle of vehicles) {
        try {
          console.log(`Fetching containers for vehicle: ${vehicle.vehicleNumber}`);
          const vehicleContainersResponse = await transporterAPI.getContainersByVehicleNumber(
            requestId, 
            vehicle.vehicleNumber
          );
          
          console.log(`API Response for vehicle ${vehicle.vehicleNumber}:`, vehicleContainersResponse);
          
          if (
            vehicleContainersResponse.success &&
            vehicleContainersResponse.data &&
            Array.isArray(vehicleContainersResponse.data) &&
            vehicleContainersResponse.data.length > 0
          ) {
            // Map the API response to our container format
            const vehicleContainers = vehicleContainersResponse.data.map(
              (container, index) => ({
                id: container.id || container.container_id,
                containerNo: container.container_no || container.containerNo || "",
                vehicleNumber: vehicle.vehicleNumber, // Ensure vehicle number is set
                vehicleIndex: allLoadedContainers.length + index + 1,
              })
            );
            
            allLoadedContainers.push(...vehicleContainers);
            console.log(`Loaded  containers for vehicle ${vehicle.vehicleNumber}`);
          } else {
            console.log(`No containers found for vehicle ${vehicle.vehicleNumber}`);
          }
        } catch (vehicleError) {
          console.error(`Error fetching containers for vehicle ${vehicle.vehicleNumber}:`, vehicleError);
          // Continue with other vehicles even if one fails
        }
      }

      console.log("All loaded containers:", allLoadedContainers);

      // Ensure we have exactly the right number of containers
      const finalContainers = [...allLoadedContainers];
      
      // If we have fewer containers than needed, add empty ones
      const defaultVehicleNumber = vehicles.length > 0 ? vehicles[0].vehicleNumber : "";
      while (finalContainers.length < vinCount) {
        const newContainer = createEmptyContainer(
          finalContainers.length + 1, 
          defaultVehicleNumber
        );
        finalContainers.push(newContainer);
      }
      
      // If we have more containers than needed, trim the array
      if (finalContainers.length > vinCount) {
        finalContainers.splice(vinCount);
      }
      
      // Update vehicle indices to be sequential
      finalContainers.forEach((container, index) => {
        container.vehicleIndex = index + 1;
      });
      
      console.log("Final containers after processing:", finalContainers);
      setContainers(finalContainers);
      updateGroupedContainers(finalContainers);
      
      if (allLoadedContainers.length > 0) {
        toast.success(`Loaded ${allLoadedContainers.length} existing containers`);
        console.log("Container data loaded and state updated successfully");
      } else {
        toast.info("No existing VIN entries found. Created new entries.");
        console.log("No existing containers found, initialized empty containers");
      }
      
    } catch (error) {
      console.error("Error loading container data:", error);
      console.error("Error details:", error.response || error.message);
      toast.error("Failed to load existing container data");
      
      // Fall back to initializing empty containers
      console.log("Falling back to empty container initialization");
      initializeContainers(vinCount, vehicles);
    }
  };

  // Function to initialize data - called when component mounts
  const initializeData = async () => {
    setIsLoading(true);
    try {
      // Get data from sessionStorage
      const storedRequestId = sessionStorage.getItem("transportRequestId");
      const storedVehicleType = sessionStorage.getItem("vehicleType");
      
      console.log("Stored data:", { storedRequestId, storedVehicleType });
      
      if (!storedRequestId) {
        toast.error("No transport request ID found");
        navigate(-1);
        return;
      }
      
      setTransportRequestId(storedRequestId);
      setVehicleType(storedVehicleType || "");
      
      // Fetch transporter data first and wait for it to complete
      const vehicles = await fetchTransporterData(storedRequestId);
      
      // Then load container data with the vehicle type and vehicles
      await loadContainerData(storedRequestId, storedVehicleType, vehicles);
      
      setIsDataLoaded(true);
    } catch (error) {
      console.error("Error initializing data:", error);
      toast.error("Failed to initialize data");
      setIsDataLoaded(true); // Set to true even on error to prevent infinite loops
    } finally {
      setIsLoading(false);
    } 
  };

  // Call initializeData when component mounts
  useEffect(() => {
    if (!isDataLoaded) {
      initializeData();
    }
  }, [isDataLoaded]);

  // Debug effect to log state changes
  useEffect(() => {
    console.log("Containers state updated:", containers);
  }, [containers]);

  useEffect(() => {
    console.log("Vehicle type updated:", vehicleType);
  }, [vehicleType]);

  const onBack = () => {
    navigate(-1);
  };

  // Add a manual refresh function for debugging
  const handleRefresh = async () => {
    console.log("Manual refresh triggered");
    setIsLoading(true);
    try {
      const vehicles = await fetchTransporterData(transportRequestId);
      await loadContainerData(transportRequestId, vehicleType, vehicles);
      toast.success("Data refreshed successfully");
    } catch (error) {
      console.error("Error during manual refresh:", error);
      toast.error("Failed to refresh data");
    } finally {
      setIsLoading(false);
    }
  };
  
  // We don't allow adding containers beyond the TR number
  const addContainer = (vehicleNumber = "") => {
    const maxContainers = getVinCountFromVehicleType(vehicleType);
    
    // Check if we've reached the maximum number of containers
    if (containers.length >= maxContainers) {
      toast.warning(`Cannot add more than ${maxContainers} VIN entries for ${vehicleType}`);
      return;
    }
    
    const newContainer = createEmptyContainer(containers.length + 1, vehicleNumber);
    const updatedContainers = [...containers, newContainer];
    setContainers(updatedContainers);
    updateGroupedContainers(updatedContainers);
  };
  
  // Remove container - modified to not allow fewer than the TR number
  const removeContainer = async (index) => {
    const minContainers = getVinCountFromVehicleType(vehicleType);
    
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
    updateGroupedContainers(reindexedContainers);
  
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
    updateGroupedContainers(updatedContainers);
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
          // Add these fields to match the expected format
          seal_no: "",
          seal1: "",
          seal2: "",
          container_total_weight: 0,
          cargo_total_weight: 0,
          container_type: "",
          container_size: "",
          remarks: ""
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

        // Refresh data after successful save
        console.log("Refreshing data after successful save...");
        try {
          const vehicles = await fetchTransporterData(transportRequestId);
          await loadContainerData(transportRequestId, vehicleType, vehicles);
          console.log("Data refreshed successfully");
        } catch (refreshError) {
          console.error("Error refreshing data:", refreshError);
          toast.warning("Data saved but failed to refresh. Please reload the page.");
        }

        // Navigate back to previous page after a delay
        setTimeout(() => {
          navigate(-1);
        }, 3000); // Increased delay to 3 seconds to allow data refresh
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
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Back
          </button>
        </div>
      </div>
  
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Debug info - remove in production */}
     

          {/* Container for all VIN entries */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">VIN Entries for {vehicleType}</h2>
            <p className="text-sm text-gray-600 mb-4">
              Please enter exactly {getVinCountFromVehicleType(vehicleType)} VIN entries for this {vehicleType} request.
            </p>
            
            {containers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No VIN entries available. Please check if vehicle type is properly set.</p>
              </div>
            ) : (
              /* Display containers grouped by vehicle */
              Object.entries(groupedContainers).map(([vehicleNumber, vehicleContainers]) => (
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
                       
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
  
          {/* Submit button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || containers.length === 0}
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