import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { transporterAPI, transporterListAPI } from "../utils/Api";
import VehicleBasicDetailsTable from "../Components/dashboard/Vehiclebasicdetailstable";
import VehicleChargesTable from "../Components/dashboard/VehicleChargetable";
import ContainerDetailsTable from "../Components/dashboard/Containerdetailstable";
import ModalChecklist from "../Components/dashboard/ModalChecklist";

export const TransporterDetails = ({
  transportRequestId,
  onBack,
  selectedServices = [],
  transporterData,
  setTransporterData,
  vehicleType,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [vehicleDataList, setVehicleDataList] = useState([]);
  const [transportersList, setTransportersList] = useState([]);
  const [services, setServices] = useState(selectedServices);
  const [vehicleCount, setVehicleCount] = useState(1); // Initialize with 1 vehicle

  useEffect(() => {
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
      baseCharge: "0",
      additionalCharges: "",
      totalCharge: 0,
      serviceCharges: {},
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
      vehicleType: transporterData?.vehicle_type || "",
    };

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

  useEffect(() => {
    // Initialize or update vehicleDataList when vehicleCount changes
    setVehicleDataList((prevList) => {
      if (prevList.length === vehicleCount) {
        return prevList;
      }

      const newList = initializeVehicleData(vehicleCount);

      // Preserve existing data for vehicles that already exist
      for (let i = 0; i < Math.min(prevList.length, vehicleCount); i++) {
        newList[i] = { ...prevList[i], vehicleIndex: i + 1 };
      }

      return newList;
    });
  }, [vehicleCount, services]);

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

        // Update vehicleCount based on fetched data
        setVehicleCount(details.length || 1);

        const mappedData = details.map((existingDetail, i) => {
          let serviceCharges = {};
          if (existingDetail.service_charges) {
            try {
              serviceCharges = JSON.parse(existingDetail.service_charges);
            } catch (e) {
              console.error("Error parsing service charges:", e);
            }
          }

          services.forEach((service) => {
            if (!serviceCharges[service]) {
              serviceCharges[service] = "0";
            }
          });

          return {
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
            baseCharge: existingDetail.base_charge || "0",
            additionalCharges: existingDetail.additional_charges || "",
            totalCharge: existingDetail.total_charge || 0,
            serviceCharges: serviceCharges,
            containerNo: existingDetail.container_no || "",
            line: existingDetail.line || "",
            sealNo: existingDetail.seal_no || "",
            numberOfContainers: existingDetail.number_of_containers || "",
            seal1: existingDetail.seal1 || "",
            seal2: existingDetail.seal2 || "",
            containerTotalWeight: existingDetail.container_total_weight || "",
            cargoTotalWeight: existingDetail.cargo_total_weight || "",
            containerType: existingDetail.container_type || "",
            containerSize: existingDetail.container_size || "",
            vehicleType: transporterData?.vehicle_type || "",
          };
        });

        setVehicleDataList(mappedData);
        toast.info(`Loaded details for ${details.length} vehicle(s)`);
      }
    } catch (error) {
      if (error.status === 404 || error.message?.includes("not found")) {
        console.log("No existing transporter details found");
        setVehicleDataList(initializeVehicleData(vehicleCount));
      } else {
        console.error("Error loading transporter details:", error);
        toast.error(error.message || "Error loading transporter details");
        setVehicleDataList(initializeVehicleData(vehicleCount));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (transportRequestId) {
      loadTransporterDetails();
    }
  }, [transportRequestId]);

  useEffect(() => {
    const fetchTransporters = async () => {
      try {
        const response = await transporterListAPI.getAllTransporters();
        if (response) {
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
      }
    };

    fetchTransporters();
  }, []);

  const updateVehicleData = (vehicleIndex, field, value) => {
    setVehicleDataList((prevList) =>
      prevList.map((vehicle, index) => {
        if (index === vehicleIndex) {
          const updatedVehicle = { ...vehicle, [field]: value };

          // Calculate totalCharge excluding additionalCharges
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

    return errors;
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (e) => {
    e.preventDefault();
    const allErrors = [];
    vehicleDataList.forEach((vehicle, index) => {
      const vehicleErrors = validateVehicleData(vehicle, index);
      allErrors.push(...vehicleErrors);
    });

    if (allErrors.length > 0) {
      toast.error(`Please fix the following errors:\n${allErrors.join("\n")}`);
      return;
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

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
      const promises = vehicleDataList.map(async (vehicle, index) => {
        const serviceChargesJson = JSON.stringify(vehicle.serviceCharges || {});

        const payload = {
          transport_request_id: transportRequestId,
          transporter_name: vehicle.transporterName.trim(),
          vehicle_number: vehicle.vehicleNumber.trim(),
          driver_name: vehicle.driverName.trim(),
          driver_contact: vehicle.driverContact.trim(),
          license_number: vehicle.licenseNumber.trim(),
          license_expiry: vehicle.licenseExpiry,
          base_charge: 0,
          additional_charges: parseFloat(vehicle.additionalCharges) || 0,
          service_charges: serviceChargesJson,
          total_charge: parseFloat(vehicle.totalCharge) || 0,
          container_no: vehicle.containerNo.trim() || null,
          line: vehicle.line.trim() || null,
          seal_no: "1",
          number_of_containers: vehicle.numberOfContainers
            ? parseInt(vehicle.numberOfContainers)
            : null,
          seal1: vehicle.seal1?.trim() || null,
          seal2: vehicle.seal2?.trim() || null,
          container_total_weight:
            parseFloat(vehicle.containerTotalWeight) || null,
          cargo_total_weight: parseFloat(vehicle.cargoTotalWeight) || null,
          container_type: vehicle.containerType?.trim() || null,
          container_size: vehicle.containerSize?.trim() || null,
        };

        try {
          const response = vehicle.id
            ? await transporterAPI.updateTransporter(vehicle.id, payload)
            : await transporterAPI.createTransporter(
                transportRequestId,
                payload
              );
          return response;
        } catch (error) {
          console.error(`Error saving vehicle ${index + 1}:`, error);
          throw error;
        }
      });

      const responses = await Promise.all(promises);

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
        await loadTransporterDetails();
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

  const addVehicle = () => {
    setVehicleCount((prev) => prev + 1);
  };

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
            Transporter Details ({vehicleCount} Vehicle
            {vehicleCount > 1 ? "s" : ""})
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
            Transporter Details ({vehicleCount} Vehicle
            {vehicleCount > 1 ? "s" : ""})
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
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
          >
            Add Vehicle
          </button>
          <button
            type="button"
            onClick={removeVehicle}
            disabled={vehicleCount <= 1}
            className={`px-4 py-2 rounded-md text-white transition-colors duration-200 ${
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
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-lg font-medium text-gray-900 mb-2">
                  Summary
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Request ID: {transportRequestId}</div>
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
                  Saving {vehicleCount} Vehicle
                  {vehicleCount > 1 ? "s" : ""}...
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
                  Save All Transporter Details ({vehicleCount} Vehicle
                  {vehicleCount > 1 ? "s" : ""})
                </>
              )}
            </button>
          </div>
          <ContainerDetailsTable
            vehicleDataList={vehicleDataList}
            updateVehicleData={updateVehicleData}
            transportRequestId={transportRequestId}
            tripType={
              vehicleType ||
              (vehicleDataList.length > 0 && vehicleDataList[0].vehicleType
                ? vehicleDataList[0].vehicleType
                : "")
            }
          />
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
