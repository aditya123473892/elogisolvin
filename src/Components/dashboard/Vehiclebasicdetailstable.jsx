import React from "react";
import { useState, useEffect } from "react";
import { transporterAPI, transporterListAPI } from "../../utils/Api";
const TransporterSearchInput = ({ value, onChange, placeholder }) => {
  const [transporters, setTransporters] = useState([]);
  const [filteredTransporters, setFilteredTransporters] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [loading, setLoading] = useState(false);

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
        className="w-full min-w-[160px] border border-gray-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

// Add this validation function at the component level
const VehicleBasicDetailsTable = ({ vehicleDataList, updateVehicleData }) => {
  // Add validation function
  const validateVehicleData = (field, value) => {
    switch (field) {
      case "vehicleNumber":
        // Format: MH01AB1234 (2 letters + 2 digits + 1-2 letters + 4 digits)
        return /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/.test(value);
      case "driverName":
        // At least 3 characters, letters, spaces and dots only
        return value.length >= 3 && /^[A-Za-z.\s]+$/.test(value);
      case "driverContact":
        // Exactly 10 digits
        return /^\d{10}$/.test(value);
      case "licenseNumber":
        // Alphanumeric, at least 5 characters
        return value.length >= 5 && /^[A-Z0-9]+$/.test(value);
      case "licenseExpiry":
        // Must be a future date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiryDate = new Date(value);
        return expiryDate >= today;
      default:
        return true;
    }
  };

  // Add state to track validation errors
  const [validationErrors, setValidationErrors] = useState({});

  // Handle input change with validation
  const handleInputChange = (index, field, value) => {
    // Update the data
    updateVehicleData(index, field, value);
    
    // Validate and update errors
    const isValid = validateVehicleData(field, value);
    setValidationErrors(prev => ({
      ...prev,
      [`${index}-${field}`]: isValid ? null : `Invalid ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`
    }));
  };

  return (
    <div>
      <h4 className="text-lg font-medium text-gray-900 mb-4">
        Vehicle & Driver Information
        <span className="text-sm font-normal text-gray-500 ml-2">
          (All fields marked with * are required)
        </span>
      </h4>
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Vehicle #
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">
                Transporter Name *
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                Vehicle Number *
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                Driver Name *
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[160px]">
                Driver Contact *
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[160px]">
                License Number *
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[160px]">
                License Expiry *
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vehicleDataList.map((vehicle, index) => (
              <tr key={`vehicle-${index}`} className="hover:bg-gray-50">
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                  <div className="flex items-center justify-center">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                      {vehicle.vehicleIndex}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <TransporterSearchInput
                    value={vehicle.transporterName}
                    onChange={(value) =>
                      updateVehicleData(index, "transporterName", value)
                    }
                    placeholder="Search and select transporter"
                  />
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div>
                    <input
                      type="text"
                      className={`w-full min-w-[140px] border ${validationErrors[`${index}-vehicleNumber`] ? 'border-red-500' : 'border-gray-300'} rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      value={vehicle.vehicleNumber}
                      onChange={(e) =>
                        handleInputChange(
                          index,
                          "vehicleNumber",
                          e.target.value.toUpperCase()
                        )
                      }
                      placeholder="e.g., MH01AB1234"
                      pattern="[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}"
                      title="Vehicle number must be in format like MH01AB1234"
                      required
                    />
                    {validationErrors[`${index}-vehicleNumber`] && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors[`${index}-vehicleNumber`]}</p>
                    )}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div>
                    <input
                      type="text"
                      className={`w-full min-w-[140px] border ${validationErrors[`${index}-driverName`] ? 'border-red-500' : 'border-gray-300'} rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      value={vehicle.driverName}
                      onChange={(e) =>
                        handleInputChange(index, "driverName", e.target.value)
                      }
                      placeholder="Driver full name"
                      pattern="[A-Za-z.\s]{3,}"
                      title="Driver name must contain at least 3 characters, letters only"
                      required
                    />
                    {validationErrors[`${index}-driverName`] && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors[`${index}-driverName`]}</p>
                    )}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div>
                    <input
                      type="tel"
                      className={`w-full min-w-[160px] border ${validationErrors[`${index}-driverContact`] ? 'border-red-500' : 'border-gray-300'} rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      value={vehicle.driverContact}
                      onChange={(e) =>
                        handleInputChange(
                          index,
                          "driverContact",
                          e.target.value.replace(/\D/g, "").slice(0, 10)
                        )
                      }
                      placeholder="10-digit mobile number"
                      pattern="\d{10}"
                      title="Driver contact must be exactly 10 digits"
                      maxLength="10"
                      required
                    />
                    {validationErrors[`${index}-driverContact`] && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors[`${index}-driverContact`]}</p>
                    )}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div>
                    <input
                      type="text"
                      className={`w-full min-w-[160px] border ${validationErrors[`${index}-licenseNumber`] ? 'border-red-500' : 'border-gray-300'} rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      value={vehicle.licenseNumber}
                      onChange={(e) =>
                        handleInputChange(
                          index,
                          "licenseNumber",
                          e.target.value.toUpperCase()
                        )
                      }
                      placeholder="License number"
                      pattern="[A-Z0-9]{5,}"
                      title="License number must be at least 5 alphanumeric characters"
                      required
                    />
                    {validationErrors[`${index}-licenseNumber`] && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors[`${index}-licenseNumber`]}</p>
                    )}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div>
                    <input
                      type="date"
                      className={`w-full min-w-[160px] border ${validationErrors[`${index}-licenseExpiry`] ? 'border-red-500' : 'border-gray-300'} rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      value={vehicle.licenseExpiry}
                      onChange={(e) =>
                        handleInputChange(index, "licenseExpiry", e.target.value)
                      }
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                    {validationErrors[`${index}-licenseExpiry`] && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors[`${index}-licenseExpiry`]}</p>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VehicleBasicDetailsTable;
