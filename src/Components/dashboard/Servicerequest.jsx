import React, { useState, useEffect } from "react";
import api from "../../utils/Api"; // Adjust the import path as necessary
import LocationSearchInput from "./LocationSearchInput";

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
        console.log("Customers API Response:", response.data); // Debug log
        setCustomers(response.data);
        setFilteredCustomers(response.data);
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
    if (searchTerm && customers.length > 0) {
      const filtered = customers.filter(
        (customer) =>
          customer.CustomerName?.toLowerCase().includes(
            searchTerm.toLowerCase()
          ) ||
          customer.GSTNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchTerm, customers]);

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    setSearchTerm(inputValue);
    onChange(inputValue);
    setIsOpen(true);
  };

  const handleCustomerSelect = (customer) => {
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
                GST: {customer.GSTNumber || "N/A"} | {customer.StateCode || "N/A"},{" "}
                {customer.Country || "N/A"}
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
  services = ["Transport", "Freight Forwarding", "Customer Clearance"],
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
    ...requestData // Override with actual values
  };

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
                    value={safeRequestData.containers_20ft}
                    onChange={(e) =>
                      setRequestData((prev) => ({
                        ...prev,
                        containers_20ft: Number(e.target.value) || 0,
                        total_containers:
                          (Number(e.target.value) || 0) + (Number(prev.containers_40ft) || 0),
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
                    value={safeRequestData.containers_40ft}
                    onChange={(e) =>
                      setRequestData((prev) => ({
                        ...prev,
                        containers_40ft: Number(e.target.value) || 0,
                        total_containers:
                          (Number(prev.containers_20ft) || 0) + (Number(e.target.value) || 0),
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
                  setRequestData({ ...safeRequestData, commodity: e.target.value })
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
                  setRequestData({ ...safeRequestData, cargo_type: e.target.value })
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
            <div>
              <label className="block text-sm font-medium mb-2">
                Services Required
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {services.map((service) => (
                  <div
                    key={service}
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                      safeRequestData.service_type.includes(service)
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    onClick={() => {
                      const isSelected =
                        safeRequestData.service_type.includes(service);
                      const updatedServices = isSelected
                        ? safeRequestData.service_type.filter((s) => s !== service)
                        : [...safeRequestData.service_type, service];

                      const updatedPrices = { ...safeRequestData.service_prices };
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
                        ...safeRequestData,
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
                        checked={safeRequestData.service_type.includes(service)}
                        onChange={() => {}}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="ml-2 font-medium">{service}</span>
                    </div>

                    {safeRequestData.service_type.includes(service) && (
                      <div className="mt-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">
                            Price (INR):
                          </span>
                          <input
                            type="number"
                            min="0"
                            className="w-32 border rounded-md p-1 text-sm"
                            value={safeRequestData.service_prices[service] || ""}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const updatedPrices = {
                                ...safeRequestData.service_prices,
                                [service]: e.target.value,
                              };
                              const total = Object.values(updatedPrices).reduce(
                                (sum, price) => sum + (Number(price) || 0),
                                0
                              );
                              setRequestData({
                                ...safeRequestData,
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

            {/* Total Sale Amount */}
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
                  value={safeRequestData.requested_price}
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
                value={safeRequestData.expected_pickup_date}
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
                value={safeRequestData.expected_delivery_date}
                onChange={(e) =>
                  setRequestData({
                    ...safeRequestData,
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