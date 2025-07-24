import React from "react";
import { useState, useEffect, useRef } from "react";
import { driverAPI, vendorAPI } from "../../utils/Api";

const VendorSearchInput = ({ value, onChange, placeholder }) => {
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [loading, setLoading] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState('bottom');
  
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      try {
        const response = await vendorAPI.getAllVendors();
        const vendorsData = response.data || response || [];
        if (Array.isArray(vendorsData)) {
          setVendors(vendorsData);
          setFilteredVendors(vendorsData);
        }
      } catch (error) {
        console.error("Error fetching vendors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, []);

  useEffect(() => {
    if (searchTerm && vendors.length > 0) {
      const filtered = vendors.filter((v) =>
        v.VENDOR_NAME.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredVendors(filtered);
    } else {
      setFilteredVendors(vendors);
    }
  }, [searchTerm, vendors]);

  useEffect(() => {
    setSearchTerm(value || "");
  }, [value]);

  // Simple dropdown position calculation
  const calculateDropdownPosition = () => {
    if (!inputRef.current) return;
    
    const inputRect = inputRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 200; // Fixed smaller height
    
    const spaceBelow = viewportHeight - inputRect.bottom;
    const spaceAbove = inputRect.top;
    
    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      setDropdownPosition('top');
    } else {
      setDropdownPosition('bottom');
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
    // Delay calculation to ensure filteredVendors is updated
    setTimeout(calculateDropdownPosition, 0);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        calculateDropdownPosition();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', calculateDropdownPosition, true);
      window.addEventListener('resize', calculateDropdownPosition);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', calculateDropdownPosition, true);
      window.removeEventListener('resize', calculateDropdownPosition);
    };
  }, [isOpen, filteredVendors.length]);

  // Simple dropdown position styles
  const getDropdownStyles = () => {
    if (!inputRef.current || !isOpen) return { display: 'none' };
    
    const inputRect = inputRef.current.getBoundingClientRect();
    
    const styles = {
      width: `${Math.max(inputRect.width, 200)}px`,
      maxHeight: '200px', // Fixed height
      zIndex: 9999,
    };

    if (dropdownPosition === 'top') {
      styles.bottom = `${window.innerHeight - inputRect.top + 4}px`;
      styles.left = `${inputRect.left}px`;
    } else {
      styles.top = `${inputRect.bottom + 4}px`;
      styles.left = `${inputRect.left}px`;
    }

    return styles;
  };

  return (
    <>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className="w-full min-w-[160px] border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={handleFocus}
          placeholder={placeholder}
          required
          autoComplete="off"
        />

        {loading && (
          <div className="absolute right-2 top-2">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Improved dropdown with constrained dimensions */}
      {isOpen && filteredVendors.length > 0 && (
        <div 
          ref={dropdownRef} 
          className="fixed bg-white border border-gray-300 rounded-md shadow-lg overflow-y-auto"
          style={getDropdownStyles()}
        >
          {filteredVendors.map((vendor) => (
            <div
              key={vendor.VENDOR_ID}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => {
                setSearchTerm(vendor.VENDOR_NAME);
                onChange(vendor.VENDOR_NAME);
                setIsOpen(false);
              }}
            >
              <div className="font-medium text-gray-900 truncate">
                {vendor.VENDOR_NAME}
              </div>
              <div className="text-sm text-gray-500 truncate">
                {vendor.VENDOR_CODE || "No code"} | {vendor.CITY || vendor.ADDRESS || "No location"}
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && filteredVendors.length === 0 && searchTerm && (
        <div 
          ref={dropdownRef} 
          className="fixed bg-white border border-gray-300 rounded-md shadow-lg"
          style={getDropdownStyles()}
        >
          <div className="px-3 py-2 text-gray-500 text-sm">
            No vendors found matching "{searchTerm}"
          </div>
        </div>
      )}
    </>
  );
};

const DriverSearchInput = ({ value, onChange, vendorName, placeholder }) => {
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [loading, setLoading] = useState(false);
  const [vendorId, setVendorId] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState('bottom');
  
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // First effect to get vendor ID when vendor name changes
  useEffect(() => {
    const getVendorId = async () => {
      if (!vendorName) {
        setVendorId(null);
        return;
      }
      
      try {
        console.log("Fetching vendors for name:", vendorName);
        const vendorsResponse = await vendorAPI.getAllVendors();
        const vendors = vendorsResponse.data || vendorsResponse || [];
        console.log("All vendors:", vendors);
        const vendor = vendors.find(v => v.VENDOR_NAME === vendorName);
        
        if (vendor) {
          console.log("Found vendor:", vendor);
          setVendorId(vendor.VENDOR_ID);
        } else {
          console.log("No vendor found with name:", vendorName);
          setVendorId(null);
        }
      } catch (error) {
        console.error("Error fetching vendor ID:", error);
        setVendorId(null);
      }
    };
  
    getVendorId();
  }, [vendorName]);
  
  // Second effect to fetch drivers when vendor ID changes
  useEffect(() => {
    const fetchDrivers = async () => {
      if (!vendorId) {
        console.log("No vendor ID, clearing drivers");
        setDrivers([]);
        setFilteredDrivers([]);
        return;
      }
  
      setLoading(true);
      try {
        console.log("Fetching drivers for vendor ID:", vendorId);
        const driversResponse = await driverAPI.getDriversByVendorId(vendorId);
        console.log("Drivers response:", driversResponse);
        const driversData = driversResponse.data || driversResponse || [];
        console.log("Drivers data:", driversData);
        setDrivers(driversData);
        setFilteredDrivers(driversData);
      } catch (error) {
        console.error("Error fetching drivers:", error);
        setDrivers([]);
        setFilteredDrivers([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchDrivers();
  }, [vendorId]);

  useEffect(() => {
    if (searchTerm && drivers.length > 0) {
      const filtered = drivers.filter((d) =>
        d.DRIVER_NAME.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDrivers(filtered);
    } else {
      setFilteredDrivers(drivers);
    }
  }, [searchTerm, drivers]);

  useEffect(() => {
    setSearchTerm(value || "");
  }, [value]);

  // Simple dropdown position calculation
  const calculateDropdownPosition = () => {
    if (!inputRef.current) return;
    
    const inputRect = inputRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 200; // Fixed smaller height
    
    const spaceBelow = viewportHeight - inputRect.bottom;
    const spaceAbove = inputRect.top;
    
    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      setDropdownPosition('top');
    } else {
      setDropdownPosition('bottom');
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
    setTimeout(calculateDropdownPosition, 0);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', calculateDropdownPosition, true);
      window.addEventListener('resize', calculateDropdownPosition);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', calculateDropdownPosition, true);
      window.removeEventListener('resize', calculateDropdownPosition);
    };
  }, [isOpen, filteredDrivers.length]);

  // Simple dropdown position styles
  const getDropdownStyles = () => {
    if (!inputRef.current || !isOpen) return { display: 'none' };
    
    const inputRect = inputRef.current.getBoundingClientRect();
    
    const styles = {
      width: `${Math.max(inputRect.width, 200)}px`,
      maxHeight: '200px', // Fixed height
      zIndex: 9999,
    };

    if (dropdownPosition === 'top') {
      styles.bottom = `${window.innerHeight - inputRect.top + 4}px`;
      styles.left = `${inputRect.left}px`;
    } else {
      styles.top = `${inputRect.bottom + 4}px`;
      styles.left = `${inputRect.left}px`;
    }

    return styles;
  };

  return (
    <>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className="w-full min-w-[140px] border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={!vendorName}
          required
          autoComplete="off"
        />

        {loading && (
          <div className="absolute right-2 top-2">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Improved dropdown with constrained dimensions */}
      {isOpen && filteredDrivers.length > 0 && (
        <div 
          ref={dropdownRef} 
          className="fixed bg-white border border-gray-300 rounded-md shadow-lg overflow-y-auto"
          style={getDropdownStyles()}
        >
          {filteredDrivers.map((driver) => (
            <div
              key={driver.DRIVER_ID}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => {
                setSearchTerm(driver.DRIVER_NAME);
                onChange(driver.DRIVER_NAME, driver);
                setIsOpen(false);
              }}
            >
              <div className="font-medium text-gray-900 truncate">
                {driver.DRIVER_NAME}
              </div>
              <div className="text-sm text-gray-500 truncate">
                {driver.CONTACT_NO || driver.MOBILE_NO || "No contact"} | License: {driver.DL_NO || "N/A"}
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && filteredDrivers.length === 0 && searchTerm && (
        <div 
          ref={dropdownRef} 
          className="fixed bg-white border border-gray-300 rounded-md shadow-lg"
          style={getDropdownStyles()}
        >
          <div className="px-3 py-2 text-gray-500 text-sm">
            No drivers found matching "{searchTerm}"
          </div>
        </div>
      )}

      {!vendorName && isOpen && (
        <div 
          ref={dropdownRef} 
          className="fixed bg-white border border-gray-300 rounded-md shadow-lg"
          style={getDropdownStyles()}
        >
          <div className="px-3 py-2 text-gray-500 text-sm">
            Please select a vendor first
          </div>
        </div>
      )}
    </>
  );
};

// Updated table component with backward compatibility handler
const VehicleBasicDetailsTable = ({ vehicleDataList, updateVehicleData }) => {
  const validateVehicleData = (field, value) => {
    switch (field) {
      case "vehicleNumber":
        return /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/.test(value);
      case "driverName":
        return value.length >= 3 && /^[A-Za-z.\s]+$/.test(value);
      case "driverContact":
        return /^\d{10}$/.test(value);
      case "licenseNumber":
        return value.length >= 5 && /^[A-Z0-9]+$/.test(value);
      case "licenseExpiry":
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiryDate = new Date(value);
        return expiryDate >= today;
      default:
        return true;
    }
  };

  const [validationErrors, setValidationErrors] = useState({});

  const handleInputChange = (index, field, value) => {
    updateVehicleData(index, field, value);
    const isValid = validateVehicleData(field, value);
    setValidationErrors((prev) => ({
      ...prev,
      [`${index}-${field}`]: isValid
        ? null
        : `Invalid ${field.replace(/([A-Z])/g, " $1").toLowerCase()}`,
    }));
  };

  // Enhanced vendor change handler with backward compatibility
  const handleVendorChange = (index, vendorName) => {
    // Update both vendorName and transporterName for backward compatibility
    updateVehicleData(index, "vendorName", vendorName);
    updateVehicleData(index, "transporterName", vendorName); // Keep old prop updated
  };

  const handleDriverSelection = (index, driverName, driverData) => {
    if (driverData) {
      updateVehicleData(index, "driverName", driverName);
      updateVehicleData(index, "driverContact", driverData.MOBILE_NO || driverData.CONTACT_NO || "");
      updateVehicleData(index, "licenseNumber", driverData.DL_NO || "");
      
      if (driverData.DL_RENEWABLE_DATE) {
        const date = new Date(driverData.DL_RENEWABLE_DATE);
        const formattedDate = date.toISOString().split('T')[0];
        updateVehicleData(index, "licenseExpiry", formattedDate);
      }
    } else {
      updateVehicleData(index, "driverName", driverName);
    }
  };

  // Helper function to get vendor name with backward compatibility
  const getVendorName = (vehicle) => {
    return vehicle.vendorName || vehicle.transporterName || "";
  };

  return (
    <div>
      <h4 className="text-lg font-medium text-gray-900 mb-4">
        Vehicle & Driver Information
        <span className="text-sm font-normal text-gray-500 ml-2">
          (All fields marked with * are required)
        </span>
      </h4>
      {/* Updated table container with better overflow handling */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Vehicle #
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">
                Vendor Name *
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
                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                  <div className="flex items-center justify-center">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                      {vehicle.vehicleIndex}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <VendorSearchInput
                    value={getVendorName(vehicle)}
                    onChange={(value) => handleVendorChange(index, value)}
                    placeholder="Search and select vendor"
                  />
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div>
                    <input
                      type="text"
                      className={`w-full min-w-[140px] border ${
                        validationErrors[`${index}-vehicleNumber`]
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
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
                      <p className="text-red-500 text-xs mt-1">
                        {validationErrors[`${index}-vehicleNumber`]}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <DriverSearchInput
                    value={vehicle.driverName}
                    onChange={(value, driverData) => handleDriverSelection(index, value, driverData)}
                    vendorName={getVendorName(vehicle)}
                    placeholder="Select driver"
                  />
                  {validationErrors[`${index}-driverName`] && (
                    <p className="text-red-500 text-xs mt-1">
                      {validationErrors[`${index}-driverName`]}
                    </p>
                  )}
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div>
                    <input
                      type="tel"
                      className={`w-full min-w-[160px] border ${
                        validationErrors[`${index}-driverContact`]
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
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
                      <p className="text-red-500 text-xs mt-1">
                        {validationErrors[`${index}-driverContact`]}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div>
                    <input
                      type="text"
                      className={`w-full min-w-[160px] border ${
                        validationErrors[`${index}-licenseNumber`]
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
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
                      <p className="text-red-500 text-xs mt-1">
                        {validationErrors[`${index}-licenseNumber`]}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div>
                    <input
                      type="date"
                      className={`w-full min-w-[160px] border ${
                        validationErrors[`${index}-licenseExpiry`]
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      value={vehicle.licenseExpiry}
                      onChange={(e) =>
                        handleInputChange(
                          index,
                          "licenseExpiry",
                          e.target.value
                        )
                      }
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                    {validationErrors[`${index}-licenseExpiry`] && (
                      <p className="text-red-500 text-xs mt-1">
                        {validationErrors[`${index}-licenseExpiry`]}
                      </p>
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