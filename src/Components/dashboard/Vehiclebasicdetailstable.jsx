import { useState, useEffect, useRef, useCallback } from "react";
import { driverAPI, vendorAPI, vehicleAPI } from "../../utils/Api";

const VendorSearchInput = ({ value, onChange, placeholder }) => {
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [loading, setLoading] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState("bottom");

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const selfOption = {
    VENDOR_ID: "SELF",
    VENDOR_NAME: "Self",
    VENDOR_CODE: "SELF",
    CITY: "Own Vehicles",
    ADDRESS: "Own Vehicles",
  };

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      try {
        const response = await vendorAPI.getAllVendors();
        const vendorsData = response.data || response || [];
        if (Array.isArray(vendorsData)) {
          const vendorsWithSelf = [selfOption, ...vendorsData];
          setVendors(vendorsWithSelf);
          setFilteredVendors(vendorsWithSelf);
        }
      } catch (error) {
        console.error("Error fetching vendors:", error);
        setVendors([selfOption]);
        setFilteredVendors([selfOption]);
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

  const calculateDropdownPosition = () => {
    if (!inputRef.current) return;
    const inputRect = inputRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 200;

    const spaceBelow = viewportHeight - inputRect.bottom;
    const spaceAbove = inputRect.top;

    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      setDropdownPosition("top");
    } else {
      setDropdownPosition("bottom");
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
    setTimeout(calculateDropdownPosition, 0);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", calculateDropdownPosition, true);
      window.addEventListener("resize", calculateDropdownPosition);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", calculateDropdownPosition, true);
      window.removeEventListener("resize", calculateDropdownPosition);
    };
  }, [isOpen]);

  const getDropdownStyles = () => {
    if (!inputRef.current || !isOpen) return { display: "none" };
    const inputRect = inputRef.current.getBoundingClientRect();
    const styles = {
      width: `${Math.max(inputRect.width, 200)}px`,
      maxHeight: "200px",
      zIndex: 9999,
    };

    if (dropdownPosition === "top") {
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
      {isOpen && filteredVendors.length > 0 && (
        <div
          ref={dropdownRef}
          className="fixed bg-white border border-gray-300 rounded-md shadow-lg overflow-y-auto"
          style={getDropdownStyles()}
        >
          {filteredVendors.map((vendor) => (
            <div
              key={vendor.VENDOR_ID}
              className={`px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                vendor.VENDOR_ID === "SELF" ? "bg-green-50 font-medium" : ""
              }`}
              onClick={() => {
                setSearchTerm(vendor.VENDOR_NAME);
                onChange(vendor.VENDOR_NAME);
                setIsOpen(false);
              }}
            >
              <div
                className={`font-medium text-gray-900 truncate ${
                  vendor.VENDOR_ID === "SELF" ? "text-green-800" : ""
                }`}
              >
                {vendor.VENDOR_NAME}
                {vendor.VENDOR_ID === "SELF" && (
                  <span className="ml-2 text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                    Own Vehicles
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500 truncate">
                {vendor.VENDOR_CODE || "No code"} |{" "}
                {vendor.CITY || vendor.ADDRESS || "No location"}
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

const VehicleSearchInput = ({ value, onChange, vendorName, placeholder, onDriversFetched }) => {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [loading, setLoading] = useState(false);
  const [vendorId, setVendorId] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState("bottom");

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const getVendorId = async () => {
      if (!vendorName) {
        setVendorId(null);
        return;
      }
      if (vendorName === "Self") {
        setVendorId("SELF");
        return;
      }
      try {
        const vendorsResponse = await vendorAPI.getAllVendors();
        const vendors = vendorsResponse.data || vendorsResponse || [];
        const vendor = vendors.find((v) => v.VENDOR_NAME === vendorName);
        if (vendor) {
          setVendorId(vendor.VENDOR_ID);
        } else {
          setVendorId(null);
        }
      } catch (error) {
        console.error("Error fetching vendor ID:", error);
        setVendorId(null);
      }
    };
    getVendorId();
  }, [vendorName]);

  const onDriversFetchedRef = useRef(onDriversFetched);
  onDriversFetchedRef.current = onDriversFetched;

  useEffect(() => {
    const fetchVehiclesAndDrivers = async () => {
      if (!vendorId) {
        setVehicles([]);
        setFilteredVehicles([]);
        onDriversFetchedRef.current([]);
        return;
      }
      setLoading(true);
      try {
        if (vendorId === "SELF") {
          const response = await vehicleAPI.getAllvehicles();
          const vehiclesData = response.data || response || [];
          if (Array.isArray(vehiclesData)) {
            setVehicles(vehiclesData);
            setFilteredVehicles(vehiclesData);
            onDriversFetchedRef.current(vehiclesData.map(v => ({...v, DRIVER_NAME: v.OWNER_NAME, CONTACT_NO: v.OWNER_CONTACT, VEHICLE_NO: v.VEHICLE_NUMBER, DL_NO: ''})));
          }
        } else {
          const response = await driverAPI.getDriversByVendorId(vendorId);
          const driversData = response.data || response || [];
          if (Array.isArray(driversData)) {
            onDriversFetchedRef.current(driversData);
            const uniqueVehicles = [...new Map(driversData.map(d => [d.VEHICLE_NO, d])).values()];
            setVehicles(uniqueVehicles);
            setFilteredVehicles(uniqueVehicles);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVehiclesAndDrivers();
  }, [vendorId]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = vehicles.filter((v) =>
        (v.VEHICLE_NO || v.VEHICLE_NUMBER).toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredVehicles(filtered);
    } else {
      setFilteredVehicles(vehicles);
    }
  }, [searchTerm, vehicles]);

  useEffect(() => {
    setSearchTerm(value || "");
  }, [value]);

  const calculateDropdownPosition = () => {
    if (!inputRef.current) return;
    const inputRect = inputRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 200;
    const spaceBelow = viewportHeight - inputRect.bottom;
    const spaceAbove = inputRect.top;
    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      setDropdownPosition("top");
    } else {
      setDropdownPosition("bottom");
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
    setTimeout(calculateDropdownPosition, 0);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", calculateDropdownPosition, true);
      window.addEventListener("resize", calculateDropdownPosition);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", calculateDropdownPosition, true);
      window.removeEventListener("resize", calculateDropdownPosition);
    };
  }, [isOpen]);

  const getDropdownStyles = () => {
    if (!inputRef.current || !isOpen) return { display: "none" };
    const inputRect = inputRef.current.getBoundingClientRect();
    const styles = {
      width: `${Math.max(inputRect.width, 250)}px`,
      maxHeight: "200px",
      zIndex: 9999,
    };
    if (dropdownPosition === "top") {
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
            onChange(e.target.value, null);
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
      {isOpen && filteredVehicles.length > 0 && (
        <div
          ref={dropdownRef}
          className="fixed bg-white border border-gray-300 rounded-md shadow-lg overflow-y-auto"
          style={getDropdownStyles()}
        >
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle.VEHICLE_ID || vehicle.DRIVER_ID}
              className="px-3 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => {
                const vehicleNumber = vehicle.VEHICLE_NO || vehicle.VEHICLE_NUMBER;
                setSearchTerm(vehicleNumber);
                onChange(vehicleNumber, vehicle);
                setIsOpen(false);
              }}
            >
              <div className="font-medium text-gray-900 truncate">
                {vehicle.VEHICLE_NO || vehicle.VEHICLE_NUMBER}
              </div>
              <div className="text-sm text-gray-500 truncate mt-1">
                {vehicle.DRIVER_NAME}
              </div>
            </div>
          ))}
        </div>
      )}
      {isOpen && filteredVehicles.length === 0 && !loading && (
        <div
          ref={dropdownRef}
          className="fixed bg-white border border-gray-300 rounded-md shadow-lg"
          style={getDropdownStyles()}
        >
          <div className="px-3 py-2 text-gray-500 text-sm">
            No vehicles found
          </div>
        </div>
      )}
    </>
  );
};

const VehicleBasicDetailsTable = ({ vehicleDataList, updateVehicleData }) => {
  const [driversByVendor, setDriversByVendor] = useState({});

  const handleVendorChange = (index, vendorName) => {
    updateVehicleData(index, "vendorName", vendorName);
    updateVehicleData(index, "transporterName", vendorName);
    // Reset vehicle and driver details when vendor changes
    updateVehicleData(index, "vehicleNumber", "");
    updateVehicleData(index, "driverName", "");
    updateVehicleData(index, "driverContact", "");
    updateVehicleData(index, "licenseNumber", "");
    updateVehicleData(index, "licenseExpiry", "");
  };

  const handleDriversFetched = useCallback((index, drivers) => {
    setDriversByVendor(prev => ({...prev, [index]: drivers}));
  }, []);

  const handleVehicleSelection = (index, vehicleNumber, vehicleData) => {
    updateVehicleData(index, "vehicleNumber", vehicleNumber);
    if (vehicleData) {
      const driver = (driversByVendor[index] || []).find(d => (d.VEHICLE_NO || d.VEHICLE_NUMBER) === vehicleNumber);
      if (driver) {
        updateVehicleData(index, "driverName", driver.DRIVER_NAME);
        updateVehicleData(
          index,
          "driverContact",
          driver.CONTACT_NO || driver.MOBILE_NO || ""
        );
        updateVehicleData(index, "licenseNumber", driver.DL_NO || "");
        if (driver.DL_RENEWABLE_DATE) {
          const date = new Date(driver.DL_RENEWABLE_DATE);
          const formattedDate = date.toISOString().split("T")[0];
          updateVehicleData(index, "licenseExpiry", formattedDate);
        }
      }
    } else {
      // Clear driver fields if vehicle is deselected
      updateVehicleData(index, "driverName", "");
      updateVehicleData(index, "driverContact", "");
      updateVehicleData(index, "licenseNumber", "");
      updateVehicleData(index, "licenseExpiry", "");
    }
  };

  const handleInputChange = (index, field, value) => {
    updateVehicleData(index, field, value);
  };

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
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vehicleDataList.map((vehicle, index) => (
              <tr
                key={`vehicle-${vehicle.vehicleIndex}`}
                className="hover:bg-gray-50"
              >
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
                  <VehicleSearchInput
                    value={vehicle.vehicleNumber}
                    onChange={(value, vehicleData) =>
                      handleVehicleSelection(index, value, vehicleData)
                    }
                    vendorName={getVendorName(vehicle)}
                    placeholder="Select vehicle"
                    onDriversFetched={(drivers) => handleDriversFetched(index, drivers)}
                  />
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    className="w-full min-w-[140px] border border-gray-300 rounded-md p-2 text-sm"
                    value={vehicle.driverName}
                    onChange={(e) => handleInputChange(index, "driverName", e.target.value)}
                    placeholder="Driver Name"
                    readOnly // Driver name is now auto-populated
                  />
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div>
                    <input
                      type="tel"
                      className="w-full min-w-[160px] border border-gray-300 rounded-md p-2 text-sm"
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
                      readOnly // Driver contact is now auto-populated
                    />
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