import React from "react";
import LocationSearchInput from "./LocationSearchInput";

const ServiceRequestForm = ({
  requestData,
  setRequestData,
  handleSubmit,
  isSubmitting,
  handleCancelEdit,
  services = ["Transport", "Freight Forwarding", "Customer Clearance"],
}) => {
  const submitButtonText = requestData.id ? "Update Request" : "Submit Request";
  const loadingButtonText = requestData.id ? "Updating..." : "Submitting...";

  return (
    <div className="lg:col-span-2 bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Request New Journey
        </h3>
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
              <input
                type="text"
                className="w-full border rounded-md p-2"
                value={requestData.consignee}
                onChange={(e) =>
                  setRequestData({ ...requestData, consignee: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Consigner
              </label>
              <input
                type="text"
                className="w-full border rounded-md p-2"
                value={requestData.consigner}
                onChange={(e) =>
                  setRequestData({ ...requestData, consigner: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Vehicle Type
              </label>
              <select
                name="vehicle_type"
                className="w-full border rounded-md p-2"
                value={requestData.vehicle_type}
                onChange={(e) =>
                  setRequestData((prev) => ({
                    ...prev,
                    vehicle_type: e.target.value,
                    vehicle_size: "",
                    trailerSize: "",
                    truckSize: "",
                  }))
                }
                required
              >
                <option value="">Select Vehicle Type</option>
                <option value="Trailer">Trailer</option>
                <option value="Truck">Truck</option>
              </select>
            </div>

            {requestData.vehicle_type === "Trailer" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Trailer Size (in feet)
                </label>
                <input
                  type="text"
                  className="w-full border rounded-md p-2"
                  placeholder="Enter trailer size (e.g., 40)"
                  value={requestData.trailerSize}
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

            {requestData.vehicle_type === "Truck" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Truck Size (in feet)
                </label>
                <input
                  type="text"
                  className="w-full border rounded-md p-2"
                  placeholder="Enter truck size (e.g., 24)"
                  value={requestData.vehicle_size}
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

          {/* Container Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-medium mb-2">
              Container Details
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="space-y-2">
                  <label className="text-sm font-medium block">
                    20 feet Containers
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border rounded-md p-2"
                    placeholder="Enter number of 20ft containers"
                    value={requestData.containers_20ft}
                    onChange={(e) =>
                      setRequestData((prev) => ({
                        ...prev,
                        containers_20ft: Number(e.target.value),
                        total_containers:
                          Number(e.target.value) + Number(prev.containers_40ft),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="space-y-2">
                  <label className="text-sm font-medium block">
                    40 feet Containers
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border rounded-md p-2"
                    placeholder="Enter number of 40ft containers"
                    value={requestData.containers_40ft}
                    onChange={(e) =>
                      setRequestData((prev) => ({
                        ...prev,
                        containers_40ft: Number(e.target.value),
                        total_containers:
                          Number(prev.containers_20ft) + Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="mt-2 text-sm text-gray-600">
              Total Containers: {requestData.total_containers}
              {(requestData.containers_20ft > 0 ||
                requestData.containers_40ft > 0) && (
                <span className="ml-2">
                  (
                  {requestData.containers_20ft > 0
                    ? `${requestData.containers_20ft} × 20ft`
                    : ""}
                  {requestData.containers_20ft > 0 &&
                  requestData.containers_40ft > 0
                    ? ", "
                    : ""}
                  {requestData.containers_40ft > 0
                    ? `${requestData.containers_40ft} × 40ft`
                    : ""}
                  )
                </span>
              )}
            </div>
          </div>

          {/* Locations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Pickup Location
              </label>
              <LocationSearchInput
                value={requestData.pickup_location}
                onChange={(value) =>
                  setRequestData((prev) => ({
                    ...prev,
                    pickup_location: value,
                  }))
                }
                placeholder="Enter pickup location"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Stuffing Location
              </label>
              <LocationSearchInput
                value={requestData.stuffing_location}
                onChange={(value) =>
                  setRequestData((prev) => ({
                    ...prev,
                    stuffing_location: value,
                  }))
                }
                placeholder="Enter stuffing location"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Delivery Location
              </label>
              <LocationSearchInput
                value={requestData.delivery_location}
                onChange={(value) =>
                  setRequestData((prev) => ({
                    ...prev,
                    delivery_location: value,
                  }))
                }
                placeholder="Enter delivery location"
              />
            </div>
          </div>

          {/* Cargo Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Commodity/Cargo
              </label>
              <input
                type="text"
                className="w-full border rounded-md p-2"
                value={requestData.commodity}
                onChange={(e) =>
                  setRequestData({ ...requestData, commodity: e.target.value })
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
                value={requestData.cargo_type}
                onChange={(e) =>
                  setRequestData({ ...requestData, cargo_type: e.target.value })
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
                Cargo Weight (KG)
              </label>
              <input
                type="number"
                name="cargo_weight"
                className="w-full border rounded-md p-2"
                value={requestData.cargo_weight}
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

          {/* Services Required */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Services Required
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {services.map((service) => (
                  <div
                    key={service}
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                      requestData.service_type.includes(service)
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    onClick={() => {
                      const isSelected =
                        requestData.service_type.includes(service);
                      const updatedServices = isSelected
                        ? requestData.service_type.filter((s) => s !== service)
                        : [...requestData.service_type, service];

                      const updatedPrices = { ...requestData.service_prices };
                      if (isSelected) {
                        delete updatedPrices[service];
                      } else {
                        updatedPrices[service] = "0";
                      }

                      const total = Object.values(updatedPrices).reduce(
                        (sum, price) => sum + (Number(price) || 0),
                        0
                      );

                      setRequestData({
                        ...requestData,
                        service_type: updatedServices,
                        service_prices: updatedPrices,
                        requested_price: total,
                      });
                    }}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={requestData.service_type.includes(service)}
                        onChange={() => {}}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="ml-2 font-medium">{service}</span>
                    </div>

                    {requestData.service_type.includes(service) && (
                      <div className="mt-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">
                            Price (INR):
                          </span>
                          <input
                            type="number"
                            min="0"
                            className="w-32 border rounded-md p-1 text-sm"
                            value={requestData.service_prices[service] || ""}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const updatedPrices = {
                                ...requestData.service_prices,
                                [service]: e.target.value,
                              };
                              const total = Object.values(updatedPrices).reduce(
                                (sum, price) => sum + (Number(price) || 0),
                                0
                              );
                              setRequestData({
                                ...requestData,
                                service_prices: updatedPrices,
                                requested_price: total,
                              });
                            }}
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Total Sale Amount - Updated to match backend expected field */}
            <div className="mt-6">
              <label className="block text-md font-medium mb-2">
                Total Amount
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">Rs</span>
                </div>
                <input
                  type="number"
                  name="requested_price"
                  value={requestData.requested_price}
                  onChange={(e) =>
                    setRequestData((prev) => ({
                      ...prev,
                      requested_price: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder="0.00"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">INR</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Expected Pickup Date
              </label>
              <input
                type="date"
                name="expected_pickup_date"
                className="w-full border rounded-md p-2"
                value={requestData.expected_pickup_date}
                onChange={(e) =>
                  setRequestData((prev) => ({
                    ...prev,
                    expected_pickup_date: e.target.value,
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
                value={requestData.expected_delivery_date}
                onChange={(e) =>
                  setRequestData({
                    ...requestData,
                    expected_delivery_date: e.target.value,
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

            {requestData.id && (
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
