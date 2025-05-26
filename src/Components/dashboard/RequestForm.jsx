import React, { useState, useEffect } from "react";
import { Autocomplete } from "@react-google-maps/api";
import { toast } from "react-toastify";
import api from "../../utils/Api";

const RequestForm = ({ 
  isLoaded, 
  initialData = null, 
  onSubmitSuccess, 
  isEditing = false 
}) => {
  const vehicleTypes = ["Truck", "Trailer"];
  const trailerSizes = ["20 feet", "40 feet"];
  const services = ["Transport", "Freight Forwarding", "Customer Clearance"];
  
  const [requestData, setRequestData] = useState({
    consignee: "",
    consigner: "",
    vehicleType: "",
    trailerSize: "",
    containerCount: 1,
    containerSize: "",
    pickupLocation: "",
    stuffingLocation: "",
    handoverLocation: "",
    commodity: "",
    cargoType: "",
    cargoWeight: "",
    serviceType: [],
    servicePrices: {},
    expectedPickupDate: "",
    expectedDeliveryDate: "",
    saleAmount: 0,
    containers: {
      "20ft": "",
      "40ft": "",
    },
    truckSize: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pickupAutocomplete, setPickupAutocomplete] = useState(null);
  const [deliveryAutocomplete, setDeliveryAutocomplete] = useState(null);

  // If editing, populate form with initial data
  useEffect(() => {
    if (initialData) {
      // Parse service type if it's a string
      let serviceType = initialData.serviceType || [];
      try {
        if (typeof initialData.serviceType === 'string') {
          serviceType = JSON.parse(initialData.serviceType);
        }
      } catch (error) {
        console.error("Error parsing service type:", error);
        serviceType = [];
      }
      
      setRequestData({
        id: initialData.id,
        consignee: initialData.consignee || "",
        consigner: initialData.consigner || "",
        vehicleType: initialData.vehicleType || "",
        trailerSize: initialData.trailerSize || "",
        containerCount: initialData.containerCount || 1,
        containerSize: initialData.containerSize || "",
        pickupLocation: initialData.pickupLocation || "",
        stuffingLocation: initialData.stuffingLocation || "",
        handoverLocation: initialData.handoverLocation || "",
        commodity: initialData.commodity || "",
        cargoType: initialData.cargoType || "",
        cargoWeight: initialData.cargoWeight || "",
        serviceType: Array.isArray(serviceType) ? serviceType : [serviceType],
        servicePrices: initialData.servicePrices || {},
        expectedPickupDate: initialData.expectedPickupDate || "",
        expectedDeliveryDate: initialData.expectedDeliveryDate || "",
        saleAmount: initialData.saleAmount || 0,
        containers: initialData.containers || {
          "20ft": "",
          "40ft": "",
        },
        truckSize: initialData.truckSize || "",
      });
    }
  }, [initialData]);

  const onPickupLoad = (autocomplete) => {
    setPickupAutocomplete(autocomplete);
  };

  const onDeliveryLoad = (autocomplete) => {
    setDeliveryAutocomplete(autocomplete);
  };

  const onPickupPlaceSelected = () => {
    const place = pickupAutocomplete.getPlace();
    if (place.formatted_address) {
      setRequestData((prev) => ({
        ...prev,
        pickupLocation: place.formatted_address,
      }));
    }
  };

  const onDeliveryPlaceSelected = () => {
    const place = deliveryAutocomplete.getPlace();
    if (place.formatted_address) {
      setRequestData((prev) => ({
        ...prev,
        handoverLocation: place.formatted_address,
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setRequestData((prev) => {
        const updatedServices = checked
          ? [...prev.serviceType, value]
          : prev.serviceType.filter((service) => service !== value);

        return { ...prev, serviceType: updatedServices };
      });
    } else {
      setRequestData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      const requiredFields = [
        { field: "vehicleType", label: "Vehicle Type" },
        { field: "pickupLocation", label: "Pickup Location" },
        { field: "handoverLocation", label: "Delivery Location" },
        { field: "consignee", label: "Consignee" },
        { field: "consigner", label: "Consigner" },
        { field: "serviceType", label: "Service Type" },
      ];

      const missingFields = requiredFields.filter(({ field }) => {
        if (field === "serviceType") {
          return !requestData[field] || requestData[field].length === 0;
        }
        return !requestData[field] || requestData[field].trim?.() === "";
      });

      if (missingFields.length > 0) {
        const missingFieldNames = missingFields.map((f) => f.label).join(", ");
        toast.error(`Please fill in all required fields: ${missingFieldNames}`);
        setIsSubmitting(false);
        return;
      }

      // Prepare data for submission with proper field names matching the database
      const formData = {
        // Basic information
        consignee: requestData.consignee,
        consigner: requestData.consigner,
        
        // Vehicle information
        vehicle_type: requestData.vehicleType,
        vehicle_size: requestData.vehicleType === "Truck" 
          ? requestData.truckSize 
          : requestData.trailerSize,
        
        // Container information
        containers: JSON.stringify({
          "20ft": Number(requestData.containers["20ft"] || 0),
          "40ft": Number(requestData.containers["40ft"] || 0),
        }),
        containers_20ft: Number(requestData.containers["20ft"] || 0),
        containers_40ft: Number(requestData.containers["40ft"] || 0),
        total_containers: Number(requestData.containers["20ft"] || 0) + 
                          Number(requestData.containers["40ft"] || 0),
        
        // Location information
        pickup_location: requestData.pickupLocation,
        stuffing_location: requestData.stuffingLocation || '',
        delivery_location: requestData.handoverLocation,
        
        // Cargo information
        commodity: requestData.commodity || '',
        cargo_type: requestData.cargoType || '',
        cargo_weight: requestData.cargoWeight || 0,
        
        // Service information
        service_type: JSON.stringify(
          requestData.serviceType.length > 0 ? requestData.serviceType : ["Transport"]
        ),
        service_prices: JSON.stringify(requestData.servicePrices || {}),
        
        // Date information
        expected_pickup_date: requestData.expectedPickupDate,
        expected_delivery_date: requestData.expectedDeliveryDate,
        
        // Price information
        requested_price: requestData.saleAmount || 0,
        
        // Status (for new requests)
        status: "Pending"
      };

      let response;
      
      if (isEditing && requestData.id) {
        // Update existing request
        response = await api.put(`/transport-requests/update/${requestData.id}`, formData);
      } else {
        // Create new request
        response = await api.post("/transport-requests/create", formData);
      }

      if (response.data.success) {
        toast.success(isEditing 
          ? "Transport request updated successfully!" 
          : "Transport request submitted successfully!");
        
        // Reset form or call success callback
        if (onSubmitSuccess) {
          onSubmitSuccess(response.data.request);
        }
        
        if (!isEditing) {
          // Only reset form for new requests
          setRequestData({
            consignee: "",
            consigner: "",
            vehicleType: "",
            trailerSize: "",
            containerCount: 1,
            containerSize: "",
            pickupLocation: "",
            stuffingLocation: "",
            handoverLocation: "",
            commodity: "",
            cargoType: "",
            cargoWeight: "",
            serviceType: [],
            servicePrices: {},
            expectedPickupDate: "",
            expectedDeliveryDate: "",
            saleAmount: 0,
            containers: {
              "20ft": "",
              "40ft": "",
            },
            truckSize: "",
          });
        }
      }
    } catch (error) {
      console.error("Submit error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error(error.response?.data?.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2 bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          {isEditing ? "Edit Request" : "Request New Service"}
        </h3>
      </div>
      <div className="p-6">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white p-6 rounded-lg shadow"
        >
          {/* Consignee and Consigner Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Consignee
              </label>
              <input
                type="text"
                name="consignee"
                className="w-full border rounded-md p-2"
                value={requestData.consignee}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Consigner
              </label>
              <input
                type="text"
                name="consigner"
                className="w-full border rounded-md p-2"
                value={requestData.consigner}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Vehicle Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Vehicle Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {vehicleTypes.map((type) => (
                <div
                  key={type}
                  className={`
                    border rounded-lg p-3 cursor-pointer transition-all
                    ${
                      requestData.vehicleType === type
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "border-gray-300 hover:border-gray-400"
                    }
                  `}
                  onClick={() =>
                    setRequestData((prev) => ({
                      ...prev,
                      vehicleType: type,
                    }))
                  }
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="vehicleType"
                      value={type}
                      checked={requestData.vehicleType === type}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 font-medium">{type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conditional fields based on vehicle type */}
          {requestData.vehicleType === "Truck" && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Truck Size
              </label>
              <input
                type="text"
                name="truckSize"
                className="w-full border rounded-md p-2"
                value={requestData.truckSize}
                onChange={handleChange}
                placeholder="e.g., 10 ton"
              />
            </div>
          )}

          {requestData.vehicleType === "Trailer" && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Trailer Size
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {trailerSizes.map((size) => (
                  <div
                    key={size}
                    className={`
                      border rounded-lg p-3 cursor-pointer transition-all
                      ${
                        requestData.trailerSize === size
                          ? "bg-blue-50 border-blue-500 text-blue-700"
                          : "border-gray-300 hover:border-gray-400"
                      }
                    `}
                    onClick={() =>
                      setRequestData((prev) => ({
                        ...prev,
                        trailerSize: size,
                      }))
                    }
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="trailerSize"
                        value={size}
                        checked={requestData.trailerSize === size}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 font-medium">{size}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Locations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Pickup Location
              </label>
              <Autocomplete
                onLoad={onPickupLoad}
                onPlaceChanged={onPickupPlaceSelected}
              >
                <input
                  type="text"
                  name="pickupLocation"
                  className="w-full border rounded-md p-2"
                  value={requestData.pickupLocation}
                  onChange={handleChange}
                  placeholder="Enter pickup location"
                  required
                />
              </Autocomplete>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Delivery Location
              </label>
              <Autocomplete
                onLoad={onDeliveryLoad}
                onPlaceChanged={onDeliveryPlaceSelected}
              >
                <input
                  type="text"
                  name="handoverLocation"
                  className="w-full border rounded-md p-2"
                  value={requestData.handoverLocation}
                  onChange={handleChange}
                  placeholder="Enter delivery location"
                  required
                />
              </Autocomplete>
            </div>
          </div>

          {/* Service Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Services Required
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {services.map((service) => (
                <div
                  key={service}
                  className={`
                    border rounded-lg p-3 cursor-pointer transition-all
                    ${
                      requestData.serviceType.includes(service)
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "border-gray-300 hover:border-gray-400"
                    }
                  `}
                  onClick={() => {
                    const newServices = requestData.serviceType.includes(service)
                      ? requestData.serviceType.filter((s) => s !== service)
                      : [...requestData.serviceType, service];

                    setRequestData((prev) => ({
                      ...prev,
                      serviceType: newServices,
                    }));
                  }}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="serviceType"
                      value={service}
                      checked={requestData.serviceType.includes(service)}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 font-medium">{service}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className={`
                px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}
              `}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Processing...
                </span>
              ) : isEditing ? (
                "Update Request"
              ) : (
                "Submit Request"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestForm;