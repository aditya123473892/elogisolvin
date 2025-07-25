import React, { useState, useEffect } from "react";
import { servicesAPI } from "../../utils/Api";
import LocationSearchInput from "./LocationSearchInput";
import CustomerSearchInput from "../dashboard/CustomerSearchinput";
import ServicesSelection from "../dashboard/ServiceSelection";

const ServiceRequestForm = ({
  requestData,
  setRequestData,
  handleSubmit,
  isSubmitting,
  handleCancelEdit,
}) => {
  const submitButtonText = requestData.id ? "Update Request" : "Submit Request";
  const loadingButtonText = requestData.id ? "Updating..." : "Submitting...";

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentTime = now.toTimeString().slice(0, 5);

  const safeRequestData = {
    id: "",
    consignee: "",
    consigner: "",
    vehicle_type: "",
    vehicle_size: "",
    trailerSize: "",
    truckSize: "",
    no_of_vehicles: 1,
    containers_20ft: 0,
    containers_40ft: 0,
    total_containers: 0,
    pickup_location: "",
    stuffing_location: "",
    delivery_location: "",
    commodity: "",
    cargo_type: "",
    cargo_weight: 0,
    service_type: [],
    service_prices: {},
    requested_price: 0,
    expected_pickup_date: today,
    expected_pickup_time: currentTime,
    expected_delivery_date: "",
    expected_delivery_time: "",
    transporterDetails: [],
    vehicle_status: "Empty",
    ...requestData,
  };

  const currentNoOfVehicles = parseInt(safeRequestData.no_of_vehicles) || 1;

  // Helper function to determine if vehicle status should be forced to loaded
  const shouldForceLoadedStatus = (vehicleType) => {
    const alwaysLoadedTypes = [ "Tr-4", "Tr-5", "Tr-8", "Tr-9", "Single Car Carrier"];
    return alwaysLoadedTypes.includes(vehicleType);
  };

  // Helper function to determine if vehicle type should be restricted to single vehicle
  const shouldRestrictToSingleVehicle = (vehicleType) => {
    const singleVehicleTypes = ["Ven", "Tr-4", "Tr-5", "Tr-8", "Tr-9", "Single Car Carrier"];
    return singleVehicleTypes.includes(vehicleType);
  };

  // Helper function to determine if container details should be shown
  const shouldShowContainerDetails = (vehicleType) => {
    return vehicleType === "Trailer";
  };

  // Helper function to determine if 40ft container option should be available
  const shouldShow40ftOption = (vehicleType) => {
    return vehicleType !== "Ven";
  };

  // Calculate total charge from service prices
  const calculateTotalCharge = () => {
    const servicePrices = safeRequestData.service_prices || {};
    const totalServiceCharge = Object.values(servicePrices).reduce(
      (sum, price) => sum + (parseFloat(price) || 0),
      0
    );
    return totalServiceCharge * currentNoOfVehicles;
  };

  const totalCharge = calculateTotalCharge();

  // Update requested_price whenever service prices or number of vehicles change
  useEffect(() => {
    const newRequestedPrice = calculateTotalCharge();
    if (newRequestedPrice !== safeRequestData.requested_price) {
      setRequestData((prev) => ({
        ...prev,
        requested_price: newRequestedPrice,
      }));
    }
  }, [safeRequestData.service_prices, currentNoOfVehicles]);

  // Helper function to create transporter details array based on number of vehicles
  const createTransporterDetailsArray = (numVehicles, existingDetails = []) => {
    const defaultDetail = {
      id: null,
      transporterName: "",
      vehicleNumber: "",
      driverName: "",
      driverContact: "",
      licenseNumber: "",
      licenseExpiry: "",
    };

    const newArray = [];
    for (let i = 0; i < numVehicles; i++) {
      newArray.push({
        ...defaultDetail,
        ...(existingDetails[i] || {}),
      });
    }
    return newArray;
  };

  // Services state
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState(false);
  const [useOpenStreetMap, setUseOpenStreetMap] = useState(false);

  const handleCheckboxChange = (e) => {
    setUseOpenStreetMap(e.target.checked);
  };

  const fetchServices = async () => {
    setLoadingServices(true);
    try {
      const data = await servicesAPI.getAllServices();
      setServices(data);
    } catch (error) {
      console.error("Error loading services:", error);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleServiceAdded = async (newService) => {
    await fetchServices();
  };

  const handleServiceToggle = (serviceName, isSelected) => {
    const updatedServices = isSelected
      ? safeRequestData.service_type.filter((s) => s !== serviceName)
      : [...safeRequestData.service_type, serviceName];

    const updatedPrices = { ...safeRequestData.service_prices };
    if (isSelected) {
      delete updatedPrices[serviceName];
    } else {
      updatedPrices[serviceName] = "0";
    }

    setRequestData({
      ...safeRequestData,
      service_type: updatedServices,
      service_prices: updatedPrices,
    });
  };

  const handleServicePriceChange = (serviceName, price) => {
    setRequestData({
      ...safeRequestData,
      service_prices: {
        ...safeRequestData.service_prices,
        [serviceName]: price,
      },
    });
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Get the current vehicle status (forced to "Loaded" for certain vehicle types)
  const currentVehicleStatus = shouldForceLoadedStatus(safeRequestData.vehicle_type) 
    ? "Loaded" 
    : safeRequestData.vehicle_status;

  // Check if current vehicle type is restricted to single vehicle
  const isRestrictedToSingleVehicle = shouldRestrictToSingleVehicle(safeRequestData.vehicle_type);

  return (
    <div className="lg:col-span-2 bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          {safeRequestData.id ? "Edit Trip Request" : "Create New Trip"}
        </h3>
        {safeRequestData.id && (
          <p className="text-sm text-gray-600 mt-1">
            Request ID: {safeRequestData.id}
          </p>
        )}
      </div>
      <div className="p-6">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white p-6 rounded-lg shadow request-form"
        >
          {/* Consignee and Consigner Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Consignee
              </label>
              <CustomerSearchInput
                value={safeRequestData.consignee}
                onChange={(value) =>
                  setRequestData({ ...safeRequestData, consignee: value })
                }
                placeholder="Search and select consignee"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Consigner
              </label>
              <CustomerSearchInput
                value={safeRequestData.consigner}
                onChange={(value) =>
                  setRequestData({ ...safeRequestData, consigner: value })
                }
                placeholder="Search and select consigner"
              />
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
               Trip Type
              </label>
              <select
                name="vehicle_type"
                className="w-full border rounded-md p-2"
                value={safeRequestData.vehicle_type}
                onChange={(e) => {
                  const newVehicleType = e.target.value;
                  const newVehicleStatus = shouldForceLoadedStatus(newVehicleType) ? "Loaded" : "Empty";
                  const newNoOfVehicles = shouldRestrictToSingleVehicle(newVehicleType) ? 1 : safeRequestData.no_of_vehicles;
                  
                  setRequestData((prev) => ({
                    ...prev,
                    vehicle_type: newVehicleType,
                    vehicle_size: "",
                    trailerSize: "",
                    truckSize: "",
                    vehicle_status: newVehicleStatus,
                    no_of_vehicles: newNoOfVehicles,
                    transporterDetails: createTransporterDetailsArray(
                      newNoOfVehicles,
                      prev.transporterDetails || []
                    ),
                    // Clear container data if not a trailer
                    containers_20ft: shouldShowContainerDetails(newVehicleType) ? prev.containers_20ft : 0,
                    containers_40ft: shouldShowContainerDetails(newVehicleType) ? prev.containers_40ft : 0,
                    total_containers: shouldShowContainerDetails(newVehicleType) ? prev.total_containers : 0,
                    // Clear stuffing location if not loaded
                    stuffing_location: newVehicleStatus === "Loaded" ? prev.stuffing_location : "",
                    // Clear cargo details if empty
                    commodity: newVehicleStatus === "Loaded" ? prev.commodity : "",
                    cargo_type: newVehicleStatus === "Loaded" ? prev.cargo_type : "",
                    cargo_weight: newVehicleStatus === "Loaded" ? prev.cargo_weight : 0,
                  }));
                }}
                required
              >
                <option value="">Select Trip Type</option>
                <option value="Trailer">Container</option>
                <option value="Truck">Truck</option>
                <option value="Ven">Tr-4</option>
              
                <option value="Tr-5">Tr-5</option>
                <option value="Tr-8">Tr-8</option>
                <option value="Tr-9">Tr-9</option>
                <option value="Single Car Carrier">Single Car Carrier</option>
                <option value="Driveaway">Driveaway</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Vehicle Status
              </label>
              {shouldForceLoadedStatus(safeRequestData.vehicle_type) ? (
                <div>
                  <input
                    type="text"
                    className="w-full border rounded-md p-2 bg-gray-100"
                    value="Loaded"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This vehicle type is always loaded
                  </p>
                </div>
              ) : (
                <select
                  name="vehicle_status"
                  className="w-full border rounded-md p-2"
                  value={safeRequestData.vehicle_status}
                  onChange={(e) =>
                    setRequestData((prev) => ({
                      ...prev,
                      vehicle_status: e.target.value,
                      stuffing_location:
                        e.target.value === "Empty" ? "" : prev.stuffing_location,
                      containers_20ft:
                        e.target.value === "Empty" ? 0 : prev.containers_20ft,
                      containers_40ft:
                        e.target.value === "Empty" ? 0 : prev.containers_40ft,
                      total_containers:
                        e.target.value === "Empty" ? 0 : prev.total_containers,
                      commodity: e.target.value === "Empty" ? "" : prev.commodity,
                      cargo_type:
                        e.target.value === "Empty" ? "" : prev.cargo_type,
                      cargo_weight:
                        e.target.value === "Empty" ? 0 : prev.cargo_weight,
                    }))
                  }
                  required
                >
                  <option value="Empty">Empty</option>
                  <option value="Loaded">Loaded</option>
                </select>
              )}
            </div>

            {safeRequestData.vehicle_type === "Trailer" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Trailer Size (in feet)
                </label>
                <input
                  type="text"
                  className="w-full border rounded-md p-2"
                  placeholder="Enter trailer size (e.g., 40)"
                  value={safeRequestData.vehicle_size}
                  onChange={(e) =>
                    setRequestData((prev) => ({
                      ...prev,
                      trailerSize: e.target.value,
                      vehicle_size: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            )}

            {safeRequestData.vehicle_type === "Truck" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Truck Size (in feet)
                </label>
                <input
                  type="text"
                  className="w-full border rounded-md p-2"
                  placeholder="Enter truck size (e.g., 24)"
                  value={safeRequestData.vehicle_size}
                  onChange={(e) =>
                    setRequestData((prev) => ({
                      ...prev,
                      truckSize: e.target.value,
                      vehicle_size: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            )}
          </div>

          {/* Number of Vehicles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Number of Vehicles *
              </label>
              {isRestrictedToSingleVehicle ? (
                <div>
                  <input
                    type="number"
                    className="w-full border rounded-md p-2 bg-gray-100"
                    value={1}
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This trip type only allows single vehicle transport
                  </p>
                </div>
              ) : (
                <input
                  type="number"
                  min="1"
                  max="50"
                  className="w-full border rounded-md p-2"
                  value={currentNoOfVehicles}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value) || 1;
                    const validValue = Math.max(1, Math.min(50, newValue));

                    setRequestData((prev) => {
                      const updatedData = {
                        ...prev,
                        no_of_vehicles: validValue,
                        transporterDetails: createTransporterDetailsArray(
                          validValue,
                          prev.transporterDetails || []
                        ),
                      };
                      return updatedData;
                    });
                  }}
                  required
                />
              )}
            </div>
            <div className="flex items-center">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-sm font-medium text-blue-800">
                  Vehicles Required: {currentNoOfVehicles}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  {currentNoOfVehicles === 1
                    ? "Single vehicle transport"
                    : `Multi-vehicle transport (${currentNoOfVehicles} vehicles)`}
                </div>
                {isRestrictedToSingleVehicle && (
                  <div className="text-xs text-orange-600 mt-1 font-medium">
                    Restricted to single vehicle only
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Container Selection (only for Trailer when Loaded) */}
          {shouldShowContainerDetails(safeRequestData.vehicle_type) && currentVehicleStatus === "Loaded" && (
            <div className="space-y-4">
              <label className="block text-sm font-medium mb-2">
                Container Details
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="space-y-2">
                    <label className="text-sm font-medium block">
                      20' Containers
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border rounded-md p-2"
                      placeholder="Enter number of 20ft containers"
                      value={safeRequestData.containers_20ft}
                      onChange={(e) =>
                        setRequestData((prev) => ({
                          ...prev,
                          containers_20ft: Number(e.target.value) || 0,
                          total_containers:
                            (Number(e.target.value) || 0) +
                            (Number(prev.containers_40ft) || 0),
                        }))
                      }
                    />
                  </div>
                </div>

                {shouldShow40ftOption(safeRequestData.vehicle_type) && (
                  <div className="p-4 border rounded-lg">
                    <div className="space-y-2">
                      <label className="text-sm font-medium block">
                        40' Containers
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full border rounded-md p-2"
                        placeholder="Enter number of 40ft containers"
                        value={safeRequestData.containers_40ft}
                        onChange={(e) =>
                          setRequestData((prev) => ({
                            ...prev,
                            containers_40ft: Number(e.target.value) || 0,
                            total_containers:
                              (Number(prev.containers_20ft) || 0) +
                              (Number(e.target.value) || 0),
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-2 text-sm text-gray-600">
                Total Containers: {safeRequestData.total_containers}
                {(safeRequestData.containers_20ft > 0 ||
                  safeRequestData.containers_40ft > 0) && (
                  <span className="ml-2">
                    (
                    {safeRequestData.containers_20ft > 0
                      ? `${safeRequestData.containers_20ft} × 20ft`
                      : ""}
                    {safeRequestData.containers_20ft > 0 &&
                    safeRequestData.containers_40ft > 0
                      ? ", "
                      : ""}
                    {safeRequestData.containers_40ft > 0
                      ? `${safeRequestData.containers_40ft} × 40ft`
                      : ""}
                    )
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Locations */}
          <div className="mb-4">
            <label className="flex items-center text-sm text-gray-600">
              <input
                type="checkbox"
                checked={useOpenStreetMap}
                onChange={handleCheckboxChange}
                className="mr-2"
              />
              Use Google Map
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Pickup Location
              </label>
              <LocationSearchInput
                value={safeRequestData.pickup_location}
                onChange={(value) =>
                  setRequestData((prev) => ({
                    ...prev,
                    pickup_location: value,
                  }))
                }
                placeholder="Enter pickup location"
                useOpenStreetMap={useOpenStreetMap}
              />
            </div>
            {currentVehicleStatus === "Loaded" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Stuffing Location
                </label>
                <LocationSearchInput
                  value={safeRequestData.stuffing_location}
                  onChange={(value) =>
                    setRequestData((prev) => ({
                      ...prev,
                      stuffing_location: value,
                    }))
                  }
                  placeholder="Enter stuffing location"
                  useOpenStreetMap={useOpenStreetMap}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">
                Delivery Location
              </label>
              <LocationSearchInput
                value={safeRequestData.delivery_location}
                onChange={(value) =>
                  setRequestData((prev) => ({
                    ...prev,
                    delivery_location: value,
                  }))
                }
                placeholder="Enter delivery location"
                useOpenStreetMap={useOpenStreetMap}
              />
            </div>
          </div>

          {/* Cargo Details (only when Loaded) */}
          {currentVehicleStatus === "Loaded" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Commodity/Cargo
                </label>
                <input
                  type="text"
                  className="w-full border rounded-md p-2"
                  value={safeRequestData.commodity}
                  onChange={(e) =>
                    setRequestData({
                      ...safeRequestData,
                      commodity: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Cargo Type
                </label>
                <select
                  className="w-full border rounded-md p-2"
                  value={safeRequestData.cargo_type}
                  onChange={(e) =>
                    setRequestData({
                      ...safeRequestData,
                      cargo_type: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Select Type</option>
                  <option value="General">General</option>
                  <option value="Hazardous">Hazardous</option>
                  <option value="Perishable">Perishable</option>
                  <option value="Fragile">Fragile</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Total Weight (KG)
                </label>
                <input
                  type="number"
                  name="cargo_weight"
                  className="w-full border rounded-md p-2"
                  value={safeRequestData.cargo_weight}
                  onChange={(e) =>
                    setRequestData((prev) => ({
                      ...prev,
                      cargo_weight: Number(e.target.value),
                    }))
                  }
                  required
                />
              </div>
            </div>
          )}

          {/* Services Required with Price Inputs */}
          <div className="space-y-4">
            <ServicesSelection
              services={services}
              loadingServices={loadingServices}
              selectedServices={safeRequestData.service_type}
              servicePrices={safeRequestData.service_prices}
              onServiceToggle={handleServiceToggle}
              onServicePriceChange={handleServicePriceChange}
              isNewServiceModalOpen={isNewServiceModalOpen}
              setIsNewServiceModalOpen={setIsNewServiceModalOpen}
              onServiceAdded={handleServiceAdded}
            />
          </div>

          {/* Total Charge Display */}
          {safeRequestData.service_type.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Pricing Summary</h4>
                <div className="space-y-1 text-sm">
                  {Object.entries(safeRequestData.service_prices).map(
                    ([service, price]) => (
                      <div key={service} className="flex justify-between">
                        <span>{service}:</span>
                        <span>₹{parseFloat(price) || 0}</span>
                      </div>
                    )
                  )}
                  <div className="border-t pt-1 mt-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal per vehicle:</span>
                      <span>
                        ₹
                        {Object.values(safeRequestData.service_prices).reduce(
                          (sum, price) => sum + (parseFloat(price) || 0),
                          0
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Number of vehicles:</span>
                      <span>{currentNoOfVehicles}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-1 mt-1">
                      <span>Total Charge:</span>
                      <span>₹{totalCharge.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dates and Times */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Expected Pickup Date
              </label>
              <input
                type="date"
                name="expected_pickup_date"
                className="w-full border rounded-md p-2"
                value={safeRequestData.expected_pickup_date}
                onChange={(e) =>
                  setRequestData((prev) => ({
                    ...prev,
                    expected_pickup_date: e.target.value,
                  }))
                }
                min={today}
                required
              />
              <label className="block text-sm font-medium mt-2 mb-2">
                Expected Pickup Time
              </label>
              <input
                type="time"
                name="expected_pickup_time"
                className="w-full border rounded-md p-2"
                value={safeRequestData.expected_pickup_time}
                onChange={(e) =>
                  setRequestData((prev) => ({
                    ...prev,
                    expected_pickup_time: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Expected Delivery Date
              </label>
              <input
                type="date"
                className="w-full border rounded-md p-2"
                value={safeRequestData.expected_delivery_date}
                onChange={(e) =>
                  setRequestData({
                    ...safeRequestData,
                    expected_delivery_date: e.target.value,
                  })
                }
                min={safeRequestData.expected_pickup_date || today}
                required
              />
              <label className="block text-sm font-medium mt-2 mb-2">
                Expected Delivery Time
              </label>
              <input
                type="time"
                name="expected_delivery_time"
                className="w-full border rounded-md p-2"
                value={safeRequestData.expected_delivery_time || ""}
                onChange={(e) =>
                  setRequestData({
                    ...safeRequestData,
                    expected_delivery_time: e.target.value,
                  })
                }
                required
              />
            </div>
          </div>

          {/* Form Buttons */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 ${
                isSubmitting ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
              } text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  {loadingButtonText}
                </>
              ) : (
                submitButtonText
              )}
            </button>

            {safeRequestData.id && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceRequestForm;