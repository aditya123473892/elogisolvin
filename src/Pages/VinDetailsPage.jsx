import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { transporterAPI } from "../utils/Api";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import ResponseModal from "../Components/Responsemodal";

const VinDetailsPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [containers, setContainers] = useState([]);
  const [transportRequestId, setTransportRequestId] = useState("");
  const [vehicleDataList, setVehicleDataList] = useState([]);
  const [existingTransporterData, setExistingTransporterData] = useState([]);
  const [vehicleType, setVehicleType] = useState("");
  const [groupedContainers, setGroupedContainers] = useState({});
  const [expandedVehicle, setExpandedVehicle] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);

  // Helper function to get VIN count from vehicle type
  const getVinCountFromVehicleType = (vType) => {
    if (!vType) return 0;

    if (vType.startsWith("Tr-")) {
      const match = vType.match(/Tr-(\d+)/);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
    } else if (vType === "Ven") {
      return 4;
    }
    return 0;
  };

  // Create empty container with a unique client-side ID
  const createEmptyContainer = (vehicleNumber = "") => ({
    clientId: `temp-${Date.now()}-${Math.random()}`,
    id: null,
    containerNo: "", // VIN will be stored here
    vehicleNumber:
      vehicleNumber ||
      (vehicleDataList.length > 0 ? vehicleDataList[0].vehicleNumber : ""),
    isDirty: true, // New containers are always dirty
  });

  // Initialize with data from sessionStorage
  useEffect(() => {
    const storedContainerData = sessionStorage.getItem("containerData");
    const storedRequestId = sessionStorage.getItem("transportRequestId");
    const storedVehicleType = sessionStorage.getItem("vehicleType");
    const storedVehicleData = sessionStorage.getItem("vehicleData");

    if (storedRequestId) {
      setTransportRequestId(storedRequestId);
    }

    if (storedVehicleType) {
      setVehicleType(storedVehicleType);
    }

    if (storedVehicleData) {
      try {
        const parsedVehicleData = JSON.parse(storedVehicleData);
        setVehicleDataList(parsedVehicleData);
      } catch (error) {
        console.error("Error parsing vehicle data:", error);
        toast.error("Failed to load vehicle data");
      }
    }

    if (storedContainerData) {
      try {
        const parsedData = JSON.parse(storedContainerData);
        const containerData = parsedData.map((container) => ({
          ...container,
          id: container.id || null,
          clientId: container.clientId || `temp-${Date.now()}-${Math.random()}`,
          isDirty: false, // Initialize as clean
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
  }, [containers]);

  // Initialize empty containers based on vehicle type
  const initializeEmptyContainers = (vType) => {
    const vinCount = getVinCountFromVehicleType(vType);
    if (vinCount > 0 && vehicleDataList.length > 0) {
      const newContainers = [];
      const defaultVehicleNumber = vehicleDataList[0].vehicleNumber;

      for (let i = 0; i < vinCount; i++) {
        newContainers.push({
          ...createEmptyContainer(defaultVehicleNumber),
          vehicleIndex: i + 1,
        });
      }
      setContainers(newContainers);
    }
  };

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

        // Extract vehicle numbers for internal use
        const vehicles = transporterData.map((item) => ({
          vehicleNumber: item.vehicle_number,
          transporterName: item.transporter_name,
          vehicleSequence: item.vehicle_sequence || 0,
        }));
        setVehicleDataList(vehicles);
        sessionStorage.setItem("vehicleData", JSON.stringify(vehicles));
      }
    } catch (error) {
      console.error("Error fetching existing transporter data:", error);
    }
  };

  // Load existing container data (VINs)
  const loadContainerData = async () => {
    if (!transportRequestId) {
      toast.error("Transport request ID is missing");
      return;
    }

    setIsLoading(true);
    try {
      const allContainersResponse =
        await transporterAPI.getContainersByRequestId(transportRequestId);

      if (
        allContainersResponse.success &&
        allContainersResponse.data &&
        allContainersResponse.data.length > 0
      ) {
        const loadedContainers = allContainersResponse.data.map(
          (container, index) => ({
            id: container.id,
            clientId: `temp-${container.id}`,
            containerNo: container.container_no || "", // VIN stored here
            vehicleNumber: container.vehicle_number || "",
            isDirty: false,
          })
        );

        setContainers(loadedContainers);
        sessionStorage.setItem(
          "containerData",
          JSON.stringify(loadedContainers)
        );
        toast.success("VIN data loaded successfully");
      } else {
        toast.info("No VIN data found for this request");
        if (vehicleType) {
          initializeEmptyContainers(vehicleType);
        }
      }
    } catch (error) {
      console.error("Error loading VIN data:", error);
      toast.error("Failed to load existing VIN data");
      if (vehicleType) {
        initializeEmptyContainers(vehicleType);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (transportRequestId) {
      fetchExistingTransporterData().then(() => {
        loadContainerData();
      });
    }
  }, [transportRequestId]);

  // Initialize empty containers when vehicle data is loaded
  useEffect(() => {
    if (vehicleType && vehicleDataList.length > 0 && containers.length === 0) {
      initializeEmptyContainers(vehicleType);
    }
  }, [vehicleDataList, vehicleType]);

  const onBack = () => {
    sessionStorage.setItem("containerData", JSON.stringify(containers));
    navigate(-1);
  };

  // Add new VIN entry
  const addContainer = (vehicleNumber = "") => {
    const newContainer = createEmptyContainer(vehicleNumber);
    setContainers([...containers, newContainer]);
  };

  // Remove VIN entry
  const removeContainer = async (identifier) => {
    if (containers.length <= 1) {
      toast.warning("At least one VIN entry is required");
      return;
    }

    const containerToRemove = containers.find(
      (c) => (c.id || c.clientId) === identifier
    );

    if (containerToRemove && containerToRemove.id) {
      try {
        setIsLoading(true);
        const response = await transporterAPI.deleteContainer(
          containerToRemove.id
        );
        if (!response.success) {
          throw new Error(response.message || "Failed to delete VIN entry");
        }
      } catch (error) {
        console.error("Error deleting VIN entry:", error);
        toast.error(error.message || "Failed to delete VIN entry");
        setIsLoading(false);
        return;
      }
    }

    const updatedContainers = containers.filter(
      (c) => (c.id || c.clientId) !== identifier
    );
    setContainers(updatedContainers);
    toast.success("VIN entry removed successfully");
    setIsLoading(false);
  };

  // Update container data with VIN validation
  const updateContainerData = (identifier, field, value) => {
    if (field === "containerNo") {
      value = value.toUpperCase();
      if (value.length > 17) {
        value = value.substring(0, 17);
      }
      value = value.replace(/[^A-Z0-9]/g, "");
    }

    setContainers(
      containers.map((container) => {
        const currentIdentifier = container.id || container.clientId;
        if (currentIdentifier === identifier) {
          return { ...container, [field]: value, isDirty: true };
        }
        return container;
      })
    );
  };

  // Toggle vehicle expansion
  const toggleVehicleExpansion = (vehicleNumber) => {
    setExpandedVehicle(
      expandedVehicle === vehicleNumber ? null : vehicleNumber
    );
  };

  // Validate VIN data
  const validateContainers = () => {
    const errors = [];
    containers.forEach((container, index) => {
      if (!container.containerNo.trim()) {
        errors.push(`VIN ${index + 1}: VIN number is required`);
      } else {
        if (container.containerNo.length !== 17) {
          errors.push(
            `VIN ${index + 1}: VIN must be exactly 17 characters long`
          );
        }
        const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
        if (!vinRegex.test(container.containerNo)) {
          errors.push(
            `VIN ${index + 1}: Invalid VIN format (no I, O, Q allowed)`
          );
        }
      }

      if (!container.vehicleNumber) {
        errors.push(`VIN ${index + 1}: Vehicle number is required`);
      }
    });
    return errors;
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
        { position: "top-center", autoClose: 5000 }
      );
      return;
    }

    setIsSubmitting(true);
    const loadingId = toast.loading("Assigning VINs to vehicles...", {
      position: "top-center",
    });

    try {
      const vehicleContainers = vehicleDataList
        .map((vehicle) => {
          const containersForVehicle = containers.filter(
            (c) =>
              c.vehicleNumber === vehicle.vehicleNumber && (c.isDirty || !c.id)
          );

          if (containersForVehicle.length === 0) {
            return null;
          }

          return {
            vehicle_number: vehicle.vehicleNumber,
            vehicle_sequence: vehicle.vehicleSequence || 0,
            containers: containersForVehicle.map((container) => ({
              id: container.id,
              clientId: container.clientId,
              container_no: container.containerNo.trim(),
              // Add other fields as null or default if needed by the API
              line: null,
              seal_no: null,
              number_of_containers: 1,
              seal1: null,
              seal2: null,
              container_total_weight: null,
              cargo_total_weight: null,
              container_type: null,
              container_size: null,
              remarks: null,
            })),
          };
        })
        .filter(Boolean);

      if (vehicleContainers.length === 0) {
        toast.dismiss(loadingId);
        toast.info("No changes to submit.");
        setIsSubmitting(false);
        return;
      }

      const response = await transporterAPI.updateMultipleVehicleContainers(
        transportRequestId,
        vehicleContainers
      );

      if (response.success) {
        const savedContainersMap = new Map();
        response.data.forEach((vc) => {
          vc.containers.forEach((container) => {
            const key = container.id || container.clientId;
            savedContainersMap.set(key, {
              id: container.id,
              clientId: container.clientId || `temp-${container.id}`,
              containerNo: container.container_no || "",
              vehicleNumber: vc.vehicle_number || "",
              isDirty: false,
            });
          });
        });

        setContainers((prevContainers) => {
          const newContainers = prevContainers.map((pc) => {
            const identifier = pc.id || pc.clientId;
            if (savedContainersMap.has(identifier)) {
              return { ...pc, ...savedContainersMap.get(identifier) };
            }
            return pc;
          });

          sessionStorage.setItem(
            "containerData",
            JSON.stringify(newContainers)
          );
          return newContainers;
        });

        toast.dismiss(loadingId);
        toast.success(
          <div className="flex flex-col">
            <span className="font-bold text-lg mb-1">Success</span>
            <p className="text-sm">
              Successfully updated{" "}
              {response.data.reduce((sum, vc) => sum + vc.containers.length, 0)}{" "}
              VIN(s)
            </p>
          </div>,
          { position: "top-center", autoClose: 5000 }
        );

        setShowModal(true);
        setModalData({
          containers: response.data.flatMap((vc) =>
            vc.containers.map((c) => ({
              ...c,
              vehicle_number: vc.vehicle_number,
            }))
          ),
        });
      } else {
        throw new Error(response.message || "Failed to update VINs");
      }
    } catch (error) {
      toast.dismiss(loadingId);
      console.error("Error updating VINs:", error);
      toast.error(error.message || "Error updating VINs", {
        position: "top-center",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading VIN details...</p>
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
                  VIN Details Management
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Request ID:{" "}
                  <span className="font-medium">{transportRequestId}</span>
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  Vehicle Type:{" "}
                  <span className="font-medium">{vehicleType}</span>
                  {vehicleType &&
                    ` (${getVinCountFromVehicleType(
                      vehicleType
                    )} VIN entries required)`}
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
                    Please add transporter details first before updating VIN
                    information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                VIN Information ({containers.length} VIN
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
                              ? "Unassigned VINs"
                              : `Vehicle: ${vehicleNumber}`}
                          </span>
                          <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                            {vehicleContainers.length} VIN
                            {vehicleContainers.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex items-center">
                          {/* Add VIN Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addContainer(vehicleNumber);
                            }}
                            className="mr-2 inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            title="Add VIN to this vehicle"
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

                      {/* VIN Cards */}
                      {expandedVehicle === vehicleNumber && (
                        <div className="p-4 bg-white">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {vehicleContainers.map(
                              (container, containerIndex) => {
                                const identifier =
                                  container.id || container.clientId;

                                return (
                                  <div
                                    key={identifier}
                                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                                  >
                                    <div className="flex justify-between items-center mb-4">
                                      <h3 className="text-md font-medium text-gray-900">
                                        VIN #{containerIndex + 1}
                                      </h3>
                                      {containers.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeContainer(identifier)
                                          }
                                          className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                          title="Remove VIN"
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

                                    <div className="space-y-4">
                                      {/* VIN Number */}
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          VIN Number *
                                        </label>
                                        <input
                                          type="text"
                                          required
                                          className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          value={container.containerNo}
                                          onChange={(e) =>
                                            updateContainerData(
                                              identifier,
                                              "containerNo",
                                              e.target.value
                                            )
                                          }
                                          placeholder="Enter 17-digit VIN"
                                          maxLength={17}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                          Format: 17 alphanumeric characters (
                                          {container.containerNo.length}/17)
                                        </p>
                                      </div>

                                      {/* Vehicle Number Display */}
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
                      : "Update VIN details"
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
                      Updating VINs...
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
                      Update VIN Details
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        <ResponseModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          data={modalData}
        />
      </div>
    </div>
  );
};

export default VinDetailsPage;
