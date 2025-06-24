import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { transporterAPI } from "../utils/Api";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";

const ContainerDetailsPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [containers, setContainers] = useState([]);
  const [transportRequestId, setTransportRequestId] = useState("");
  const [vehicleDataList, setVehicleDataList] = useState([]);
  const [existingTransporterData, setExistingTransporterData] = useState([]); // Store existing transporter data
  const [groupedContainers, setGroupedContainers] = useState({});
  const [expandedVehicle, setExpandedVehicle] = useState(null);
  

  
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
        
        // Map vehicle data to container format
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

  // Group containers by vehicle number whenever containers change
  useEffect(() => {
    console.log("Containers before grouping (count):", containers.length);
    console.log("Containers before grouping (details):", containers);
    
    const grouped = {};
    containers.forEach(container => {
      const vehicleNumber = container.vehicleNumber || "unassigned";
      if (!grouped[vehicleNumber]) {
        grouped[vehicleNumber] = [];
      }
      grouped[vehicleNumber].push(container);
    });
    
    console.log("Grouped containers (vehicle count):", Object.keys(grouped).length);
    Object.entries(grouped).forEach(([vehicleNumber, vehicleContainers]) => {
      console.log(`Vehicle ${vehicleNumber} has ${vehicleContainers.length} containers`);
    });
    
    // Log the grouped containers to verify all containers are included
    console.log("Grouped containers:", grouped);
    setGroupedContainers(grouped);
    
    // Set the first vehicle as expanded by default if none is selected
    if (expandedVehicle === null && Object.keys(grouped).length > 0) {
      setExpandedVehicle(Object.keys(grouped)[0]);
    }
  }, [containers, expandedVehicle]);

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
  const addContainer = (vehicleNumber = "") => {
    const newContainer = createEmptyContainer();
    newContainer.vehicleIndex = containers.length + 1;
    newContainer.vehicleNumber = vehicleNumber;
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

  // Update container data
  const updateContainerData = (index, field, value) => {
    const updatedContainers = containers.map((container, i) =>
      i === index ? { ...container, [field]: value } : container
    );
    setContainers(updatedContainers);
  };

  // Toggle vehicle expansion
  const toggleVehicleExpansion = (vehicleNumber) => {
    setExpandedVehicle(expandedVehicle === vehicleNumber ? null : vehicleNumber);
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
      containers.forEach(container => {
        if (!containersByVehicle[container.vehicleNumber]) {
          containersByVehicle[container.vehicleNumber] = [];
        }
        containersByVehicle[container.vehicleNumber].push(container);
      });

      const updatePromises = [];
      
      // Process each vehicle's containers
      for (const [vehicleNumber, vehicleContainers] of Object.entries(containersByVehicle)) {
        // Get existing transporter data for this vehicle
        const existingData = getExistingTransporterData(vehicleNumber);
        
        // If no existing transporter data, show error
        if (!existingData) {
          throw new Error(`No transporter data found for vehicle ${vehicleNumber}. Please add transporter details first.`);
        }

        // Separate existing containers (with ID) from new ones (without ID)
        const existingContainers = vehicleContainers.filter(container => container.id);
        const newContainers = vehicleContainers.filter(container => !container.id);

        // Format containers for API
        const formatContainer = (container) => ({
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
          vehicle_number: container.vehicleNumber
        });

        // Update existing containers individually
        for (const container of existingContainers) {
          updatePromises.push(
            transporterAPI.updateContainerDetails(container.id, formatContainer(container))
          );
        }

        // Add new containers using addMultipleContainers only if there are new containers
        if (newContainers.length > 0) {
          const formattedNewContainers = newContainers.map(formatContainer);
          updatePromises.push(
            transporterAPI.addMultipleContainers(existingData.id, formattedNewContainers)
          );
        }
      }

      const results = await Promise.all(updatePromises);
      
      // Check if all updates were successful
      const allSuccessful = results.every(response => response.success);

      if (allSuccessful) {
        // Show success toast notification
        toast.success("Container details updated successfully");
        
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
        
        // Refresh data instead of navigating away
        await fetchExistingTransporterData();
        await loadContainerData();
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
      const response = await transporterAPI.getContainersByRequestId(transportRequestId);
      
      if (response.success && response.containers && response.containers.length > 0) {
        // Log the response to verify all containers are returned from API
        console.log("Container data from API:", response.containers);
        
        const loadedContainers = response.containers.map((container, index) => ({
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
          vehicleIndex: index + 1, // Ensure unique index
        }));
        
        // Log the processed containers
        console.log("Processed containers:", loadedContainers);
        
        setContainers(loadedContainers);
        
        // Also update vehicleDataList to include all unique vehicles
        const uniqueVehicles = [];
        const vehicleMap = {};
        
        loadedContainers.forEach(container => {
          if (container.vehicleNumber && !vehicleMap[container.vehicleNumber]) {
            vehicleMap[container.vehicleNumber] = true;
            uniqueVehicles.push({
              vehicleNumber: container.vehicleNumber,
              transporterName: "" // You might want to fetch this from transporter data if needed
            });
          }
        });
        
        setVehicleDataList(prevList => {
          // Merge with existing list, avoiding duplicates
          const existingVehicleMap = {};
          prevList.forEach(v => { existingVehicleMap[v.vehicleNumber] = true; });
          
          const newVehicles = uniqueVehicles.filter(v => !existingVehicleMap[v.vehicleNumber]);
          return [...prevList, ...newVehicles];
        });
        
        // Update sessionStorage with loaded data
        sessionStorage.setItem("containerData", JSON.stringify(loadedContainers));
        toast.success("Container data loaded successfully");
      } else {
        // If no containers found, show a message but don't reset the containers array
        toast.info("No container data found for this request");
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
    if (transportRequestId) {
      fetchExistingTransporterData();
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
        <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
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

        {/* Main Content - Card-based UI */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Container Information ({containers.length} Container
                {containers.length > 1 ? "s" : ""})
              </h2>
              <button
                onClick={() => addContainer()}
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
              {/* Vehicle Groups */}
              <div className="space-y-6">
                {Object.entries(groupedContainers).map(([vehicleNumber, vehicleContainers]) => (
                  <div key={vehicleNumber} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Vehicle Header */}
                    <div 
                      className={`px-4 py-3 flex justify-between items-center cursor-pointer ${expandedVehicle === vehicleNumber ? 'bg-blue-50' : 'bg-gray-50'}`}
                      onClick={() => toggleVehicleExpansion(vehicleNumber)}
                    >
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">
                          {vehicleNumber === "unassigned" ? "Unassigned Containers" : `Vehicle: ${vehicleNumber}`}
                        </span>
                        <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                          {vehicleContainers.length} container{vehicleContainers.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addContainer(vehicleNumber);
                          }}
                          className="mr-2 inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          title="Add container to this vehicle"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                        <svg 
                          className={`h-5 w-5 text-gray-500 transform transition-transform ${expandedVehicle === vehicleNumber ? 'rotate-180' : ''}`} 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Container Cards */}
                 {expandedVehicle === vehicleNumber && (
  <div className="p-4 bg-white">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {vehicleContainers.map((container, containerIndex) => {
        // Use a stable key based on container.vehicleIndex or a unique id
        // Avoid using findIndex with object equality
        const key = container.id || `container-${container.vehicleIndex}-${vehicleNumber}-${containerIndex}`;
        
        return (
          <div key={key} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-medium text-gray-900">
                Container #{containerIndex + 1}
              </h3>
              {containers.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeContainer(containers.findIndex(c => c.vehicleIndex === container.vehicleIndex))}
                  className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  title="Remove Container"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vehicle Number */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number *</label>
                <select
                  className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={container.vehicleNumber}
                  onChange={(e) => updateContainerData(containers.findIndex(c => c.vehicleIndex === container.vehicleIndex), "vehicleNumber", e.target.value)}
                  required
                >
                  <option value="">Select Vehicle</option>
                  {vehicleDataList.map((vehicle) => (
                    <option key={vehicle.vehicleNumber} value={vehicle.vehicleNumber}>
                      {vehicle.vehicleNumber} - {vehicle.transporterName}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Container Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Container Number *</label>
                <input
                  type="text"
                  required
                  className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={container.containerNo}
                  onChange={(e) => updateContainerData(containers.findIndex(c => c.vehicleIndex === container.vehicleIndex), "containerNo", e.target.value.toUpperCase())}
                  placeholder="Container Number"
                />
              </div>
              
              {/* Number of Containers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Containers *</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={container.numberOfContainers}
                  onChange={(e) => updateContainerData(containers.findIndex(c => c.vehicleIndex === container.vehicleIndex), "numberOfContainers", e.target.value)}
                  placeholder="Number of Containers"
                />
              </div>
              
              {/* Container Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Container Type</label>
                <input
                  type="text"
                  className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={container.containerType}
                  onChange={(e) => updateContainerData(containers.findIndex(c => c.vehicleIndex === container.vehicleIndex), "containerType", e.target.value)}
                  placeholder="Container Type"
                />
              </div>
              
              {/* Container Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Container Size</label>
                <input
                  type="text"
                  className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={container.containerSize}
                  onChange={(e) => updateContainerData(containers.findIndex(c => c.vehicleIndex === container.vehicleIndex), "containerSize", e.target.value)}
                  placeholder="Container Size"
                />
              </div>
              
              {/* Shipping Line */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Line</label>
                <input
                  type="text"
                  className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={container.line}
                  onChange={(e) => updateContainerData(containers.findIndex(c => c.vehicleIndex === container.vehicleIndex), "line", e.target.value)}
                  placeholder="Shipping Line"
                />
              </div>
              
              {/* Seal 1 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seal 1</label>
                <input
                  type="text"
                  className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={container.seal1}
                  onChange={(e) => updateContainerData(containers.findIndex(c => c.vehicleIndex === container.vehicleIndex), "seal1", e.target.value.toUpperCase())}
                  placeholder="Seal 1"
                />
              </div>
              
              {/* Seal 2 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seal 2</label>
                <input
                  type="text"
                  className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={container.seal2}
                  onChange={(e) => updateContainerData(containers.findIndex(c => c.vehicleIndex === container.vehicleIndex), "seal2", e.target.value.toUpperCase())}
                  placeholder="Seal 2"
                />
              </div>
              
              {/* Container Weight */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Container Weight (kg)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={container.containerTotalWeight}
                  onChange={(e) => updateContainerData(containers.findIndex(c => c.vehicleIndex === container.vehicleIndex), "containerTotalWeight", e.target.value)}
                  placeholder="Container Weight"
                />
              </div>
              
              {/* Cargo Weight */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo Weight (kg)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={container.cargoTotalWeight}
                  onChange={(e) => updateContainerData(containers.findIndex(c => c.vehicleIndex === container.vehicleIndex), "cargoTotalWeight", e.target.value)}
                  placeholder="Cargo Weight"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}
                  </div>
                ))}
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


