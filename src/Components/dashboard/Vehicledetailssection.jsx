import React from "react";

const VehicleDetailsSection = ({
  safeRequestData,
  setRequestData,
  createTransporterDetailsArray,
}) => {
  // Helper functions
  const shouldForceLoadedStatus = (vehicleType) => {
    const alwaysLoadedTypes = [
      "Tr-4",
      "Tr-5",
      "Tr-8",
      "Tr-9",
      "Single Car Carrier",
    ];
    return alwaysLoadedTypes.includes(vehicleType);
  };

  const shouldRestrictToSingleVehicle = (vehicleType) => {
    const singleVehicleTypes = [
      "Tr-4",
      "Tr-5",
      "Tr-8",
      "Tr-9",
      "Single Car Carrier",
    ];
    return singleVehicleTypes.includes(vehicleType);
  };

  const shouldShowContainerDetails = (vehicleType) => {
    return vehicleType === "Trailer";
  };

  const shouldShow40ftOption = (vehicleType) => {
    return vehicleType !== "Ven";
  };

  const currentNoOfVehicles = parseInt(safeRequestData.no_of_vehicles) || 1;
  const currentVehicleStatus = shouldForceLoadedStatus(
    safeRequestData.vehicle_type
  )
    ? "Loaded"
    : safeRequestData.vehicle_status;
  const isRestrictedToSingleVehicle = shouldRestrictToSingleVehicle(
    safeRequestData.vehicle_type
  );

  return (
    <>
      {/* Vehicle Type and Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="shipa_no" className="block text-sm font-medium mb-2">
            SHIPA NO
          </label>
          <input
            type="text"
            id="shipa_no"
            name="shipa_no"
            value={safeRequestData.SHIPA_NO || ""}
            onChange={(e) =>
              setRequestData((prev) => ({
                ...prev,
                SHIPA_NO: e.target.value,
              }))
            }
            className="w-full border rounded-md p-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Enter SHIPA NO (e.g., SHIP20250813001)"
            required={!safeRequestData.id} // Required for new requests, optional for updates
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Trip Type</label>
          <select
            name="vehicle_type"
            className="w-full border rounded-md p-2"
            value={safeRequestData.vehicle_type}
            onChange={(e) => {
              const newVehicleType = e.target.value;
              const newVehicleStatus = shouldForceLoadedStatus(newVehicleType)
                ? "Loaded"
                : "Empty";
              const newNoOfVehicles = shouldRestrictToSingleVehicle(
                newVehicleType
              )
                ? 1
                : safeRequestData.no_of_vehicles;

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
                containers_20ft: shouldShowContainerDetails(newVehicleType)
                  ? prev.containers_20ft
                  : 0,
                containers_40ft: shouldShowContainerDetails(newVehicleType)
                  ? prev.containers_40ft
                  : 0,
                total_containers: shouldShowContainerDetails(newVehicleType)
                  ? prev.total_containers
                  : 0,
                stuffing_location:
                  newVehicleStatus === "Loaded" ? prev.stuffing_location : "",
                commodity: newVehicleStatus === "Loaded" ? prev.commodity : "",
                cargo_type:
                  newVehicleStatus === "Loaded" ? prev.cargo_type : "",
                cargo_weight:
                  newVehicleStatus === "Loaded" ? prev.cargo_weight : 0,
              }));
            }}
            required
          >
            <option value="">Select Trip Type</option>
            <option value="Trailer">Container</option>
            <option value="Truck">Truck</option>
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
                  cargo_type: e.target.value === "Empty" ? "" : prev.cargo_type,
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

        {/* Vehicle Size Inputs */}
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
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                setRequestData((prev) => ({
                  ...prev,
                  no_of_vehicles: validValue,
                  transporterDetails: createTransporterDetailsArray(
                    validValue,
                    prev.transporterDetails || []
                  ),
                }));
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
      </div> */}

      {/* Container Selection */}
      {shouldShowContainerDetails(safeRequestData.vehicle_type) &&
        currentVehicleStatus === "Loaded" && (
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
    </>
  );
};

export default VehicleDetailsSection;
