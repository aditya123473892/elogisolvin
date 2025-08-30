import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { transporterAPI, transporterListAPI } from "../utils/Api";
import VehicleBasicDetailsTable from "../Components/dashboard/Vehiclebasicdetailstable";
import VehicleChargesTable from "../Components/dashboard/VehicleChargetable";
import ContainerDetailsTable from "../Components/dashboard/Containerdetailstable";
import ModalChecklist from "../Components/dashboard/ModalChecklist";

export const TransporterDetails = ({
  transportRequestId,
  numberOfVehicles,
  selectedServices = [],
  transporterData,
  setTransporterData,
  vehicleType,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [vehicleDataList, setVehicleDataList] = useState([]);
  const [transportersList, setTransportersList] = useState([]);
  const [services, setServices] = useState([]);
  const [vehicleCount, setVehicleCount] = useState(numberOfVehicles || 1);

  // Parse selected services
  useEffect(() => {
    const servicesArray = Array.isArray(selectedServices)
      ? selectedServices
      : typeof selectedServices === "string"
      ? JSON.parse(selectedServices || "[]")
      : [];
    setServices(servicesArray);
  }, [selectedServices]);

  // Initialize vehicle data
  const initializeVehicleData = useCallback(
    (numVehicles) => {
      const defaultVehicleData = {
        id: null,
        vehicleIndex: 0,
        transporterName: "",
        vehicleNumber: "",
        driverName: "",
        driverContact: "",
        licenseNumber: "",
        licenseExpiry: "",
        baseCharge: "0",
        additionalCharges: "",
        totalCharge: 0,
        serviceCharges: services.reduce(
          (acc, service) => ({ ...acc, [service]: "0" }),
          {}
        ),
        containerNo: "",
        line: "",
        sealNo: "",
        numberOfContainers: "",
        seal1: "",
        seal2: "",
        containerTotalWeight: "",
        cargoTotalWeight: "",
        containerType: "",
        containerSize: "",
        vehicleType: vehicleType || "",
      };

      return Array.from({ length: numVehicles }, (_, index) => ({
        ...defaultVehicleData,
        vehicleIndex: index + 1,
      }));
    },
    [services, vehicleType]
  );

  // Sync vehicle count and initialize data
  useEffect(() => {
    setVehicleCount(numberOfVehicles || 1);
    setVehicleDataList((prevList) => {
      if (prevList.length === numberOfVehicles) return prevList;
      const newList = initializeVehicleData(numberOfVehicles);
      return prevList.length > 0
        ? prevList.map((vehicle, i) => ({
            ...(newList[i] || initializeVehicleData(1)[0]),
            ...vehicle,
            vehicleIndex: i + 1,
          }))
        : newList;
    });
  }, [numberOfVehicles, initializeVehicleData]);

  // Fetch transporter details
  const loadTransporterDetails = useCallback(async () => {
    if (!transportRequestId) {
      setVehicleDataList(initializeVehicleData(vehicleCount));
      return;
    }

    setIsLoading(true);
    try {
      const response = await transporterAPI.getTransporterByRequestId(
        transportRequestId
      );
      if (!response?.success || !response?.data) {
        throw new Error("Invalid or empty response from API");
      }

      const details = Array.isArray(response.data)
        ? response.data
        : [response.data];
      setVehicleCount(details.length || vehicleCount);

      const mappedData = details.map((detail, i) => {
        const serviceCharges = detail.service_charges
          ? JSON.parse(detail.service_charges)
          : services.reduce((acc, service) => ({ ...acc, [service]: "0" }), {});

        return {
          id: detail.id || null,
          vehicleIndex: i + 1,
          transporterName: detail.transporter_name || "",
          vehicleNumber: detail.vehicle_number || "",
          driverName: detail.driver_name || "",
          driverContact: detail.driver_contact || "",
          licenseNumber: detail.license_number || "",
          licenseExpiry: detail.license_expiry?.split("T")[0] || "",
          baseCharge: detail.base_charge || "0",
          additionalCharges: detail.additional_charges || "",
          totalCharge: detail.total_charge || 0,
          serviceCharges,
          containerNo: detail.container_no || "",
          line: detail.line || "",
          sealNo: detail.seal_no || "",
          numberOfContainers: detail.number_of_containers || "",
          seal1: detail.seal1 || "",
          seal2: detail.seal2 || "",
          containerTotalWeight: detail.container_total_weight || "",
          cargoTotalWeight: detail.cargo_total_weight || "",
          containerType: detail.container_type || "",
          containerSize: detail.container_size || "",
          vehicleType: detail.vehicle_type || vehicleType || "",
        };
      });

      setVehicleDataList(mappedData);
      toast.info(`Loaded details for ${mappedData.length} vehicle(s)`);
    } catch (error) {
      console.error("Error loading transporter details:", error);
      toast.error(error.message || "Failed to load vehicle details");
      setVehicleDataList(initializeVehicleData(vehicleCount));
    } finally {
      setIsLoading(false);
    }
  }, [
    transportRequestId,
    vehicleCount,
    services,
    vehicleType,
    initializeVehicleData,
  ]);

  useEffect(() => {
    loadTransporterDetails();
  }, [loadTransporterDetails]);

  // Fetch transporters list
  useEffect(() => {
    const fetchTransporters = async () => {
      try {
        const response = await transporterListAPI.getAllTransporters();
        if (Array.isArray(response)) {
          setTransportersList(
            response
              .filter((t) => t.status === "Active")
              .map((t) => ({
                id: t.transporter_id,
                name: t.transporter_name,
              }))
          );
        }
      } catch (error) {
        console.error("Error fetching transporters:", error);
        toast.error("Failed to fetch transporters list");
      }
    };
    fetchTransporters();
  }, []);

  const updateVehicleData = (vehicleIndex, field, value) => {
    setVehicleDataList((prevList) =>
      prevList.map((vehicle) => {
        if (vehicle.vehicleIndex === vehicleIndex + 1) {
          const updatedVehicle = { ...vehicle, [field]: value };
          if (field === "serviceCharges") {
            const serviceChargesTotal = Object.values(
              updatedVehicle.serviceCharges || {}
            ).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
            updatedVehicle.totalCharge = serviceChargesTotal;
          }
          return updatedVehicle;
        }
        return vehicle;
      })
    );
  };

  const validateVehicleData = (vehicle, index) => {
    const errors = [];
    if (!vehicle.transporterName.trim())
      errors.push(`Vehicle ${index + 1}: Transporter name required`);
    if (!vehicle.vehicleNumber.trim())
      errors.push(`Vehicle ${index + 1}: Vehicle number required`);
    if (!vehicle.driverName.trim())
      errors.push(`Vehicle ${index + 1}: Driver name required`);
    if (!vehicle.driverContact.trim()) {
      errors.push(`Vehicle ${index + 1}: Driver contact required`);
    } else if (!/^\d{10}$/.test(vehicle.driverContact.replace(/\D/g, ""))) {
      errors.push(
        `Vehicle ${index + 1}: Driver contact must be a valid 10-digit number`
      );
    }
    return errors;
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (e) => {
    e.preventDefault();
    const allErrors = vehicleDataList.flatMap((vehicle, index) =>
      validateVehicleData(vehicle, index)
    );
    if (allErrors.length > 0) {
      toast.error(`Please fix the following errors:\n${allErrors.join("\n")}`);
      return;
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleVerifyAndProceed = () => {
    setIsModalOpen(false);
    handleSubmit();
  };

  const handleSubmit = async () => {
    if (!transportRequestId) {
      toast.error("Transport request ID is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const promises = vehicleDataList.map(async (vehicle) => {
        const payload = {
          transport_request_id: transportRequestId,
          transporter_name: vehicle.transporterName.trim(),
          vehicle_number: vehicle.vehicleNumber.trim(),
          driver_name: vehicle.driverName.trim(),
          driver_contact: vehicle.driverContact.trim(),
          license_number: vehicle.licenseNumber.trim(),
          license_expiry: vehicle.licenseExpiry || null,
          base_charge: 0,
          additional_charges: parseFloat(vehicle.additionalCharges) || 0,
          service_charges: JSON.stringify(vehicle.serviceCharges || {}),
          total_charge: parseFloat(vehicle.totalCharge) || 0,
          container_no: vehicle.containerNo?.trim() || null,
          line: vehicle.line?.trim() || null,
          seal_no: vehicle.sealNo?.trim() || "1",
          number_of_containers: parseInt(vehicle.numberOfContainers) || null,
          seal1: vehicle.seal1?.trim() || null,
          seal2: vehicle.seal2?.trim() || null,
          container_total_weight:
            parseFloat(vehicle.containerTotalWeight) || null,
          cargo_total_weight: parseFloat(vehicle.cargoTotalWeight) || null,
          container_type: vehicle.containerType?.trim() || null,
          container_size: vehicle.containerSize?.trim() || null,
        };

        return vehicle.id
          ? transporterAPI.updateTransporter(vehicle.id, payload)
          : transporterAPI.createTransporter(transportRequestId, payload);
      });

      const responses = await Promise.all(promises);
      const updatedVehicleList = vehicleDataList.map((vehicle, index) => {
        const response = responses[index];
        return response.success && response.data
          ? {
              ...vehicle,
              id: response.data.id,
              totalCharge: response.data.total_charge || vehicle.totalCharge,
            }
          : vehicle;
      });

      setVehicleDataList(updatedVehicleList);
      const successCount = responses.filter((r) => r.success).length;
      if (successCount === responses.length) {
        toast.success(
          `All ${successCount} vehicle details saved successfully!`
        );
        await loadTransporterDetails();
      } else {
        toast.warning(
          `${successCount} vehicle(s) saved, ${
            responses.length - successCount
          } failed`
        );
      }
    } catch (error) {
      console.error("Error saving transporter details:", error);
      toast.error(error.message || "Failed to save vehicle details");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addVehicle = () => setVehicleCount((prev) => prev + 1);
  const removeVehicle = () => {
    if (vehicleCount > 1) {
      setVehicleCount((prev) => prev - 1);
      setVehicleDataList((prevList) => prevList.slice(0, -1));
    }
  };

  const totalAmount = vehicleDataList.reduce(
    (total, vehicle) => total + (parseFloat(vehicle.totalCharge) || 0),
    0
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow mt-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Transporter Details {vehicleCount > 1 ? "s" : ""}
          </h3>
        </div>
        <div className="p-6 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <span className="ml-3">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow mt-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Transporter Details {vehicleCount > 1 ? "s" : ""}
          </h3>
          {transportRequestId && (
            <p className="text-sm text-gray-600 mt-1">
              Request ID: {transportRequestId}
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={addVehicle}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Add Vehicle
          </button>
          <button
            type="button"
            onClick={removeVehicle}
            disabled={vehicleCount <= 1}
            className={`px-4 py-2 rounded-md text-white ${
              vehicleCount <= 1
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            Remove Vehicle
          </button>
        </div>
      </div>
      <div className="p-6">
        <form onSubmit={handleOpenModal} className="space-y-8">
          <VehicleBasicDetailsTable
            vehicleDataList={vehicleDataList}
            updateVehicleData={updateVehicleData}
          />
          <VehicleChargesTable
            vehicleDataList={vehicleDataList}
            services={services}
            updateVehicleData={updateVehicleData}
          />
          <ContainerDetailsTable
            vehicleDataList={vehicleDataList}
            updateVehicleData={updateVehicleData}
            transportRequestId={transportRequestId}
            tripType={vehicleType}
          />
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-lg font-medium text-gray-900 mb-2">
                  Summary
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Request ID: {transportRequestId || "N/A"}</div>
                  <div>Total Vehicles: {vehicleCount}</div>
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
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-3 rounded-md text-white ${
                isSubmitting
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              } flex items-center`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                  Saving {vehicleCount} Vehicle{vehicleCount > 1 ? "s" : ""}...
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
                  Save All Transporter Details
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      <ModalChecklist
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onVerify={handleVerifyAndProceed}
      />
    </div>
  );
};
