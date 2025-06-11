import React, { useState, useEffect } from "react";
import { servicesAPI } from "../../utils/Api";
import api from "../../utils/Api";
import LocationSearchInput from "./LocationSearchInput";
import NewServiceModal from "./NewServiceModal";

const parsePrice = (value) => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

// Customer Selection Component
const CustomerSearchInput = ({ value, onChange, placeholder }) => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [loading, setLoading] = useState(false);

  // Fetch customers from API
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true); // Set loading to true BEFORE making the API call

      try {
        const response = await api.get("/customers/customers");

        // Check if response exists and has valid data
        if (response?.data) {
          try {
            // If data is a string, try to parse it
            const customerData =
              typeof response.data === "string"
                ? JSON.parse(response.data)
                : response.data;

            // Validate that we have an array
            const validCustomers = Array.isArray(customerData)
              ? customerData
              : [];

            setCustomers(validCustomers);
            setFilteredCustomers(validCustomers);
          } catch (parseError) {
            console.error("Error parsing customer data:", parseError);
            setCustomers([]);
            setFilteredCustomers([]);
          }
        } else {
          console.warn("Invalid or missing customer data in response");
          setCustomers([]);
          setFilteredCustomers([]);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
        setCustomers([]);
        setFilteredCustomers([]);
      } finally {
        setLoading(false); // Set loading to false after API call completes
      }
    };

    fetchCustomers();
  }, []);

  // Update searchTerm when value prop changes (for editing scenarios)
  useEffect(() => {
    setSearchTerm(value || "");
  }, [value]);

  // Filter customers based on search term
  useEffect(() => {
    if (searchTerm && Array.isArray(customers) && customers.length > 0) {
      const filtered = customers.filter(
        (customer) =>
          (customer?.CustomerName || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (customer?.GSTNumber || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers || []);
    }
  }, [searchTerm, customers]);

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    setSearchTerm(inputValue);
    onChange(inputValue);
    setIsOpen(true);
  };

  const handleCustomerSelect = (customer) => {
    if (!customer) {
      console.warn("No customer data provided");
      return;
    }

    const customerName = customer.CustomerName || "";
    setSearchTerm(customerName);
    onChange(customerName);
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    // Delay closing to allow for selection
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div className="relative">
      <input
        type="text"
        className="w-full border rounded-md p-2"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        required
      />

      {loading && (
        <div className="absolute right-2 top-2">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {isOpen && filteredCustomers.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.Id || customer.id}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => handleCustomerSelect(customer)}
            >
              <div className="font-medium text-gray-900">
                {customer.CustomerName || "Unknown Customer"}
              </div>
              <div className="text-sm text-gray-500">
                GST: {customer.GSTNumber || "N/A"} |{" "}
                {customer.StateCode || "N/A"}, {customer.Country || "N/A"}
              </div>
              <div className="text-xs text-gray-400">
                {customer.BillingAddress || "No address available"}
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && filteredCustomers.length === 0 && !loading && searchTerm && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="px-3 py-2 text-gray-500 text-sm">
            No customers found matching "{searchTerm}"
          </div>
        </div>
      )}
    </div>
  );
};

const ServiceRequestForm = ({
  requestData,
  setRequestData,
  handleSubmit,
  isSubmitting,
  handleCancelEdit,
}) => {
  const submitButtonText = requestData.id ? "Update Request" : "Submit Request";
  const loadingButtonText = requestData.id ? "Updating..." : "Submitting...";

  // Initialize default values if requestData is empty
  const safeRequestData = {
    id: "",
    consignee: "",
    consigner: "",
    vehicle_type: "",
    vehicle_size: "",
    trailerSize: "",
    truckSize: "",
    no_of_vehicles: 1, // Default to 1
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
    expected_pickup_date: "",
    expected_delivery_date: "",
    transporterDetails: [], // Add this array to store multiple transporter details
    ...requestData, // Override with actual values if they exist
  };

  // Ensure no_of_vehicles is properly parsed and has a valid value
  const currentNoOfVehicles = parseInt(safeRequestData.no_of_vehicles) || 1;

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

  // Add state for services
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState(false);

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

  // Add handler for new service that includes refetching
  const handleServiceAdded = async (newService) => {
    await fetchServices(); // Refresh the services list
  };

  useEffect(() => {
    fetchServices();
  }, []);

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
                Vehicle Type
              </label>
              <select
                name="vehicle_type"
                className="w-full border rounded-md p-2"
                value={safeRequestData.vehicle_type}
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
              <input
                type="number"
                min="1"
                max="50"
                className="w-full border rounded-md p-2"
                value={currentNoOfVehicles}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value) || 1;
                  const validValue = Math.max(1, Math.min(50, newValue)); // Ensure value is between 1 and 50

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
              </div>
            </div>
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

          {/* Locations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              />
            </div>
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
              />
            </div>
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
                    cargo_weight: Number(e.target.value) || 0,
                  }))
                }
                required
              />
            </div>
          </div>

          {/* Services Required */}
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium">
                Services Required
              </label>
              <button
                type="button"
                onClick={() => setIsNewServiceModalOpen(true)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add New Service
              </button>
            </div>
            {loadingServices ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {services.map((service) => (
                  <div
                    key={service.SERVICE_ID}
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                      safeRequestData.service_type.includes(
                        service.SERVICE_NAME
                      )
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    onClick={() => {
                      const isSelected = safeRequestData.service_type.includes(
                        service.SERVICE_NAME
                      );
                      const updatedServices = isSelected
                        ? safeRequestData.service_type.filter(
                            (s) => s !== service.SERVICE_NAME
                          )
                        : [
                            ...safeRequestData.service_type,
                            service.SERVICE_NAME,
                          ];

                      const updatedPrices = {
                        ...safeRequestData.service_prices,
                      };
                      if (isSelected) {
                        delete updatedPrices[service.SERVICE_NAME];
                      } else {
                        updatedPrices[service.SERVICE_NAME] = "0";
                      }

                      setRequestData({
                        ...safeRequestData,
                        service_type: updatedServices,
                        service_prices: updatedPrices,
                      });
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          checked={safeRequestData.service_type.includes(
                            service.SERVICE_NAME
                          )}
                          onChange={() => {}}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="ml-2 font-medium">
                          {service.SERVICE_NAME}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {service.SERVICE_CODE}
                      </span>
                    </div>

                    {safeRequestData.service_type.includes(
                      service.SERVICE_NAME
                    ) && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-500">
                          Unit: {service.UNIT}
                          {service.TAX_ON_PERCENTAGE > 0 && (
                            <span className="ml-2">
                              Tax: {service.TAX_ON_PERCENTAGE}%
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total Sale Amount */}

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
                value={safeRequestData.expected_pickup_date}
                onChange={(e) =>
                  setRequestData((prev) => ({
                    ...prev,
                    expected_pickup_date: e.target.value,
                  }))
                }
                min={new Date().toISOString().split("T")[0]}
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
                min={
                  safeRequestData.expected_pickup_date ||
                  new Date().toISOString().split("T")[0]
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

        {/* New Service Modal */}
        <NewServiceModal
          isOpen={isNewServiceModalOpen}
          onClose={() => setIsNewServiceModalOpen(false)}
          onServiceAdded={handleServiceAdded}
        />
      </div>
    </div>
  );
};

export default ServiceRequestForm;
