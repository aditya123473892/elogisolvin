import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { transporterAPI } from "../utils/Api";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import ResponseModal from "../Components/Responsemodal";

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
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);

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

        // First set the vehicle list for dropdown options
        const uniqueVehicles = [];
        const vehicleMap = {};

        parsedData.forEach((item) => {
          if (item.vehicleNumber && !vehicleMap[item.vehicleNumber]) {
            vehicleMap[item.vehicleNumber] = true;
            uniqueVehicles.push({
              vehicleNumber: item.vehicleNumber,
              transporterName: item.transporterName || "",
            });
          }
        });
        setVehicleDataList(uniqueVehicles);

        // Then map to container format
        const containerData = parsedData.map((vehicle, index) => ({
          id: vehicle.id || null,
          containerNo: vehicle.containerNo || "",
          numberOfContainers: vehicle.numberOfContainers?.toString() || "",
          containerType: vehicle.containerType || "",
          containerSize: vehicle.containerSize || "",
          line: vehicle.line || "",
          seal1: vehicle.seal1 || "",
          seal2: vehicle.seal2 || "",
          containerTotalWeight: vehicle.containerTotalWeight?.toString() || "",
          cargoTotalWeight: vehicle.cargoTotalWeight?.toString() || "",
          remarks: vehicle.remarks || "",
          vehicleNumber: vehicle.vehicleNumber || "",
          vehicleIndex: vehicle.vehicleIndex || index + 1,
        }));

        setContainers(
          containerData.length > 0 ? containerData : [createEmptyContainer()]
        );
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
    containers.forEach((container) => {
      const vehicleNumber = container.vehicleNumber || "unassigned";
      if (!grouped[vehicleNumber]) {
        grouped[vehicleNumber] = [];
      }
      grouped[vehicleNumber].push(container);
    });

    console.log(
      "Grouped containers (vehicle count):",
      Object.keys(grouped).length
    );
    Object.entries(grouped).forEach(([vehicleNumber, vehicleContainers]) => {
      console.log(
        `Vehicle ${vehicleNumber} has ${vehicleContainers.length} containers`
      );
    });

    console.log("Grouped containers:", grouped);
    setGroupedContainers(grouped);

    if (expandedVehicle === null && Object.keys(grouped).length > 0) {
      setExpandedVehicle(Object.keys(grouped)[0]);
    }
  }, [containers]);
  // Fetch existing transporter data
  const fetchExistingTransporterData = async () => {
    if (!transportRequestId) return;

    try {
      const response = await transporterAPI.getTransporterByRequestId(
        transportRequestId
      );

      if (response.success) {
        const transporterData = Array.isArray(response.data)
          ? response.data
          : [response.data];
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

  // New useEffect to automatically load containers for each vehicle when vehicleDataList changes
  useEffect(() => {
    const loadAllVehicleContainers = async () => {
      if (!transportRequestId || vehicleDataList.length === 0) return;

      setIsLoading(true);
      try {
        // Create an array of promises for loading containers for each vehicle
        const loadPromises = vehicleDataList.map((vehicle) =>
          loadVehicleContainers(vehicle.vehicleNumber)
        );

        // Wait for all promises to resolve
        await Promise.all(loadPromises);

        toast.success("All vehicle containers loaded successfully");
      } catch (error) {
        console.error("Error loading vehicle containers:", error);
        toast.error("Failed to load some vehicle containers");
      } finally {
        setIsLoading(false);
      }
    };

    loadAllVehicleContainers();
  }, [vehicleDataList, transportRequestId]);

  const onBack = () => {
    // Update sessionStorage with current container data before going back
    const updatedVehicleData = containers.map((container) => ({
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
  const removeContainer = async (index) => {
    if (containers.length <= 1) {
      toast.warning("At least one container entry is required");
      return;
    }

    const containerToRemove = containers[index];
    if (containerToRemove.id) {
      try {
        setIsLoading(true);
        const response = await transporterAPI.deleteContainer(
          containerToRemove.id
        );
        if (!response.success) {
          throw new Error(response.message || "Failed to delete container");
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

    const updatedContainers = containers.filter((_, i) => i !== index);
    const reindexedContainers = updatedContainers.map((container, i) => ({
      ...container,
      vehicleIndex: i + 1,
    }));
    setContainers(reindexedContainers);
    sessionStorage.setItem(
      "containerData",
      JSON.stringify(reindexedContainers)
    );
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

    // Update sessionStorage with the latest data
    sessionStorage.setItem("containerData", JSON.stringify(updatedContainers));
  };

  // Toggle vehicle expansion
  const toggleVehicleExpansion = (vehicleNumber) => {
    setExpandedVehicle(
      expandedVehicle === vehicleNumber ? null : vehicleNumber
    );
  };

  // Validate container data
  // Helper: ISO 6346 check digit calculation
  const calculateCheckDigit = (containerNo) => {
    // Take first 10 characters (4 letters + 6 digits)
    const chars = containerNo.slice(0, 10).split("");
    const letters = "0123456789A?BCDEFGHIJK?LMNOPQRSTU?VWXYZ";
    // (where A=10, B=12, C=13 ... Z=38, skipping multiples of 11)

    let sum = 0;
    chars.forEach((char, i) => {
      let value;
      if (/[A-Z]/.test(char)) {
        // Convert letters using ISO 6346 values
        value = letters.indexOf(char);
      } else {
        value = parseInt(char, 10);
      }
      sum += value * Math.pow(2, i);
    });

    return (sum % 11) % 10; // modulo 11, if result is 10 -> 0
  };

  const validateContainers = () => {
    const errors = [];
    containers.forEach((container, index) => {
      if (!container.containerNo.trim()) {
        errors.push(`Container ${index + 1}: Container number is required`);
      } else {
        const containerNoRegex = /^[A-Z]{4}[0-9]{7}$/;
        if (!containerNoRegex.test(container.containerNo)) {
          errors.push(
            `Container ${
              index + 1
            }: Container number must be 4 letters followed by 7 digits (e.g., ABCD1234567)`
          );
        } else {
          // Validate check digit
          const expectedCheckDigit = calculateCheckDigit(container.containerNo);
          const actualCheckDigit = parseInt(
            container.containerNo.slice(-1),
            10
          );
          if (expectedCheckDigit !== actualCheckDigit) {
            errors.push(
              `Container ${
                index + 1
              }: Invalid check digit. Expected ${expectedCheckDigit}, got ${actualCheckDigit}`
            );
          }
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
      toast.error(
        <div className="flex flex-col">
          <span className="font-bold text-lg mb-1">Validation Failed</span>
          <ul className="list-disc pl-4">
            {errors.map((error, index) => (
              <li key={index} className="text-sm">
                {error}
              </li>
            ))}
          </ul>
        </div>,
        {
          position: "top-center",
          autoClose: 5000,
        }
      );
      return;
    }

    setIsSubmitting(true);

    // Single loading toast
    const loadingId = toast.loading("Updating container details...", {
      position: "top-center",
    });

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
        const existingData = getExistingTransporterData(vehicleNumber);

        if (!existingData) {
          toast.dismiss(loadingId);
          toast.error(
            `No transporter data found for vehicle ${vehicleNumber}`,
            {
              position: "top-center",
            }
          );
          throw new Error(
            `No transporter data found for vehicle ${vehicleNumber}`
          );
        }

        // Separate existing containers (with ID) from new ones (without ID)
        const existingContainers = vehicleContainers.filter(
          (container) => container.id
        );
        const newContainers = vehicleContainers.filter(
          (container) => !container.id
        );

        // Format containers for API
        const formatContainer = (container) => {
          if (!container.containerNo || !container.vehicleNumber) {
            throw new Error(
              `Invalid container data: missing containerNo or vehicleNumber`
            );
          }
          return {
            container_no: container.containerNo,
            line: container.line || "",
            seal_no: container.seal1 || "",
            number_of_containers: parseInt(container.numberOfContainers) || 1,
            seal1: container.seal1 || "",
            seal2: container.seal2 || "",
            container_total_weight:
              parseFloat(container.containerTotalWeight) || 0,
            cargo_total_weight: parseFloat(container.cargoTotalWeight) || 0,
            container_type: container.containerType || "",
            container_size: container.containerSize || "",
            vehicle_number: container.vehicleNumber,
            remarks: container.remarks || "",
          };
        };

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
                  message: `Failed to update container ${
                    container.containerNo
                  }: ${error.message || "Unknown error"}`,
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
                  message: `Failed to add containers to vehicle ${vehicleNumber}: ${
                    error.message || "Unknown error"
                  }`,
                  error,
                };
              })
          );
        }
      }

      const results = await Promise.all(updatePromises);

      // Dismiss loading toast before showing results
      toast.dismiss(loadingId);

      // Show single success/error toast based on results
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      if (successCount > 0) {
        toast.success(
          <div className="flex flex-col space-y-2">
            <div className="font-bold text-lg border-b pb-2">
              Container Update Successful
            </div>

            {results
              .filter((result) => result.success)
              .map((result, index) => (
                <div key={index} className="space-y-2">
                  <div className="font-medium">
                    Container: {result.data.containerDetails.container_no}
                  </div>

                  {/* Container Details */}
                  <div className="text-sm space-y-1">
                    <div>
                      Vehicle: {result.data.containerDetails.vehicle_number}
                    </div>
                    <div>Line: {result.data.containerDetails.line}</div>
                    <div>
                      Size: {result.data.containerDetails.container_size}'
                    </div>
                    <div>
                      Type: {result.data.containerDetails.container_type}
                    </div>
                  </div>

                  {/* Warning Message if container was previously used */}
                  {result.data.containerAlreadyUsed && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 mt-2">
                      <div className="text-yellow-700 text-sm">
                        <span className="font-bold">⚠️ Warning: </span>
                        Previously used in Request #
                        {result.data.lastUsedIn.request_id}
                        <br />
                        <span className="text-xs">
                          Total previous uses: {result.data.totalPreviousUses}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>,
          {
            position: "top-center",
            autoClose: 8000, // Increased duration to allow reading
            style: {
              backgroundColor: "#ffffff",
              color: "#000000",
              minWidth: "380px",
              maxWidth: "500px",
            },
            className: "custom-toast",
          }
        );
      }

      if (failureCount > 0) {
        toast.error(
          <div className="flex flex-col">
            <span className="font-bold text-lg mb-1">Update Failed</span>
            <p className="text-sm">
              {failureCount} containers failed to update
            </p>
          </div>,
          {
            position: "top-center",
            autoClose: 3000,
          }
        );
      }

      // Refresh data
      await fetchExistingTransporterData();
    } catch (error) {
      // Dismiss loading toast before showing error
      toast.dismiss(loadingId);

      toast.error(
        <div className="flex flex-col">
          <span className="font-bold text-lg mb-1">Error</span>
          <p className="text-sm">
            {error.message || "Failed to update container details"}
          </p>
        </div>,
        {
          position: "top-center",
          autoClose: 3000,
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  // Load containers for a specific vehicle
  const loadVehicleContainers = async (vehicleNumber) => {
    if (!transportRequestId || !vehicleNumber) {
      toast.error("Transport request ID or vehicle number is missing");
      return;
    }

    // Show loading indicator for this specific operation
    const vehicleLoadingToastId = toast.info(
      `Loading containers for vehicle ${vehicleNumber}...`,
      { autoClose: false }
    );

    try {
      const response = await transporterAPI.getContainersByVehicleNumber(
        transportRequestId,
        vehicleNumber
      );

      if (response.success && response.data && response.data.length > 0) {
        // Map the API response to our container format
        const vehicleContainers = response.data.map((container, index) => ({
          id: container.id,
          containerNo: container.container_no || "",
          numberOfContainers: container.number_of_containers?.toString() || "",
          containerType: container.container_type || "",
          containerSize: container.container_size || "",
          line: container.line || "",
          seal1: container.seal1 || container.seal_no || "",
          seal2: container.seal2 || "",
          containerTotalWeight:
            container.container_total_weight?.toString() || "",
          cargoTotalWeight: container.cargo_total_weight?.toString() || "",
          remarks: container.remarks || "",
          vehicleNumber: container.vehicle_number || "",
          vehicleIndex: Date.now() + index, // Use timestamp + index for unique index
        }));

        // Update containers state by replacing containers for this vehicle
        setContainers((prevContainers) => {
          // Remove existing containers for this vehicle
          const otherContainers = prevContainers.filter(
            (c) => c.vehicleNumber !== vehicleNumber
          );
          // Add the newly loaded containers
          return [...otherContainers, ...vehicleContainers];
        });

        // Update sessionStorage
        setTimeout(() => {
          const updatedContainers = [
            ...document.querySelectorAll("[data-vehicle]"),
          ].map((el) => JSON.parse(el.dataset.container || "{}"));
          sessionStorage.setItem(
            "containerData",
            JSON.stringify(updatedContainers)
          );
        }, 100);

        toast.dismiss(vehicleLoadingToastId);

        return vehicleContainers;
      } else {
        toast.dismiss(vehicleLoadingToastId);
        toast.info(`No containers found for vehicle ${vehicleNumber}`);
        return [];
      }
    } catch (error) {
      console.error(
        `Error loading containers for vehicle ${vehicleNumber}:`,
        error
      );
      toast.dismiss(vehicleLoadingToastId);
      toast.error(`Failed to load containers for vehicle ${vehicleNumber}`);
      return [];
    }
  };
  // Load existing container data

  // Load data on component mount if transportRequestId exists
  useEffect(() => {
    if (transportRequestId) {
      fetchExistingTransporterData();
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
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{
          width: "400px",
        }}
        toastStyle={{
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "16px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          fontSize: "14px",
        }}
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
                    ✓ {existingTransporterData.length} transporter record(s)
                    found
                  </p>
                )}
              </div>
              <div className="flex space-x-3">
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
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  No transporter data found
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Please add transporter details first before updating
                    container information. The container update requires
                    existing transporter data to preserve vehicle and driver
                    information.
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
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Vehicle Groups */}
              <div className="space-y-6">
                {Object.entries(groupedContainers).map(
                  ([vehicleNumber, vehicleContainers]) => (
                    <div
                      key={vehicleNumber}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      {/* Vehicle Header */}
                      <div
                        className={`px-4 py-3 flex justify-between items-center cursor-pointer ${
                          expandedVehicle === vehicleNumber
                            ? "bg-blue-50"
                            : "bg-gray-50"
                        }`}
                        onClick={() => toggleVehicleExpansion(vehicleNumber)}
                      >
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900">
                            {vehicleNumber === "unassigned"
                              ? "Unassigned Containers"
                              : `Vehicle: ${vehicleNumber}`}
                          </span>
                          <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                            {vehicleContainers.length} container
                            {vehicleContainers.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex items-center">
                          {/* Add Container Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addContainer(vehicleNumber);
                            }}
                            className="mr-2 inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            title="Add container to this vehicle"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                          </button>
                          {/* Expand/Collapse Icon */}
                          <svg
                            className={`h-5 w-5 text-gray-500 transform transition-transform ${
                              expandedVehicle === vehicleNumber
                                ? "rotate-180"
                                : ""
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Container Cards */}
                      {expandedVehicle === vehicleNumber && (
                        <div className="p-4 bg-white">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {vehicleContainers.map(
                              (container, containerIndex) => {
                                // Use a stable key based on container.id or vehicleIndex
                                const key =
                                  container.id ||
                                  `container-${container.vehicleIndex}-${vehicleNumber}-${containerIndex}`;

                                return (
                                  <div
                                    key={key}
                                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                                    data-vehicle={vehicleNumber}
                                    data-container={JSON.stringify(container)}
                                  >
                                    <div className="flex justify-between items-center mb-4">
                                      <h3 className="text-md font-medium text-gray-900">
                                        Container #{containerIndex + 1}
                                      </h3>
                                      {containers.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeContainer(
                                              containers.findIndex(
                                                (c) =>
                                                  c.vehicleIndex ===
                                                  container.vehicleIndex
                                              )
                                            )
                                          }
                                          className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                          title="Remove Container"
                                        >
                                          <svg
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M6 18L18 6M6 6l12 12"
                                            />
                                          </svg>
                                        </button>
                                      )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {/* Vehicle Number */}

                                      {/* Container Number */}
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-0">
                                          Container Number *
                                        </label>
                                        <input
                                          type="text"
                                          required
                                          className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          value={container.containerNo}
                                          onChange={(e) =>
                                            updateContainerData(
                                              containers.findIndex(
                                                (c) =>
                                                  c.vehicleIndex ===
                                                  container.vehicleIndex
                                              ),
                                              "containerNo",
                                              e.target.value.toUpperCase()
                                            )
                                          }
                                          placeholder="Container Number"
                                        />
                                      </div>

                                      {/* Number of Containers */}

                                      {/* Container Type */}
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Container Type
                                        </label>
                                        <select
                                          className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          value={container.containerType}
                                          onChange={(e) =>
                                            updateContainerData(
                                              containers.findIndex(
                                                (c) =>
                                                  c.vehicleIndex ===
                                                  container.vehicleIndex
                                              ),
                                              "containerType",
                                              e.target.value
                                            )
                                          }
                                        >
                                          <option value="">
                                            Select Container Type
                                          </option>
                                          <option value="HQ">HQ</option>
                                          <option value="DV">DV</option>
                                          <option value="REFER">REFER</option>
                                        </select>
                                      </div>

                                      {/* Container Size */}
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Container Size
                                        </label>
                                        <input
                                          type="text"
                                          className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          value={container.containerSize}
                                          onChange={(e) =>
                                            updateContainerData(
                                              containers.findIndex(
                                                (c) =>
                                                  c.vehicleIndex ===
                                                  container.vehicleIndex
                                              ),
                                              "containerSize",
                                              e.target.value
                                            )
                                          }
                                          placeholder="Container Size"
                                        />
                                      </div>

                                      {/* Shipping Line */}
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Shipping Line
                                        </label>
                                        <input
                                          type="text"
                                          className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          value={container.line}
                                          onChange={(e) =>
                                            updateContainerData(
                                              containers.findIndex(
                                                (c) =>
                                                  c.vehicleIndex ===
                                                  container.vehicleIndex
                                              ),
                                              "line",
                                              e.target.value
                                            )
                                          }
                                          placeholder="Shipping Line"
                                        />
                                      </div>

                                      {/* Seal 1 */}
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Seal 1
                                        </label>
                                        <input
                                          type="text"
                                          className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          value={container.seal1}
                                          onChange={(e) =>
                                            updateContainerData(
                                              containers.findIndex(
                                                (c) =>
                                                  c.vehicleIndex ===
                                                  container.vehicleIndex
                                              ),
                                              "seal1",
                                              e.target.value.toUpperCase()
                                            )
                                          }
                                          placeholder="Seal 1"
                                        />
                                      </div>

                                      {/* Seal 2 */}
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Seal 2
                                        </label>
                                        <input
                                          type="text"
                                          className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          value={container.seal2}
                                          onChange={(e) =>
                                            updateContainerData(
                                              containers.findIndex(
                                                (c) =>
                                                  c.vehicleIndex ===
                                                  container.vehicleIndex
                                              ),
                                              "seal2",
                                              e.target.value.toUpperCase()
                                            )
                                          }
                                          placeholder="Seal 2"
                                        />
                                      </div>

                                      {/* Container Weight */}
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Tare Weight (kg)
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          value={container.containerTotalWeight}
                                          onChange={(e) =>
                                            updateContainerData(
                                              containers.findIndex(
                                                (c) =>
                                                  c.vehicleIndex ===
                                                  container.vehicleIndex
                                              ),
                                              "containerTotalWeight",
                                              e.target.value
                                            )
                                          }
                                          placeholder="Container Weight"
                                        />
                                      </div>

                                      {/* Cargo Weight */}

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Cargo Weight (kg)
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          value={container.cargoTotalWeight}
                                          onChange={(e) =>
                                            updateContainerData(
                                              containers.findIndex(
                                                (c) =>
                                                  c.vehicleIndex ===
                                                  container.vehicleIndex
                                              ),
                                              "cargoTotalWeight",
                                              e.target.value
                                            )
                                          }
                                          placeholder="Cargo Weight"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Gross Weight (kg)
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          value={
                                            (parseFloat(
                                              container.cargoTotalWeight
                                            ) || 0) +
                                            (parseFloat(
                                              container.containerTotalWeight
                                            ) || 0)
                                          }
                                          placeholder="Cargo Weight"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                )}
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
                  disabled={
                    isSubmitting || existingTransporterData.length === 0
                  }
                  className={`
                    px-8 py-3 rounded-md text-white font-medium transition-all duration-200
                    ${
                      isSubmitting || existingTransporterData.length === 0
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    }
                    flex items-center
                  `}
                  title={
                    existingTransporterData.length === 0
                      ? "Add transporter details first"
                      : "Update container details"
                  }
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
        {/* Response Modal */}
        <ResponseModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          data={modalData}
        />
      </div>
    </div>
  );
};

export default ContainerDetailsPage;
