import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { transporterAPI, transporterListAPI } from "../utils/Api"; // Import the specific API methods
import VehicleBasicDetailsTable from "../Components/dashboard/Vehiclebasicdetailstable";
import VehicleChargesTable from "../Components/dashboard/VehicleChargetable";
import ContainerDetailsTable from "../Components/dashboard/Containerdetailstable";
const TransporterSearchInput = ({ value, onChange, placeholder }) => {
  const [transporters, setTransporters] = useState([]);
  const [filteredTransporters, setFilteredTransporters] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [loading, setLoading] = useState(false);
  const [safeRequestData, setSafeRequestData] = useState({
    service_type: [], // This state is used in the code, but we should remove it if not needed
  });
  useEffect(() => {
    const fetchTransporters = async () => {
      setLoading(true);
      try {
        const response = await transporterListAPI.getAllTransporters();
        if (Array.isArray(response)) {
          setTransporters(response);
          setFilteredTransporters(response);
        }
      } catch (error) {
        console.error("Error fetching transporters:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransporters();
  }, []);

  useEffect(() => {
    if (searchTerm && transporters.length > 0) {
      const filtered = transporters.filter((t) =>
        t.transporter_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTransporters(filtered);
    } else {
      setFilteredTransporters(transporters);
    }
  }, [searchTerm, transporters]);

  useEffect(() => {
    setSearchTerm(value || "");
  }, [value]);

  return (
    <div className="relative">
      <input
        type="text"
        className="w-full min-w-40 border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder={placeholder}
        required
      />

      {loading && (
        <div className="absolute right-2 top-2">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {isOpen && filteredTransporters.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredTransporters.map((transporter) => (
            <div
              key={transporter.transporter_id}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => {
                setSearchTerm(transporter.transporter_name);
                onChange(transporter.transporter_name);
                setIsOpen(false);
              }}
            >
              <div className="font-medium text-gray-900">
                {transporter.transporter_name}
              </div>
              <div className="text-sm text-gray-500">
                {transporter.company_name || "No company"} | {transporter.city}
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && filteredTransporters.length === 0 && searchTerm && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="px-3 py-2 text-gray-500 text-sm">
            No transporters found matching "{searchTerm}"
          </div>
        </div>
      )}
    </div>
  );
};

export const TransporterDetails = ({
  transportRequestId,
  numberOfVehicles,
  onBack,
  selectedServices = [],
  transporterData,
  setTransporterData,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [vehicleDataList, setVehicleDataList] = useState([]);
  const [transportersList, setTransportersList] = useState([]);
  const [services, setServices] = useState(selectedServices);

  // Update the services state to properly handle the selectedServices prop
  useEffect(() => {
    // Convert selectedServices to array if it's a string or ensure it's an array
    let servicesArray = [];
    if (typeof selectedServices === "string") {
      try {
        servicesArray = JSON.parse(selectedServices);
      } catch (e) {
        servicesArray = [selectedServices];
      }
    } else if (Array.isArray(selectedServices)) {
      servicesArray = selectedServices;
    }
    setServices(servicesArray);
  }, [selectedServices]);

  const initializeVehicleData = (numVehicles) => {
    const defaultVehicleData = {
      transporterName: "",
      vehicleNumber: "",
      driverName: "",
      driverContact: "",
      licenseNumber: "",
      licenseExpiry: "",
      baseCharge: "",
      additionalCharges: "",
      totalCharge: 0,
      serviceCharges: {}, // Initialize empty object for service charges
      containerNo: "",
      line: "",
      sealNo: "",
      numberOfContainers: "",
      seal1: "", // Add this
      seal2: "", // Add this
      containerTotalWeight: "", // Add this
      cargoTotalWeight: "", // Add this
      containerType: "", // Add this
      containerSize: "", // Add this
    };

    // Initialize serviceCharges with zero values for each selected service
    const initialServiceCharges = {};
    services.forEach((service) => {
      initialServiceCharges[service] = "0";
    });

    return Array.from({ length: numVehicles }, (_, index) => ({
      ...defaultVehicleData,
      serviceCharges: initialServiceCharges,
      vehicleIndex: index + 1,
      id: null,
    }));
  };

  // Initialize vehicle data when component mounts or numberOfVehicles changes
  useEffect(() => {
    if (numberOfVehicles > 0) {
      setVehicleDataList((prevList) => {
        // If we already have data and the number of vehicles hasn't changed, keep existing data
        if (prevList.length === numberOfVehicles) {
          return prevList;
        }

        // If number of vehicles changed, adjust the array
        const newList = initializeVehicleData(numberOfVehicles);

        // Preserve existing data for vehicles that were already there
        for (let i = 0; i < Math.min(prevList.length, numberOfVehicles); i++) {
          newList[i] = { ...prevList[i], vehicleIndex: i + 1 };
        }

        return newList;
      });
    }
  }, [numberOfVehicles]);

  // Load existing transporter details if available
  const loadTransporterDetails = async () => {
    if (!transportRequestId) return;

    setIsLoading(true);
    try {
      const response = await transporterAPI.getTransporterByRequestId(
        transportRequestId
      );

      if (response.success) {
        const details = Array.isArray(response.data)
          ? response.data
          : [response.data];

        // Map existing data to vehicle list
        const mappedData = [];

        // Create the full array based on numberOfVehicles
        for (let i = 0; i < numberOfVehicles; i++) {
          const existingDetail =
            details.find(
              (detail) =>
                detail.vehicle_sequence === i + 1 ||
                (details.length === 1 && i === 0) || // For backward compatibility
                (i < details.length && !detail.vehicle_sequence)
            ) || details[i];

          if (existingDetail) {
            // Parse service_charges if it exists
            let serviceCharges = {};
            if (existingDetail.service_charges) {
              try {
                serviceCharges = JSON.parse(existingDetail.service_charges);
              } catch (e) {
                console.error("Error parsing service charges:", e);
              }
            }

            // Initialize service charges for any missing services
            services.forEach((service) => {
              if (!serviceCharges[service]) {
                serviceCharges[service] = "0";
              }
            });

            // Inside the loadTransporterDetails function, update the mappedData.push call:
            mappedData.push({
              id: existingDetail.id,
              vehicleIndex: i + 1,
              transporterName: existingDetail.transporter_name || "",
              vehicleNumber: existingDetail.vehicle_number || "",
              driverName: existingDetail.driver_name || "",
              driverContact: existingDetail.driver_contact || "",
              licenseNumber: existingDetail.license_number || "",
              licenseExpiry: existingDetail.license_expiry
                ? existingDetail.license_expiry.split("T")[0]
                : "",
              baseCharge: existingDetail.base_charge || "",
              additionalCharges: existingDetail.additional_charges || "",
              totalCharge: existingDetail.total_charge || 0,
              serviceCharges: serviceCharges,
              containerNo: existingDetail.container_no || "",
              line: existingDetail.line || "",
              sealNo: existingDetail.seal_no || "",
              numberOfContainers: existingDetail.number_of_containers || "",
              seal1: existingDetail.seal1 || "", // Add this
              seal2: existingDetail.seal2 || "", // Add this
              containerTotalWeight: existingDetail.container_total_weight || "", // Add this
              cargoTotalWeight: existingDetail.cargo_total_weight || "", // Add this
              containerType: existingDetail.container_type || "", // Add this
              containerSize: existingDetail.container_size || "", // Add this
            });
          } else {
            // Create empty vehicle data for vehicles without existing data
            mappedData.push({
              ...initializeVehicleData(1)[0],
              vehicleIndex: i + 1,
              id: null,
            });
          }
        }

        setVehicleDataList(mappedData);
        toast.info(`Loaded details for ${details.length} vehicle(s)`);
      }
    } catch (error) {
      if (error.status === 404 || error.message?.includes("not found")) {
        console.log("No existing transporter details found");
        setVehicleDataList(initializeVehicleData(numberOfVehicles));
      } else {
        console.error("Error loading transporter details:", error);
        toast.error(error.message || "Error loading transporter details");
        // Initialize empty data on error
        setVehicleDataList(initializeVehicleData(numberOfVehicles));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load transporter details when transportRequestId changes
  useEffect(() => {
    if (transportRequestId) {
      loadTransporterDetails();
    }
  }, [transportRequestId]);

  // Fetch transporters list when component mounts
  useEffect(() => {
    const fetchTransporters = async () => {
      try {
        const response = await transporterListAPI.getAllTransporters();
        if (response) {
          setTransportersList(
            response
              .filter((t) => t.status === "Active") // Only show active transporters
              .map((t) => ({
                id: t.transporter_id,
                name: t.transporter_name,
              }))
          );
        }
      } catch (error) {
        console.error("Error fetching transporters:", error);
      }
    };

    fetchTransporters();
  }, []);

  // Update specific vehicle data
  const updateVehicleData = (vehicleIndex, field, value) => {
    setVehicleDataList((prevList) =>
      prevList.map((vehicle, index) => {
        if (index === vehicleIndex) {
          const updatedVehicle = { ...vehicle, [field]: value };

          // Calculate total including all charges
          if (
            field === "baseCharge" ||
            field === "additionalCharges" ||
            field === "serviceCharges"
          ) {
            const baseCharge = parseFloat(updatedVehicle.baseCharge) || 0;
            const additionalCharges =
              parseFloat(updatedVehicle.additionalCharges) || 0;
            const serviceChargesTotal = Object.values(
              updatedVehicle.serviceCharges || {}
            ).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

            updatedVehicle.totalCharge =
              baseCharge + additionalCharges + serviceChargesTotal;
          }
          return updatedVehicle;
        }
        return vehicle;
      })
    );
  };

  // Validate individual vehicle data
  const validateVehicleData = (vehicle, index) => {
    const errors = [];

    if (!vehicle.transporterName.trim()) {
      errors.push(`Vehicle ${index + 1}: Transporter name is required`);
    }
    if (!vehicle.vehicleNumber.trim()) {
      errors.push(`Vehicle ${index + 1}: Vehicle number is required`);
    }
    if (!vehicle.driverName.trim()) {
      errors.push(`Vehicle ${index + 1}: Driver name is required`);
    }
    if (!vehicle.driverContact.trim()) {
      errors.push(`Vehicle ${index + 1}: Driver contact is required`);
    } else if (!/^\d{10}$/.test(vehicle.driverContact.replace(/\D/g, ""))) {
      errors.push(
        `Vehicle ${index + 1}: Driver contact must be a valid 10-digit number`
      );
    }
    if (!vehicle.licenseNumber.trim()) {
      errors.push(`Vehicle ${index + 1}: License number is required`);
    }
    if (!vehicle.licenseExpiry) {
      errors.push(`Vehicle ${index + 1}: License expiry date is required`);
    }
    if (!vehicle.baseCharge || parseFloat(vehicle.baseCharge) <= 0) {
      errors.push(`Vehicle ${index + 1}: Base charge must be greater than 0`);
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!transportRequestId) {
      toast.error("Transport request ID is required");
      return;
    }

    // Validate all vehicles
    const allErrors = [];
    vehicleDataList.forEach((vehicle, index) => {
      const vehicleErrors = validateVehicleData(vehicle, index);
      allErrors.push(...vehicleErrors);
    });

    if (allErrors.length > 0) {
      toast.error(`Please fix the following errors:\n${allErrors.join("\n")}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const promises = vehicleDataList.map(async (vehicle, index) => {
        // Convert serviceCharges object to JSON string
        const serviceChargesJson = JSON.stringify(vehicle.serviceCharges || {});

        // ... existing code ...
        // Inside the handleSubmit function, update the payload:
        const payload = {
          transport_request_id: transportRequestId,
          transporter_name: vehicle.transporterName.trim(),
          vehicle_number: vehicle.vehicleNumber.trim(),
          driver_name: vehicle.driverName.trim(),
          driver_contact: vehicle.driverContact.trim(),
          license_number: vehicle.licenseNumber.trim(),
          license_expiry: vehicle.licenseExpiry,
          base_charge: parseFloat(vehicle.baseCharge) || 0,
          additional_charges: parseFloat(vehicle.additionalCharges) || 0,
          service_charges: serviceChargesJson, // Add service charges as JSON string
          total_charge: parseFloat(vehicle.totalCharge) || 0,
          container_no: vehicle.containerNo.trim() || null,
          line: vehicle.line.trim() || null,
          seal_no: "1",
          number_of_containers: vehicle.numberOfContainers
            ? parseInt(vehicle.numberOfContainers)
            : null,
          seal1: vehicle.seal1?.trim() || null, // Add this
          seal2: vehicle.seal2?.trim() || null, // Add this
          container_total_weight:
            parseFloat(vehicle.containerTotalWeight) || null, // Add this
          cargo_total_weight: parseFloat(vehicle.cargoTotalWeight) || null, // Add this
          container_type: vehicle.containerType?.trim() || null, // Add this
          container_size: vehicle.containerSize?.trim() || null, // Add this
        };
        // ... existing code ...

        console.log(`Saving vehicle ${index + 1}:`, payload);

        try {
          const response = vehicle.id
            ? await transporterAPI.updateTransporter(vehicle.id, payload)
            : await transporterAPI.createTransporter(
                transportRequestId,
                payload
              );
          console.log(`Response for vehicle ${index + 1}:`, response);
          return response;
        } catch (error) {
          console.error(`Error saving vehicle ${index + 1}:`, error);
          throw error;
        }
      });

      const responses = await Promise.all(promises);

      // Update vehicle data with response IDs and data
      const updatedVehicleList = vehicleDataList.map((vehicle, index) => {
        const response = responses[index];
        if (response.success && response.data) {
          return {
            ...vehicle,
            id: response.data.id,
            totalCharge: response.data.total_charge || vehicle.totalCharge,
          };
        }
        return vehicle;
      });

      setVehicleDataList(updatedVehicleList);

      const successCount = responses.filter((r) => r.success).length;
      const failedCount = responses.length - successCount;

      if (successCount === responses.length) {
        toast.success(
          `All ${successCount} vehicle details saved successfully!`
        );
      } else if (successCount > 0) {
        toast.warning(
          `${successCount} vehicle(s) saved successfully, ${failedCount} failed`
        );
      } else {
        toast.error("Failed to save vehicle details");
      }
    } catch (error) {
      console.error("Error saving transporter details:", error);
      toast.error(error.message || "Error saving transporter details");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate total amount across all vehicles
  const totalAmount = vehicleDataList.reduce(
    (total, vehicle) => total + (parseFloat(vehicle.totalCharge) || 0),
    0
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow mt-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Transporter Details ({numberOfVehicles} Vehicle
            {numberOfVehicles > 1 ? "s" : ""})
          </h3>
        </div>
        <div className="p-6 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <span className="ml-3">Loading transporter details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow mt-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Transporter Details ({numberOfVehicles} Vehicle
            {numberOfVehicles > 1 ? "s" : ""})
          </h3>
          {transportRequestId && (
            <p className="text-sm text-gray-600 mt-1">
              Request ID: {transportRequestId}
            </p>
          )}
        </div>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Vehicle Basic Details Table */}
          <VehicleBasicDetailsTable
            vehicleDataList={vehicleDataList}
            updateVehicleData={updateVehicleData}
          />
          {/* Charges Table */}

          {/* Charges Table */}
          <VehicleChargesTable
            vehicleDataList={vehicleDataList}
            services={services}
            updateVehicleData={updateVehicleData}
          />

          <ContainerDetailsTable
            vehicleDataList={vehicleDataList}
            updateVehicleData={updateVehicleData}
          />
          {/* Total Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-lg font-medium text-gray-900 mb-2">
                  Summary
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Request ID: {transportRequestId}</div>
                  <div>Total Vehicles: {numberOfVehicles}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">
                  ₹
                  {totalAmount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="text-sm text-gray-600">Total Amount</div>
              </div>
            </div>
          </div>
          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                px-8 py-3 rounded-md text-white font-medium transition-all duration-200
                ${
                  isSubmitting
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                }
                flex items-center
              `}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                  Saving {numberOfVehicles} Vehicle
                  {numberOfVehicles > 1 ? "s" : ""}...
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
                  Save All Transporter Details ({numberOfVehicles} Vehicle
                  {numberOfVehicles > 1 ? "s" : ""})
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
