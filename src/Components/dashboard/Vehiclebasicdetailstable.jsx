// import React, { useState, useEffect, useRef } from "react";
// import { toast } from "react-toastify";
// import { useNavigate } from "react-router-dom";
// import { vendorAPI, driverAPI, vehicleAPI, transporterAPI } from "../../utils/Api";
// import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// // VendorSearchInput Component
// const VendorSearchInput = ({ value, onChange, placeholder }) => {
//   const [vendors, setVendors] = useState([]);
//   const [filteredVendors, setFilteredVendors] = useState([]);
//   const [isOpen, setIsOpen] = useState(false);
//   const [searchTerm, setSearchTerm] = useState(value || "");
//   const [loading, setLoading] = useState(false);
//   const [dropdownPosition, setDropdownPosition] = useState("bottom");

//   const inputRef = useRef(null);
//   const dropdownRef = useRef(null);

//   const selfOption = {
//     VENDOR_ID: "SELF",
//     VENDOR_NAME: "Self",
//     VENDOR_CODE: "SELF",
//     CITY: "Own Vehicles",
//     ADDRESS: "Own Vehicles",
//   };

//   useEffect(() => {
//     const fetchVendors = async () => {
//       setLoading(true);
//       try {
//         const response = await vendorAPI.getAllVendors();
//         const vendorsData = response.data || response || [];
//         if (Array.isArray(vendorsData)) {
//           const vendorsWithSelf = [selfOption, ...vendorsData];
//           setVendors(vendorsWithSelf);
//           setFilteredVendors(vendorsWithSelf);
//         }
//       } catch (error) {
//         console.error("Error fetching vendors:", error);
//         setVendors([selfOption]);
//         setFilteredVendors([selfOption]);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchVendors();
//   }, []);

//   useEffect(() => {
//     if (searchTerm && vendors.length > 0) {
//       const filtered = vendors.filter((v) =>
//         v.VENDOR_NAME.toLowerCase().includes(searchTerm.toLowerCase())
//       );
//       setFilteredVendors(filtered);
//     } else {
//       setFilteredVendors(vendors);
//     }
//   }, [searchTerm, vendors]);

//   useEffect(() => {
//     setSearchTerm(value || "");
//   }, [value]);

//   const calculateDropdownPosition = () => {
//     if (!inputRef.current) return;
//     const inputRect = inputRef.current.getBoundingClientRect();
//     const viewportHeight = window.innerHeight;
//     const dropdownHeight = 200;
//     const spaceBelow = viewportHeight - inputRect.bottom;
//     const spaceAbove = inputRect.top;
//     setDropdownPosition(
//       spaceBelow < dropdownHeight && spaceAbove > dropdownHeight
//         ? "top"
//         : "bottom"
//     );
//   };

//   const handleFocus = () => {
//     setIsOpen(true);
//     setTimeout(calculateDropdownPosition, 0);
//   };

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         dropdownRef.current &&
//         !dropdownRef.current.contains(event.target) &&
//         inputRef.current &&
//         !inputRef.current.contains(event.target)
//       ) {
//         setIsOpen(false);
//       }
//     };
//     const handleScroll = () => {
//       if (isOpen) calculateDropdownPosition();
//     };
//     if (isOpen) {
//       document.addEventListener("mousedown", handleClickOutside);
//       window.addEventListener("scroll", calculateDropdownPosition, true);
//       window.addEventListener("resize", calculateDropdownPosition);
//     }
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//       window.removeEventListener("scroll", calculateDropdownPosition, true);
//       window.removeEventListener("resize", calculateDropdownPosition);
//     };
//   }, [isOpen]);

//   const getDropdownStyles = () => {
//     if (!inputRef.current || !isOpen) return { display: "none" };
//     const inputRect = inputRef.current.getBoundingClientRect();
//     const styles = {
//       width: `${Math.max(inputRect.width, 200)}px`,
//       maxHeight: "200px",
//       zIndex: 9999,
//     };
//     if (dropdownPosition === "top") {
//       styles.bottom = `${window.innerHeight - inputRect.top + 4}px`;
//       styles.left = `${inputRect.left}px`;
//     } else {
//       styles.top = `${inputRect.bottom + 4}px`;
//       styles.left = `${inputRect.left}px`;
//     }
//     return styles;
//   };

//   return (
//     <div className="relative">
//       <input
//         ref={inputRef}
//         type="text"
//         className="w-full min-w-[160px] border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//         value={searchTerm}
//         onChange={(e) => {
//           setSearchTerm(e.target.value);
//           onChange(e.target.value);
//           setIsOpen(true);
//         }}
//         onFocus={handleFocus}
//         placeholder={placeholder}
//         required
//         autoComplete="off"
//       />
//       {loading && (
//         <div className="absolute right-2 top-2">
//           <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
//         </div>
//       )}
//       {isOpen && filteredVendors.length > 0 && (
//         <div
//           ref={dropdownRef}
//           className="fixed bg-white border border-gray-300 rounded-md shadow-lg overflow-y-auto"
//           style={getDropdownStyles()}
//         >
//           {filteredVendors.map((vendor) => (
//             <div
//               key={vendor.VENDOR_ID}
//               className={`px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
//                 vendor.VENDOR_ID === "SELF" ? "bg-green-50 font-medium" : ""
//               }`}
//               onClick={() => {
//                 setSearchTerm(vendor.VENDOR_NAME);
//                 onChange(vendor.VENDOR_NAME);
//                 setIsOpen(false);
//               }}
//             >
//               <div
//                 className={`font-medium text-gray-900 truncate ${
//                   vendor.VENDOR_ID === "SELF" ? "text-green-800" : ""
//                 }`}
//               >
//                 {vendor.VENDOR_NAME}
//                 {vendor.VENDOR_ID === "SELF" && (
//                   <span className="ml-2 text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
//                     Own Vehicles
//                   </span>
//                 )}
//               </div>
//               <div className="text-sm text-gray-500 truncate">
//                 {vendor.VENDOR_CODE || "No code"} |{" "}
//                 {vendor.CITY || vendor.ADDRESS || "No location"}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//       {isOpen && filteredVendors.length === 0 && searchTerm && (
//         <div
//           ref={dropdownRef}
//           className="fixed bg-white border border-gray-300 rounded-md shadow-lg"
//           style={getDropdownStyles()}
//         >
//           <div className="px-3 py-2 text-gray-500 text-sm">
//             No vendors found matching "{searchTerm}"
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// // DriverSearchInput Component
// const DriverSearchInput = ({ value, onChange, vendorName, placeholder }) => {
//   const [drivers, setDrivers] = useState([]);
//   const [filteredDrivers, setFilteredDrivers] = useState([]);
//   const [isOpen, setIsOpen] = useState(false);
//   const [searchTerm, setSearchTerm] = useState(value || "");
//   const [loading, setLoading] = useState(false);
//   const [vendorId, setVendorId] = useState(null);
//   const [dropdownPosition, setDropdownPosition] = useState("bottom");
//   const [vehicles, setVehicles] = useState([]);

//   const inputRef = useRef(null);
//   const dropdownRef = useRef(null);

//   useEffect(() => {
//     const getVendorId = async () => {
//       if (!vendorName) {
//         setVendorId(null);
//         return;
//       }
//       if (vendorName === "Self") {
//         setVendorId("SELF");
//         return;
//       }
//       try {
//         const vendorsResponse = await vendorAPI.getAllVendors();
//         const vendors = vendorsResponse.data || vendorsResponse || [];
//         const vendor = vendors.find((v) => v.VENDOR_NAME === vendorName);
//         setVendorId(vendor ? vendor.VENDOR_ID : null);
//       } catch (error) {
//         console.error("Error fetching vendor ID:", error);
//         setVendorId(null);
//       }
//     };
//     getVendorId();
//   }, [vendorName]);

//   useEffect(() => {
//     const fetchData = async () => {
//       if (!vendorId) {
//         setDrivers([]);
//         setFilteredDrivers([]);
//         setVehicles([]);
//         return;
//       }
//       setLoading(true);
//       try {
//         if (vendorId === "SELF") {
//           const vehiclesResponse = await vehicleAPI.getAllvehicles();
//           let vehiclesData = [];
//           if (vehiclesResponse && Array.isArray(vehiclesResponse)) {
//             vehiclesData = vehiclesResponse;
//           } else if (
//             vehiclesResponse &&
//             vehiclesResponse.data &&
//             Array.isArray(vehiclesResponse.data)
//           ) {
//             vehiclesData = vehiclesResponse.data;
//           } else if (
//             vehiclesResponse &&
//             Array.isArray(vehiclesResponse.vehicles)
//           ) {
//             vehiclesData = vehiclesResponse.vehicles;
//           }
//           if (vehiclesData.length === 0) {
//             setDrivers([]);
//             setFilteredDrivers([]);
//             setVehicles([]);
//             return;
//           }
//           const vehicleDrivers = vehiclesData.map((vehicle, index) => {
//             const driverName =
//               vehicle.OWNER_NAME ||
//               vehicle.owner_name ||
//               `Owner of ${
//                 vehicle.VEHICLE_NUMBER ||
//                 vehicle.vehicle_number ||
//                 "Unknown Vehicle"
//               }`;
//             const vehicleNumber =
//               vehicle.VEHICLE_NUMBER ||
//               vehicle.vehicle_number ||
//               vehicle.VEHICLE_NO ||
//               "";
//             const ownerContact =
//               vehicle.OWNER_CONTACT ||
//               vehicle.owner_contact ||
//               vehicle.CONTACT_NO ||
//               "";
//             const vehicleType =
//               vehicle.VEHICLE_TYPE || vehicle.vehicle_type || "";
//             const make = vehicle.MAKE || vehicle.make || "";
//             const model = vehicle.MODEL || vehicle.model || "";
//             const year = vehicle.YEAR || vehicle.year || "";
//             const vehicleId =
//               vehicle.VEHICLE_ID || vehicle.vehicle_id || vehicle.id || index;
//             return {
//               DRIVER_ID: `VEHICLE_${vehicleId}`,
//               DRIVER_NAME: driverName,
//               CONTACT_NO: ownerContact,
//               MOBILE_NO: ownerContact,
//               DL_NO: "",
//               DL_RENEWABLE_DATE: null,
//               VEHICLE_NO: vehicleNumber,
//               VEHICLE_ID: vehicleId,
//               VEHICLE_TYPE: vehicleType,
//               MAKE: make,
//               MODEL: model,
//               YEAR: year,
//               IS_SELF_VEHICLE: true,
//             };
//           });
//           setDrivers(vehicleDrivers);
//           setFilteredDrivers(vehicleDrivers);
//           setVehicles(vehiclesData);
//         } else {
//           const driversResponse = await driverAPI.getDriversByVendorId(
//             vendorId
//           );
//           const driversData = driversResponse.data || driversResponse || [];
//           setDrivers(driversData);
//           setFilteredDrivers(driversData);
//           setVehicles([]);
//         }
//       } catch (error) {
//         console.error("Error fetching data:", error);
//         setDrivers([]);
//         setFilteredDrivers([]);
//         setVehicles([]);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, [vendorId]);

//   useEffect(() => {
//     if (searchTerm && drivers.length > 0) {
//       const filtered = drivers.filter((d) =>
//         d.DRIVER_NAME.toLowerCase().includes(searchTerm.toLowerCase())
//       );
//       setFilteredDrivers(filtered);
//     } else {
//       setFilteredDrivers(drivers);
//     }
//   }, [searchTerm, drivers]);

//   useEffect(() => {
//     setSearchTerm(value || "");
//   }, [value]);

//   const calculateDropdownPosition = () => {
//     if (!inputRef.current) return;
//     const inputRect = inputRef.current.getBoundingClientRect();
//     const viewportHeight = window.innerHeight;
//     const dropdownHeight = 200;
//     const spaceBelow = viewportHeight - inputRect.bottom;
//     const spaceAbove = inputRect.top;
//     setDropdownPosition(
//       spaceBelow < dropdownHeight && spaceAbove > dropdownHeight
//         ? "top"
//         : "bottom"
//     );
//   };

//   const handleFocus = () => {
//     setIsOpen(true);
//     setTimeout(calculateDropdownPosition, 0);
//   };

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         dropdownRef.current &&
//         !dropdownRef.current.contains(event.target) &&
//         inputRef.current &&
//         !inputRef.current.contains(event.target)
//       ) {
//         setIsOpen(false);
//       }
//     };
//     if (isOpen) {
//       document.addEventListener("mousedown", handleClickOutside);
//       window.addEventListener("scroll", calculateDropdownPosition, true);
//       window.addEventListener("resize", calculateDropdownPosition);
//     }
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//       window.removeEventListener("scroll", calculateDropdownPosition, true);
//       window.removeEventListener("resize", calculateDropdownPosition);
//     };
//   }, [isOpen]);

//   const getDropdownStyles = () => {
//     if (!inputRef.current || !isOpen) return { display: "none" };
//     const inputRect = inputRef.current.getBoundingClientRect();
//     const styles = {
//       width: `${Math.max(inputRect.width, 250)}px`,
//       maxHeight: "200px",
//       zIndex: 9999,
//     };
//     if (dropdownPosition === "top") {
//       styles.bottom = `${window.innerHeight - inputRect.top + 4}px`;
//       styles.left = `${inputRect.left}px`;
//     } else {
//       styles.top = `${inputRect.bottom + 4}px`;
//       styles.left = `${inputRect.left}px`;
//     }
//     return styles;
//   };

//   const getVehicleInfo = (driver) => {
//     if (vendorId === "SELF" || driver.IS_SELF_VEHICLE) {
//       const vehicleInfo = [];
//       if (driver.VEHICLE_NO) vehicleInfo.push(`${driver.VEHICLE_NO}`);
//       if (driver.VEHICLE_TYPE) vehicleInfo.push(`(${driver.VEHICLE_TYPE})`);
//       if (driver.MAKE && driver.MODEL)
//         vehicleInfo.push(`${driver.MAKE} ${driver.MODEL}`);
//       return vehicleInfo.length > 0 ? vehicleInfo.join(" ") : "Own Vehicle";
//     } else {
//       if (driver.VEHICLE_NO) {
//         return `Vehicle: ${driver.VEHICLE_NO}`;
//       } else if (driver.VEHICLE_ID) {
//         return `Vehicle ID: ${driver.VEHICLE_ID}`;
//       } else {
//         return "No vehicle assigned";
//       }
//     }
//   };

//   const getContactInfo = (driver) => {
//     const contact = driver.CONTACT_NO || driver.MOBILE_NO;
//     const license = driver.DL_NO;
//     if (vendorId === "SELF" || driver.IS_SELF_VEHICLE) {
//       const info = [];
//       if (contact) info.push(contact);
//       if (driver.YEAR) info.push(`Year: ${driver.YEAR}`);
//       return info.length > 0 ? info.join(" | ") : "No contact info";
//     } else {
//       if (contact && license) {
//         return `${contact} | License: ${license}`;
//       } else if (contact) {
//         return contact;
//       } else if (license) {
//         return `License: ${license}`;
//       } else {
//         return "No contact info";
//       }
//     }
//   };

//   return (
//     <div className="relative">
//       <input
//         ref={inputRef}
//         type="text"
//         className="w-full min-w-[140px] border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//         value={searchTerm}
//         onChange={(e) => {
//           setSearchTerm(e.target.value);
//           onChange(e.target.value);
//           setIsOpen(true);
//         }}
//         onFocus={handleFocus}
//         placeholder={placeholder}
//         disabled={!vendorName}
//         required
//         autoComplete="off"
//       />
//       {loading && (
//         <div className="absolute right-2 top-2">
//           <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
//         </div>
//       )}
//       {isOpen && filteredDrivers.length > 0 && (
//         <div
//           ref={dropdownRef}
//           className="fixed bg-white border border-gray-300 rounded-md shadow-lg overflow-y-auto"
//           style={getDropdownStyles()}
//         >
//           {filteredDrivers.map((driver) => (
//             <div
//               key={driver.DRIVER_ID}
//               className={`px-3 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
//                 vendorId === "SELF" || driver.IS_SELF_VEHICLE
//                   ? "bg-green-50"
//                   : ""
//               }`}
//               onClick={() => {
//                 setSearchTerm(driver.DRIVER_NAME);
//                 onChange(driver.DRIVER_NAME, driver);
//                 setIsOpen(false);
//               }}
//             >
//               <div className="font-medium text-gray-900 truncate">
//                 {driver.DRIVER_NAME}
//                 {(vendorId === "SELF" || driver.IS_SELF_VEHICLE) && (
//                   <span className="ml-2 text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
//                     Own
//                   </span>
//                 )}
//               </div>
//               <div className="text-sm text-gray-500 truncate mt-1">
//                 {getContactInfo(driver)}
//               </div>
//               <div
//                 className={`text-sm truncate mt-1 ${
//                   vendorId === "SELF" || driver.IS_SELF_VEHICLE
//                     ? "text-green-600"
//                     : "text-blue-600"
//                 }`}
//               >
//                 {getVehicleInfo(driver)}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//       {isOpen && filteredDrivers.length === 0 && searchTerm && !loading && (
//         <div
//           ref={dropdownRef}
//           className="fixed bg-white border border-gray-300 rounded-md shadow-lg"
//           style={getDropdownStyles()}
//         >
//           <div className="px-3 py-2 text-gray-500 text-sm">
//             {vendorId === "SELF"
//               ? `No vehicles found matching "${searchTerm}"`
//               : `No drivers found matching "${searchTerm}"`}
//           </div>
//         </div>
//       )}
//       {isOpen &&
//         filteredDrivers.length === 0 &&
//         !searchTerm &&
//         !loading &&
//         vendorName && (
//           <div
//             ref={dropdownRef}
//             className="fixed bg-white border border-gray-300 rounded-md shadow-lg"
//             style={getDropdownStyles()}
//           >
//             <div className="px-3 py-2 text-gray-500 text-sm">
//               {vendorId === "SELF"
//                 ? "No vehicles available"
//                 : "No drivers available for this vendor"}
//             </div>
//           </div>
//         )}
//       {!vendorName && isOpen && (
//         <div
//           ref={dropdownRef}
//           className="fixed bg-white border border-gray-300 rounded-md shadow-lg"
//           style={getDropdownStyles()}
//         >
//           <div className="px-3 py-2 text-gray-500 text-sm">
//             Please select a vendor first
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// // BulkVehicleContainerForm Component
// const BulkVehicleContainerForm = () => {
//   const navigate = useNavigate();
//   const [isLoading, setIsLoading] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [transportRequestId, setTransportRequestId] = useState("");
//   const [vehicles, setVehicles] = useState([
//     {
//       transporter_id: null, // Added to track existing transporter records
//       transporterName: "",
//       vehicleNumber: "",
//       driverName: "",
//       driverContact: "",
//       licenseNumber: "",
//       licenseExpiry: "",
//       additionalCharges: "",
//       serviceCharges: "",
//       totalCharge: "",
//       containers: [
//         {
//           container_id: null, // Added to track existing container records
//           containerNo: "",
//           line: "",
//           sealNo: "",
//           seal1: "",
//           seal2: "",
//           containerTotalWeight: "",
//           cargoTotalWeight: "",
//           containerType: "",
//           containerSize: "",
//         },
//       ],
//     },
//   ]);
//   const [validationErrors, setValidationErrors] = useState({});

//   // Fetch existing vehicles and containers
//   useEffect(() => {
//     const storedRequestId = sessionStorage.getItem("transportRequestId");
//     if (storedRequestId) {
//       setTransportRequestId(storedRequestId);
//     }

//     const fetchExistingData = async () => {
//       if (!storedRequestId) return;
//       setIsLoading(true);
//       try {
//         const response = await transporterAPI.getTransporterByRequestId(
//           storedRequestId
//         );
//         if (response.success && Array.isArray(response.data)) {
//           const transporterData = response.data;
//           if (transporterData.length > 0) {
//             const formattedVehicles = transporterData.map((transporter) => ({
//               transporter_id: transporter.transporter_id || null,
//               transporterName: transporter.transporter_name || "",
//               vehicleNumber: transporter.vehicle_number || "",
//               driverName: transporter.driver_name || "",
//               driverContact: transporter.driver_contact || "",
//               licenseNumber: transporter.license_number || "",
//               licenseExpiry: transporter.license_expiry || "",
//               additionalCharges:
//                 transporter.additional_charges?.toString() || "",
//               serviceCharges: transporter.service_charges || "",
//               totalCharge: transporter.total_charge?.toString() || "",
//               containers:
//                 Array.isArray(transporter.containers) &&
//                 transporter.containers.length > 0
//                   ? transporter.containers.map((container) => ({
//                       container_id: container.container_id || null,
//                       containerNo: container.container_no || "",
//                       line: container.line || "",
//                       sealNo: container.seal_no || "",
//                       seal1: container.seal1 || "",
//                       seal2: container.seal2 || "",
//                       containerTotalWeight:
//                         container.container_total_weight?.toString() || "",
//                       cargoTotalWeight:
//                         container.cargo_total_weight?.toString() || "",
//                       containerType: container.container_type || "",
//                       containerSize: container.container_size || "",
//                     }))
//                   : [
//                       {
//                         container_id: null,
//                         containerNo: "",
//                         line: "",
//                         sealNo: "",
//                         seal1: "",
//                         seal2: "",
//                         containerTotalWeight: "",
//                         cargoTotalWeight: "",
//                         containerType: "",
//                         containerSize: "",
//                       },
//                     ],
//             }));
//             setVehicles(formattedVehicles);
//             sessionStorage.setItem(
//               "vehicleContainerData",
//               JSON.stringify(formattedVehicles)
//             );
//             toast.success(
//               "Existing vehicles and containers loaded successfully"
//             );
//           }
//         } else {
//           toast.info(
//             "No existing vehicles or containers found for this request"
//           );
//         }
//       } catch (error) {
//         console.error("Error fetching existing data:", error);
//         toast.error("Failed to load existing data");
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchExistingData();
//   }, []);

//   // Validation functions
//   const validateVehicle = (vehicle, vehicleIndex) => {
//     const errors = {};
//     const vehicleNumberRegex = /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/;
//     const contactRegex = /^\d{10}$/;
//     const licenseRegex = /^[A-Z0-9]{5,}$/;
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     if (!vehicle.transporterName)
//       errors[`${vehicleIndex}-transporterName`] =
//         "Transporter name is required";
//     if (!vehicleNumberRegex.test(vehicle.vehicleNumber))
//       errors[`${vehicleIndex}-vehicleNumber`] =
//         "Invalid vehicle number (e.g., MH12AB1234)";
//     if (!vehicle.driverName || vehicle.driverName.length < 3)
//       errors[`${vehicleIndex}-driverName`] = "Valid driver name is required";
//     if (!contactRegex.test(vehicle.driverContact))
//       errors[`${vehicleIndex}-driverContact`] =
//         "Invalid 10-digit contact number";
//     if (!licenseRegex.test(vehicle.licenseNumber))
//       errors[`${vehicleIndex}-licenseNumber`] = "Invalid license number";
//     if (!vehicle.licenseExpiry || new Date(vehicle.licenseExpiry) < today)
//       errors[`${vehicleIndex}-licenseExpiry`] =
//         "Valid future expiry date required";
//     if (
//       isNaN(parseFloat(vehicle.additionalCharges)) ||
//       parseFloat(vehicle.additionalCharges) < 0
//     )
//       errors[`${vehicleIndex}-additionalCharges`] =
//         "Valid additional charges required";
//     if (!vehicle.serviceCharges)
//       errors[`${vehicleIndex}-serviceCharges`] =
//         "Service charges description required";
//     if (
//       isNaN(parseFloat(vehicle.totalCharge)) ||
//       parseFloat(vehicle.totalCharge) < 0
//     )
//       errors[`${vehicleIndex}-totalCharge`] = "Valid total charge required";

//     vehicle.containers.forEach((container, containerIndex) => {
//       const containerNoRegex = /^[A-Z]{4}\d{7}$/;
//       if (!containerNoRegex.test(container.containerNo))
//         errors[`${vehicleIndex}-${containerIndex}-containerNo`] =
//           "Invalid container number (e.g., MSKU1234567)";
//       if (!container.line)
//         errors[`${vehicleIndex}-${containerIndex}-line`] =
//           "Shipping line is required";
//       if (!container.sealNo)
//         errors[`${vehicleIndex}-${containerIndex}-sealNo`] =
//           "Seal number is required";
//       if (
//         isNaN(parseFloat(container.containerTotalWeight)) ||
//         parseFloat(container.containerTotalWeight) < 0
//       )
//         errors[`${vehicleIndex}-${containerIndex}-containerTotalWeight`] =
//           "Valid container weight required";
//       if (
//         isNaN(parseFloat(container.cargoTotalWeight)) ||
//         parseFloat(container.cargoTotalWeight) < 0
//       )
//         errors[`${vehicleIndex}-${containerIndex}-cargoTotalWeight`] =
//           "Valid cargo weight required";
//       if (!container.containerType)
//         errors[`${vehicleIndex}-${containerIndex}-containerType`] =
//           "Container type is required";
//       if (!container.containerSize)
//         errors[`${vehicleIndex}-${containerIndex}-containerSize`] =
//           "Container size is required";
//     });

//     return errors;
//   };

//   const calculateCheckDigit = (containerNo) => {
//     const letters = "0123456789A?BCDEFGHIJK?LMNOPQRSTU?VWXYZ";
//     const chars = containerNo.slice(0, 10).toUpperCase().split("");
//     let sum = 0;
//     chars.forEach((char, i) => {
//       const value = /[A-Z]/.test(char)
//         ? letters.indexOf(char)
//         : parseInt(char, 10);
//       sum += value * Math.pow(2, i);
//     });
//     return (sum % 11) % 10;
//   };

//   const updateVehicleData = (vehicleIndex, field, value) => {
//     setVehicles((prev) =>
//       prev.map((vehicle, i) =>
//         i === vehicleIndex ? { ...vehicle, [field]: value } : vehicle
//       )
//     );
//     const newErrors = validateVehicle(
//       { ...vehicles[vehicleIndex], [field]: value },
//       vehicleIndex
//     );
//     setValidationErrors((prev) => ({
//       ...prev,
//       ...newErrors,
//     }));
//   };

//   const handleDriverSelection = (vehicleIndex, driverName, driverData) => {
//     if (driverData) {
//       setVehicles((prev) =>
//         prev.map((vehicle, i) =>
//           i === vehicleIndex
//             ? {
//                 ...vehicle,
//                 driverName,
//                 driverContact:
//                   driverData.MOBILE_NO || driverData.CONTACT_NO || "",
//                 licenseNumber: driverData.DL_NO || "",
//                 vehicleNumber: driverData.VEHICLE_NO || "",
//                 licenseExpiry: driverData.DL_RENEWABLE_DATE
//                   ? new Date(driverData.DL_RENEWABLE_DATE)
//                       .toISOString()
//                       .split("T")[0]
//                   : "",
//               }
//             : vehicle
//         )
//       );
//       const newErrors = validateVehicle(
//         {
//           ...vehicles[vehicleIndex],
//           driverName,
//           driverContact: driverData.MOBILE_NO || driverData.CONTACT_NO || "",
//           licenseNumber: driverData.DL_NO || "",
//           vehicleNumber: driverData.VEHICLE_NO || "",
//           licenseExpiry: driverData.DL_RENEWABLE_DATE
//             ? new Date(driverData.DL_RENEWABLE_DATE).toISOString().split("T")[0]
//             : "",
//         },
//         vehicleIndex
//       );
//       setValidationErrors((prev) => ({
//         ...prev,
//         ...newErrors,
//       }));
//     }
//   };

//   const updateContainerData = (vehicleIndex, containerIndex, field, value) => {
//     if (field === "containerNo") {
//       value = value.toUpperCase().slice(0, 11);
//       if (value.length <= 4) {
//         value = value.replace(/[^A-Z]/g, "");
//       } else {
//         const letters = value.substring(0, 4).replace(/[^A-Z]/g, "");
//         const digits = value.substring(4).replace(/[^0-9]/g, "");
//         value = letters + digits;
//       }
//     }
//     setVehicles((prev) =>
//       prev.map((vehicle, i) =>
//         i === vehicleIndex
//           ? {
//               ...vehicle,
//               containers: vehicle.containers.map((container, j) =>
//                 j === containerIndex
//                   ? { ...container, [field]: value }
//                   : container
//               ),
//             }
//           : vehicle
//       )
//     );
//     const newErrors = validateVehicle(vehicles[vehicleIndex], vehicleIndex);
//     setValidationErrors((prev) => ({
//       ...prev,
//       ...newErrors,
//     }));
//   };

//   const addVehicle = () => {
//     setVehicles((prev) => [
//       ...prev,
//       {
//         transporter_id: null,
//         transporterName: "",
//         vehicleNumber: "",
//         driverName: "",
//         driverContact: "",
//         licenseNumber: "",
//         licenseExpiry: "",
//         additionalCharges: "",
//         serviceCharges: "",
//         totalCharge: "",
//         containers: [
//           {
//             container_id: null,
//             containerNo: "",
//             line: "",
//             sealNo: "",
//             seal1: "",
//             seal2: "",
//             containerTotalWeight: "",
//             cargoTotalWeight: "",
//             containerType: "",
//             containerSize: "",
//           },
//         ],
//       },
//     ]);
//   };

//   const removeVehicle = (vehicleIndex) => {
//     if (vehicles.length > 1) {
//       setVehicles((prev) => prev.filter((_, i) => i !== vehicleIndex));
//       setValidationErrors((prev) => {
//         const newErrors = { ...prev };
//         Object.keys(newErrors).forEach((key) => {
//           if (key.startsWith(`${vehicleIndex}-`)) {
//             delete newErrors[key];
//           }
//         });
//         return newErrors;
//       });
//     } else {
//       toast.warning("At least one vehicle is required");
//     }
//   };

//   const addContainer = (vehicleIndex) => {
//     setVehicles((prev) =>
//       prev.map((vehicle, i) =>
//         i === vehicleIndex
//           ? {
//               ...vehicle,
//               containers: [
//                 ...vehicle.containers,
//                 {
//                   container_id: null,
//                   containerNo: "",
//                   line: "",
//                   sealNo: "",
//                   seal1: "",
//                   seal2: "",
//                   containerTotalWeight: "",
//                   cargoTotalWeight: "",
//                   containerType: "",
//                   containerSize: "",
//                 },
//               ],
//             }
//           : vehicle
//       )
//     );
//   };

//   const removeContainer = (vehicleIndex, containerIndex) => {
//     setVehicles((prev) =>
//       prev.map((vehicle, i) =>
//         i === vehicleIndex
//           ? {
//               ...vehicle,
//               containers: vehicle.containers.filter(
//                 (_, j) => j !== containerIndex
//               ),
//             }
//           : vehicle
//       )
//     );
//     setValidationErrors((prev) => {
//       const newErrors = { ...prev };
//       Object.keys(newErrors).forEach((key) => {
//         if (key.startsWith(`${vehicleIndex}-${containerIndex}-`)) {
//           delete newErrors[key];
//         }
//       });
//       return newErrors;
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsSubmitting(true);

//     const allErrors = vehicles.reduce((acc, vehicle, index) => {
//       return { ...acc, ...validateVehicle(vehicle, index) };
//     }, {});

//     const checkDigitErrors = [];
//     vehicles.forEach((vehicle, vehicleIndex) => {
//       vehicle.containers.forEach((container, containerIndex) => {
//         if (
//           container.containerNo &&
//           /^[A-Z]{4}\d{7}$/.test(container.containerNo)
//         ) {
//           const checkDigit = calculateCheckDigit(container.containerNo);
//           const actualCheckDigit = parseInt(
//             container.containerNo.slice(-1),
//             10
//           );
//           if (checkDigit !== actualCheckDigit) {
//             checkDigitErrors.push(
//               `Container ${vehicleIndex + 1}.${
//                 containerIndex + 1
//               }: Invalid check digit. Expected ${checkDigit}, got ${actualCheckDigit}`
//             );
//           }
//         }
//       });
//     });

//     if (Object.keys(allErrors).length > 0 || checkDigitErrors.length > 0) {
//       const errorMessages = [
//         ...Object.values(allErrors),
//         ...checkDigitErrors,
//       ].join("\n");
//       toast.error(`Please fix the following errors:\n${errorMessages}`);
//       setIsSubmitting(false);
//       return;
//     }

//     try {
//       const payload = {
//         transport_request_id: transportRequestId,
//         vehicles: vehicles.map((vehicle) => ({
//           transporter_id: vehicle.transporter_id,
//           transporter_name: vehicle.transporterName,
//           vehicle_number: vehicle.vehicleNumber,
//           driver_name: vehicle.driverName,
//           driver_contact: vehicle.driverContact,
//           license_number: vehicle.licenseNumber,
//           license_expiry: vehicle.licenseExpiry,
//           additional_charges: parseFloat(vehicle.additionalCharges) || 0,
//           service_charges: vehicle.serviceCharges,
//           total_charge: parseFloat(vehicle.totalCharge) || 0,
//           containers: vehicle.containers.map((container) => ({
//             container_id: container.container_id,
//             container_no: container.containerNo,
//             line: container.line,
//             seal_no: container.sealNo,
//             seal1: container.seal1,
//             seal2: container.seal2,
//             container_total_weight:
//               parseFloat(container.containerTotalWeight) || 0,
//             cargo_total_weight: parseFloat(container.cargoTotalWeight) || 0,
//             container_type: container.containerType,
//             container_size: container.containerSize,
//           })),
//         })),
//       };

//       const response = await fetch(
//         "http://localhost:4000/api/84/bulk-vehicles-with-containers",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(payload),
//         }
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Failed to submit data");
//       }

//       toast.success("Vehicles and containers updated successfully");
//       sessionStorage.setItem("vehicleContainerData", JSON.stringify(vehicles));
//       // Optionally, refresh the data
//       const refreshResponse = await transporterAPI.getTransporterByRequestId(
//         transportRequestId
//       );
//       if (refreshResponse.success && Array.isArray(refreshResponse.data)) {
//         const formattedVehicles = refreshResponse.data.map((transporter) => ({
//           transporter_id: transporter.transporter_id || null,
//           transporterName: transporter.transporter_name || "",
//           vehicleNumber: transporter.vehicle_number || "",
//           driverName: transporter.driver_name || "",
//           driverContact: transporter.driver_contact || "",
//           licenseNumber: transporter.license_number || "",
//           licenseExpiry: transporter.license_expiry || "",
//           additionalCharges: transporter.additional_charges?.toString() || "",
//           serviceCharges: transporter.service_charges || "",
//           totalCharge: transporter.total_charge?.toString() || "",
//           containers:
//             Array.isArray(transporter.containers) &&
//             transporter.containers.length > 0
//               ? transporter.containers.map((container) => ({
//                   container_id: container.container_id || null,
//                   containerNo: container.container_no || "",
//                   line: container.line || "",
//                   sealNo: container.seal_no || "",
//                   seal1: container.seal1 || "",
//                   seal2: container.seal2 || "",
//                   containerTotalWeight:
//                     container.container_total_weight?.toString() || "",
//                   cargoTotalWeight:
//                     container.cargo_total_weight?.toString() || "",
//                   containerType: container.container_type || "",
//                   containerSize: container.container_size || "",
//                 }))
//               : [
//                   {
//                     container_id: null,
//                     containerNo: "",
//                     line: "",
//                     sealNo: "",
//                     seal1: "",
//                     seal2: "",
//                     containerTotalWeight: "",
//                     cargoTotalWeight: "",
//                     containerType: "",
//                     containerSize: "",
//                   },
//                 ],
//         }));
//         setVehicles(formattedVehicles);
//       }
//     } catch (error) {
//       console.error("Error submitting data:", error);
//       toast.error(error.message || "Failed to update vehicles and containers");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
//           <p className="mt-4 text-gray-600">Loading data...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
//       <ToastContainer
//         position="top-right"
//         autoClose={5000}
//         hideProgressBar={false}
//         newestOnTop
//         closeOnClick
//         rtl={false}
//         pauseOnFocusLoss
//         draggable
//         pauseOnHover
//       />
//       <div className="max-w-7xl mx-auto">
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//           <div className="flex justify-between items-center mb-6">
//             <div>
//               <h1 className="text-2xl font-bold text-gray-900">
//                 Bulk Add/Update Vehicles and Containers
//               </h1>
//               {transportRequestId && (
//                 <p className="text-sm text-gray-600 mt-1">
//                   Request ID:{" "}
//                   <span className="font-medium">{transportRequestId}</span>
//                 </p>
//               )}
//             </div>
//             <button
//               onClick={() => navigate(-1)}
//               className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//             >
//               <svg
//                 className="w-4 h-4 mr-2"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M10 19l-7-7m0 0l7-7m-7 7h18"
//                 />
//               </svg>
//               Back
//             </button>
//           </div>
//           <form onSubmit={handleSubmit}>
//             {vehicles.map((vehicle, vehicleIndex) => (
//               <div key={vehicleIndex} className="mb-8 border-b pb-6">
//                 <div className="flex justify-between items-center mb-4">
//                   <h2 className="text-lg font-semibold text-gray-900">
//                     Vehicle #{vehicleIndex + 1}{" "}
//                     {vehicle.transporter_id && (
//                       <span className="text-sm text-gray-500">
//                         (ID: {vehicle.transporter_id})
//                       </span>
//                     )}
//                   </h2>
//                   {vehicles.length > 1 && (
//                     <button
//                       type="button"
//                       onClick={() => removeVehicle(vehicleIndex)}
//                       className="text-red-600 hover:text-red-800"
//                       title="Remove Vehicle"
//                     >
//                       <svg
//                         className="h-5 w-5"
//                         fill="none"
//                         viewBox="0 0 24 24"
//                         stroke="currentColor"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M6 18L18 6M6 6l12 12"
//                         />
//                       </svg>
//                     </button>
//                   )}
//                 </div>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Transporter Name *
//                     </label>
//                     <VendorSearchInput
//                       value={vehicle.transporterName}
//                       onChange={(value) =>
//                         updateVehicleData(
//                           vehicleIndex,
//                           "transporterName",
//                           value
//                         )
//                       }
//                       placeholder="Search and select transporter"
//                     />
//                     {validationErrors[`${vehicleIndex}-transporterName`] && (
//                       <p className="text-red-500 text-xs mt-1">
//                         {validationErrors[`${vehicleIndex}-transporterName`]}
//                       </p>
//                     )}
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Vehicle Number *
//                     </label>
//                     <input
//                       type="text"
//                       className={`w-full border ${
//                         validationErrors[`${vehicleIndex}-vehicleNumber`]
//                           ? "border-red-500"
//                           : "border-gray-300"
//                       } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
//                       value={vehicle.vehicleNumber}
//                       onChange={(e) =>
//                         updateVehicleData(
//                           vehicleIndex,
//                           "vehicleNumber",
//                           e.target.value.toUpperCase()
//                         )
//                       }
//                       placeholder="e.g., MH12AB1234"
//                       required
//                     />
//                     {validationErrors[`${vehicleIndex}-vehicleNumber`] && (
//                       <p className="text-red-500 text-xs mt-1">
//                         {validationErrors[`${vehicleIndex}-vehicleNumber`]}
//                       </p>
//                     )}
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Driver Name *
//                     </label>
//                     <DriverSearchInput
//                       value={vehicle.driverName}
//                       onChange={(value, driverData) =>
//                         handleDriverSelection(vehicleIndex, value, driverData)
//                       }
//                       vendorName={vehicle.transporterName}
//                       placeholder="Select driver"
//                     />
//                     {validationErrors[`${vehicleIndex}-driverName`] && (
//                       <p className="text-red-500 text-xs mt-1">
//                         {validationErrors[`${vehicleIndex}-driverName`]}
//                       </p>
//                     )}
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Driver Contact *
//                     </label>
//                     <input
//                       type="tel"
//                       className={`w-full border ${
//                         validationErrors[`${vehicleIndex}-driverContact`]
//                           ? "border-red-500"
//                           : "border-gray-300"
//                       } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
//                       value={vehicle.driverContact}
//                       onChange={(e) =>
//                         updateVehicleData(
//                           vehicleIndex,
//                           "driverContact",
//                           e.target.value.replace(/\D/g, "").slice(0, 10)
//                         )
//                       }
//                       placeholder="10-digit mobile number"
//                       maxLength="10"
//                       required
//                     />
//                     {validationErrors[`${vehicleIndex}-driverContact`] && (
//                       <p className="text-red-500 text-xs mt-1">
//                         {validationErrors[`${vehicleIndex}-driverContact`]}
//                       </p>
//                     )}
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       License Number *
//                     </label>
//                     <input
//                       type="text"
//                       className={`w-full border ${
//                         validationErrors[`${vehicleIndex}-licenseNumber`]
//                           ? "border-red-500"
//                           : "border-gray-300"
//                       } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
//                       value={vehicle.licenseNumber}
//                       onChange={(e) =>
//                         updateVehicleData(
//                           vehicleIndex,
//                           "licenseNumber",
//                           e.target.value.toUpperCase()
//                         )
//                       }
//                       placeholder="License number"
//                       required
//                     />
//                     {validationErrors[`${vehicleIndex}-licenseNumber`] && (
//                       <p className="text-red-500 text-xs mt-1">
//                         {validationErrors[`${vehicleIndex}-licenseNumber`]}
//                       </p>
//                     )}
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       License Expiry *
//                     </label>
//                     <input
//                       type="date"
//                       className={`w-full border ${
//                         validationErrors[`${vehicleIndex}-licenseExpiry`]
//                           ? "border-red-500"
//                           : "border-gray-300"
//                       } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
//                       value={vehicle.licenseExpiry}
//                       onChange={(e) =>
//                         updateVehicleData(
//                           vehicleIndex,
//                           "licenseExpiry",
//                           e.target.value
//                         )
//                       }
//                       min={new Date().toISOString().split("T")[0]}
//                       required
//                     />
//                     {validationErrors[`${vehicleIndex}-licenseExpiry`] && (
//                       <p className="text-red-500 text-xs mt-1">
//                         {validationErrors[`${vehicleIndex}-licenseExpiry`]}
//                       </p>
//                     )}
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Additional Charges
//                     </label>
//                     <input
//                       type="number"
//                       step="0.01"
//                       className={`w-full border ${
//                         validationErrors[`${vehicleIndex}-additionalCharges`]
//                           ? "border-red-500"
//                           : "border-gray-300"
//                       } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
//                       value={vehicle.additionalCharges}
//                       onChange={(e) =>
//                         updateVehicleData(
//                           vehicleIndex,
//                           "additionalCharges",
//                           e.target.value
//                         )
//                       }
//                       placeholder="e.g., 500.00"
//                     />
//                     {validationErrors[`${vehicleIndex}-additionalCharges`] && (
//                       <p className="text-red-500 text-xs mt-1">
//                         {validationErrors[`${vehicleIndex}-additionalCharges`]}
//                       </p>
//                     )}
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Service Charges
//                     </label>
//                     <input
//                       type="text"
//                       className={`w-full border ${
//                         validationErrors[`${vehicleIndex}-serviceCharges`]
//                           ? "border-red-500"
//                           : "border-gray-300"
//                       } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
//                       value={vehicle.serviceCharges}
//                       onChange={(e) =>
//                         updateVehicleData(
//                           vehicleIndex,
//                           "serviceCharges",
//                           e.target.value
//                         )
//                       }
//                       placeholder="e.g., Loading: 200, Unloading: 150"
//                     />
//                     {validationErrors[`${vehicleIndex}-serviceCharges`] && (
//                       <p className="text-red-500 text-xs mt-1">
//                         {validationErrors[`${vehicleIndex}-serviceCharges`]}
//                       </p>
//                     )}
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Total Charge
//                     </label>
//                     <input
//                       type="number"
//                       step="0.01"
//                       className={`w-full border ${
//                         validationErrors[`${vehicleIndex}-totalCharge`]
//                           ? "border-red-500"
//                           : "border-gray-300"
//                       } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
//                       value={vehicle.totalCharge}
//                       onChange={(e) =>
//                         updateVehicleData(
//                           vehicleIndex,
//                           "totalCharge",
//                           e.target.value
//                         )
//                       }
//                       placeholder="e.g., 5000.00"
//                     />
//                     {validationErrors[`${vehicleIndex}-totalCharge`] && (
//                       <p className="text-red-500 text-xs mt-1">
//                         {validationErrors[`${vehicleIndex}-totalCharge`]}
//                       </p>
//                     )}
//                   </div>
//                 </div>
//                 <div className="mt-6">
//                   <h3 className="text-md font-medium text-gray-900 mb-4">
//                     Containers for Vehicle #{vehicleIndex + 1}
//                   </h3>
//                   {vehicle.containers.map((container, containerIndex) => (
//                     <div
//                       key={containerIndex}
//                       className="border rounded-lg p-4 mb-4 bg-gray-50"
//                     >
//                       <div className="flex justify-between items-center mb-4">
//                         <h4 className="text-sm font-medium text-gray-700">
//                           Container #{containerIndex + 1}{" "}
//                           {container.container_id && (
//                             <span className="text-xs text-gray-500">
//                               (ID: {container.container_id})
//                             </span>
//                           )}
//                         </h4>
//                         {vehicle.containers.length > 1 && (
//                           <button
//                             type="button"
//                             onClick={() =>
//                               removeContainer(vehicleIndex, containerIndex)
//                             }
//                             className="text-red-600 hover:text-red-800"
//                             title="Remove Container"
//                           >
//                             <svg
//                               className="h-5 w-5"
//                               fill="none"
//                               viewBox="0 0 24 24"
//                               stroke="currentColor"
//                             >
//                               <path
//                                 strokeLinecap="round"
//                                 strokeLinejoin="round"
//                                 strokeWidth={2}
//                                 d="M6 18L18 6M6 6l12 12"
//                               />
//                             </svg>
//                           </button>
//                         )}
//                       </div>
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                             Container Number *
//                           </label>
//                           <input
//                             type="text"
//                             className={`w-full border ${
//                               validationErrors[
//                                 `${vehicleIndex}-${containerIndex}-containerNo`
//                               ]
//                                 ? "border-red-500"
//                                 : "border-gray-300"
//                             } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
//                             value={container.containerNo}
//                             onChange={(e) =>
//                               updateContainerData(
//                                 vehicleIndex,
//                                 containerIndex,
//                                 "containerNo",
//                                 e.target.value
//                               )
//                             }
//                             placeholder="e.g., MSKU1234567"
//                             required
//                           />
//                           {validationErrors[
//                             `${vehicleIndex}-${containerIndex}-containerNo`
//                           ] && (
//                             <p className="text-red-500 text-xs mt-1">
//                               {
//                                 validationErrors[
//                                   `${vehicleIndex}-${containerIndex}-containerNo`
//                                 ]
//                               }
//                             </p>
//                           )}
//                         </div>
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                             Shipping Line *
//                           </label>
//                           <input
//                             type="text"
//                             className={`w-full border ${
//                               validationErrors[
//                                 `${vehicleIndex}-${containerIndex}-line`
//                               ]
//                                 ? "border-red-500"
//                                 : "border-gray-300"
//                             } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
//                             value={container.line}
//                             onChange={(e) =>
//                               updateContainerData(
//                                 vehicleIndex,
//                                 containerIndex,
//                                 "line",
//                                 e.target.value
//                               )
//                             }
//                             placeholder="e.g., Maersk"
//                             required
//                           />
//                           {validationErrors[
//                             `${vehicleIndex}-${containerIndex}-line`
//                           ] && (
//                             <p className="text-red-500 text-xs mt-1">
//                               {
//                                 validationErrors[
//                                   `${vehicleIndex}-${containerIndex}-line`
//                                 ]
//                               }
//                             </p>
//                           )}
//                         </div>
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                             Seal Number *
//                           </label>
//                           <input
//                             type="text"
//                             className={`w-full border ${
//                               validationErrors[
//                                 `${vehicleIndex}-${containerIndex}-sealNo`
//                               ]
//                                 ? "border-red-500"
//                                 : "border-gray-300"
//                             } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
//                             value={container.sealNo}
//                             onChange={(e) =>
//                               updateContainerData(
//                                 vehicleIndex,
//                                 containerIndex,
//                                 "sealNo",
//                                 e.target.value.toUpperCase()
//                               )
//                             }
//                             placeholder="e.g., SEAL001234"
//                             required
//                           />
//                           {validationErrors[
//                             `${vehicleIndex}-${containerIndex}-sealNo`
//                           ] && (
//                             <p className="text-red-500 text-xs mt-1">
//                               {
//                                 validationErrors[
//                                   `${vehicleIndex}-${containerIndex}-sealNo`
//                                 ]
//                               }
//                             </p>
//                           )}
//                         </div>
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                             Seal 1
//                           </label>
//                           <input
//                             type="text"
//                             className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                             value={container.seal1}
//                             onChange={(e) =>
//                               updateContainerData(
//                                 vehicleIndex,
//                                 containerIndex,
//                                 "seal1",
//                                 e.target.value.toUpperCase()
//                               )
//                             }
//                             placeholder="e.g., SEAL1_001"
//                           />
//                         </div>
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                             Seal 2
//                           </label>
//                           <input
//                             type="text"
//                             className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                             value={container.seal2}
//                             onChange={(e) =>
//                               updateContainerData(
//                                 vehicleIndex,
//                                 containerIndex,
//                                 "seal2",
//                                 e.target.value.toUpperCase()
//                               )
//                             }
//                             placeholder="e.g., SEAL2_001"
//                           />
//                         </div>
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                             Container Weight (kg) *
//                           </label>
//                           <input
//                             type="number"
//                             step="0.01"
//                             className={`w-full border ${
//                               validationErrors[
//                                 `${vehicleIndex}-${containerIndex}-containerTotalWeight`
//                               ]
//                                 ? "border-red-500"
//                                 : "border-gray-300"
//                             } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
//                             value={container.containerTotalWeight}
//                             onChange={(e) =>
//                               updateContainerData(
//                                 vehicleIndex,
//                                 containerIndex,
//                                 "containerTotalWeight",
//                                 e.target.value
//                               )
//                             }
//                             placeholder="e.g., 25000.50"
//                             required
//                           />
//                           {validationErrors[
//                             `${vehicleIndex}-${containerIndex}-containerTotalWeight`
//                           ] && (
//                             <p className="text-red-500 text-xs mt-1">
//                               {
//                                 validationErrors[
//                                   `${vehicleIndex}-${containerIndex}-containerTotalWeight`
//                                 ]
//                               }
//                             </p>
//                           )}
//                         </div>
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                             Cargo Weight (kg) *
//                           </label>
//                           <input
//                             type="number"
//                             step="0.01"
//                             className={`w-full border ${
//                               validationErrors[
//                                 `${vehicleIndex}-${containerIndex}-cargoTotalWeight`
//                               ]
//                                 ? "border-red-500"
//                                 : "border-gray-300"
//                             } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
//                             value={container.cargoTotalWeight}
//                             onChange={(e) =>
//                               updateContainerData(
//                                 vehicleIndex,
//                                 containerIndex,
//                                 "cargoTotalWeight",
//                                 e.target.value
//                               )
//                             }
//                             placeholder="e.g., 20000.00"
//                             required
//                           />
//                           {validationErrors[
//                             `${vehicleIndex}-${containerIndex}-cargoTotalWeight`
//                           ] && (
//                             <p className="text-red-500 text-xs mt-1">
//                               {
//                                 validationErrors[
//                                   `${vehicleIndex}-${containerIndex}-cargoTotalWeight`
//                                 ]
//                               }
//                             </p>
//                           )}
//                         </div>
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                             Container Type *
//                           </label>
//                           <input
//                             type="text"
//                             className={`w-full border ${
//                               validationErrors[
//                                 `${vehicleIndex}-${containerIndex}-containerType`
//                               ]
//                                 ? "border-red-500"
//                                 : "border-gray-300"
//                             } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
//                             value={container.containerType}
//                             onChange={(e) =>
//                               updateContainerData(
//                                 vehicleIndex,
//                                 containerIndex,
//                                 "containerType",
//                                 e.target.value
//                               )
//                             }
//                             placeholder="e.g., 40HC"
//                             required
//                           />
//                           {validationErrors[
//                             `${vehicleIndex}-${containerIndex}-containerType`
//                           ] && (
//                             <p className="text-red-500 text-xs mt-1">
//                               {
//                                 validationErrors[
//                                   `${vehicleIndex}-${containerIndex}-containerType`
//                                 ]
//                               }
//                             </p>
//                           )}
//                         </div>
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                             Container Size *
//                           </label>
//                           <input
//                             type="text"
//                             className={`w-full border ${
//                               validationErrors[
//                                 `${vehicleIndex}-${containerIndex}-containerSize`
//                               ]
//                                 ? "border-red-500"
//                                 : "border-gray-300"
//                             } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
//                             value={container.containerSize}
//                             onChange={(e) =>
//                               updateContainerData(
//                                 vehicleIndex,
//                                 containerIndex,
//                                 "containerSize",
//                                 e.target.value
//                               )
//                             }
//                             placeholder="e.g., 40ft"
//                             required
//                           />
//                           {validationErrors[
//                             `${vehicleIndex}-${containerIndex}-containerSize`
//                           ] && (
//                             <p className="text-red-500 text-xs mt-1">
//                               {
//                                 validationErrors[
//                                   `${vehicleIndex}-${containerIndex}-containerSize`
//                                 ]
//                               }
//                             </p>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                   <button
//                     type="button"
//                     onClick={() => addContainer(vehicleIndex)}
//                     className="mt-2 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//                   >
//                     Add Container
//                   </button>
//                 </div>
//               </div>
//             ))}
//             <div className="flex justify-between mt-6">
//               <button
//                 type="button"
//                 onClick={addVehicle}
//                 className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
//               >
//                 Add Vehicle
//               </button>
//               <div className="flex space-x-4">
//                 <button
//                   type="button"
//                   onClick={() => navigate(-1)}
//                   className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={isSubmitting}
//                   className={`px-8 py-2 rounded-md text-white font-medium ${
//                     isSubmitting
//                       ? "bg-gray-400 cursor-not-allowed"
//                       : "bg-blue-600 hover:bg-blue-700"
//                   } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center`}
//                 >
//                   {isSubmitting ? (
//                     <>
//                       <svg
//                         className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
//                         xmlns="http://www.w3.org/2000/svg"
//                         fill="none"
//                         viewBox="0 0 24 24"
//                       >
//                         <circle
//                           className="opacity-25"
//                           cx="12"
//                           cy="12"
//                           r="10"
//                           stroke="currentColor"
//                           strokeWidth="4"
//                         ></circle>
//                         <path
//                           className="opacity-75"
//                           fill="currentColor"
//                           d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                         ></path>
//                       </svg>
//                       Submitting...
//                     </>
//                   ) : (
//                     "Save All"
//                   )}
//                 </button>
//               </div>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default BulkVehicleContainerForm;

import { useState, useEffect, useRef } from "react";
import { driverAPI, vendorAPI, vehicleAPI } from "../../utils/Api";
import { use } from "react";
import ContainerDetailsPage from "../../Pages/Containerdetailspage";

const VendorSearchInput = ({ value, onChange, placeholder }) => {
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [dropdownPosition, setDropdownPosition] = useState("bottom");

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Self option object
  const selfOption = {
    VENDOR_ID: "SELF",
    VENDOR_NAME: "Self",
    VENDOR_CODE: "SELF",
    CITY: "Own Vehicles",
    ADDRESS: "Own Vehicles",
  };

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true);
      try {
        const response = await vehicleAPI.getAllvehicles();
        const vehiclesData = response.data || response || [];
        if (Array.isArray(vehiclesData)) {
          setVehicles(vehiclesData);
        } else {
          console.error("Vehicles data is not an array:", vehiclesData);
        }
      } catch (error) {
        console.error("Error fetching vehicles:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      try {
        const response = await vendorAPI.getAllVendors();
        const vendorsData = response.data || response || [];
        if (Array.isArray(vendorsData)) {
          // Always add "Self" option at the beginning
          const vendorsWithSelf = [selfOption, ...vendorsData];
          setVendors(vendorsWithSelf);
          setFilteredVendors(vendorsWithSelf);
        }
      } catch (error) {
        console.error("Error fetching vendors:", error);
        // Even if API fails, show Self option
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

  // Simple dropdown position calculation
  const calculateDropdownPosition = () => {
    if (!inputRef.current) return;

    const inputRect = inputRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 200; // Fixed smaller height

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
    // Delay calculation to ensure filteredVendors is updated
    setTimeout(calculateDropdownPosition, 0);
  };

  // Handle click outside to close dropdown
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

    const handleScroll = () => {
      if (isOpen) {
        calculateDropdownPosition();
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
  }, [isOpen, filteredVendors.length]);

  // Simple dropdown position styles
  const getDropdownStyles = () => {
    if (!inputRef.current || !isOpen) return { display: "none" };

    const inputRect = inputRef.current.getBoundingClientRect();

    const styles = {
      width: `${Math.max(inputRect.width, 200)}px`,
      maxHeight: "200px", // Fixed height
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

const DriverSearchInput = ({ value, onChange, vendorName, placeholder }) => {
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [loading, setLoading] = useState(false);
  const [vendorId, setVendorId] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState("bottom");
  const [vehicles, setVehicles] = useState([]);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // First effect to get vendor ID when vendor name changes
  useEffect(() => {
    const getVendorId = async () => {
      if (!vendorName) {
        setVendorId(null);
        return;
      }

      // Handle "Self" vendor specially
      if (vendorName === "Self") {
        setVendorId("SELF");
        return;
      }

      try {
        console.log("Fetching vendors for name:", vendorName);
        const vendorsResponse = await vendorAPI.getAllVendors();
        const vendors = vendorsResponse.data || vendorsResponse || [];
        console.log("All vendors:", vendors);
        const vendor = vendors.find((v) => v.VENDOR_NAME === vendorName);

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

  // Second effect to fetch drivers/vehicles when vendor ID changes
  useEffect(() => {
    const fetchData = async () => {
      if (!vendorId) {
        console.log("No vendor ID, clearing drivers");
        setDrivers([]);
        setFilteredDrivers([]);
        setVehicles([]);
        return;
      }

      setLoading(true);
      try {
        if (vendorId === "SELF") {
          // Fetch vehicles for self option
          console.log("Fetching vehicles for Self option");
          const vehiclesResponse = await vehicleAPI.getAllvehicles();
          console.log("Vehicles response for SELF:", vehiclesResponse);

          // Handle different response structures
          let vehiclesData = [];
          if (vehiclesResponse && Array.isArray(vehiclesResponse)) {
            vehiclesData = vehiclesResponse;
          } else if (
            vehiclesResponse &&
            vehiclesResponse.data &&
            Array.isArray(vehiclesResponse.data)
          ) {
            vehiclesData = vehiclesResponse.data;
          } else if (
            vehiclesResponse &&
            Array.isArray(vehiclesResponse.vehicles)
          ) {
            vehiclesData = vehiclesResponse.vehicles;
          } else {
            console.warn(
              "Unexpected vehicles response structure:",
              vehiclesResponse
            );
            vehiclesData = [];
          }

          console.log("Processed vehicles data:", vehiclesData);
          console.log("Number of vehicles found:", vehiclesData.length);

          if (vehiclesData.length === 0) {
            console.warn("No vehicles found in response");
            setDrivers([]);
            setFilteredDrivers([]);
            setVehicles([]);
            return;
          }

          // Convert vehicles to driver-like format for compatibility
          const vehicleDrivers = vehiclesData.map((vehicle, index) => {
            console.log(`Processing vehicle ${index + 1}:`, vehicle);

            const driverName =
              vehicle.OWNER_NAME ||
              vehicle.owner_name ||
              `Owner of ${
                vehicle.VEHICLE_NUMBER ||
                vehicle.vehicle_number ||
                "Unknown Vehicle"
              }`;

            const vehicleNumber =
              vehicle.VEHICLE_NUMBER ||
              vehicle.vehicle_number ||
              vehicle.VEHICLE_NO ||
              "";
            const ownerContact =
              vehicle.OWNER_CONTACT ||
              vehicle.owner_contact ||
              vehicle.CONTACT_NO ||
              "";
            const vehicleType =
              vehicle.VEHICLE_TYPE || vehicle.vehicle_type || "";
            const make = vehicle.MAKE || vehicle.make || "";
            const model = vehicle.MODEL || vehicle.model || "";
            const year = vehicle.YEAR || vehicle.year || "";
            const vehicleId =
              vehicle.VEHICLE_ID || vehicle.vehicle_id || vehicle.id || index;

            return {
              DRIVER_ID: `VEHICLE_${vehicleId}`,
              DRIVER_NAME: driverName,
              CONTACT_NO: ownerContact,
              MOBILE_NO: ownerContact,
              DL_NO: "", // Vehicles don't have driver license info
              DL_RENEWABLE_DATE: null,
              VEHICLE_NO: vehicleNumber,
              VEHICLE_ID: vehicleId,
              VEHICLE_TYPE: vehicleType,
              MAKE: make,
              MODEL: model,
              YEAR: year,
              IS_SELF_VEHICLE: true, // Flag to identify self vehicles
            };
          });

          console.log("Converted vehicle drivers:", vehicleDrivers);

          setDrivers(vehicleDrivers);
          setFilteredDrivers(vehicleDrivers);
          setVehicles(vehiclesData);
        } else {
          // Fetch drivers for regular vendor
          console.log("Fetching drivers for vendor ID:", vendorId);
          const driversResponse = await driverAPI.getDriversByVendorId(
            vendorId
          );
          console.log("Drivers response:", driversResponse);
          const driversData = driversResponse.data || driversResponse || [];
          console.log("Drivers data:", driversData);
          setDrivers(driversData);
          setFilteredDrivers(driversData);
          setVehicles([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          response: error.response,
        });
        setDrivers([]);
        setFilteredDrivers([]);
        setVehicles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
      setDropdownPosition("top");
    } else {
      setDropdownPosition("bottom");
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
    setTimeout(calculateDropdownPosition, 0);
  };

  // Handle click outside to close dropdown
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
  }, [isOpen, filteredDrivers.length]);

  // Simple dropdown position styles
  const getDropdownStyles = () => {
    if (!inputRef.current || !isOpen) return { display: "none" };

    const inputRect = inputRef.current.getBoundingClientRect();

    const styles = {
      width: `${Math.max(inputRect.width, 250)}px`, // Increased width for vehicle info
      maxHeight: "200px", // Fixed height
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

  // Helper function to format vehicle info
  const getVehicleInfo = (driver) => {
    if (vendorId === "SELF" || driver.IS_SELF_VEHICLE) {
      // For self vehicles, show more detailed info
      const vehicleInfo = [];
      if (driver.VEHICLE_NO) vehicleInfo.push(`${driver.VEHICLE_NO}`);
      if (driver.VEHICLE_TYPE) vehicleInfo.push(`(${driver.VEHICLE_TYPE})`);
      if (driver.MAKE && driver.MODEL)
        vehicleInfo.push(`${driver.MAKE} ${driver.MODEL}`);

      return vehicleInfo.length > 0 ? vehicleInfo.join(" ") : "Own Vehicle";
    } else {
      // For vendor drivers
      if (driver.VEHICLE_NO) {
        return `Vehicle: ${driver.VEHICLE_NO}`;
      } else if (driver.VEHICLE_ID) {
        return `Vehicle ID: ${driver.VEHICLE_ID}`;
      } else {
        return "No vehicle assigned";
      }
    }
  };

  // Helper function to get contact info
  const getContactInfo = (driver) => {
    const contact = driver.CONTACT_NO || driver.MOBILE_NO;
    const license = driver.DL_NO;

    if (vendorId === "SELF" || driver.IS_SELF_VEHICLE) {
      // For self vehicles, show owner contact and year
      const info = [];
      if (contact) info.push(contact);
      if (driver.YEAR) info.push(`Year: ${driver.YEAR}`);
      return info.length > 0 ? info.join(" | ") : "No contact info";
    } else {
      // For vendor drivers
      if (contact && license) {
        return `${contact} | License: ${license}`;
      } else if (contact) {
        return contact;
      } else if (license) {
        return `License: ${license}`;
      } else {
        return "No contact info";
      }
    }
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

      {/* Enhanced dropdown with vehicle information */}
      {isOpen && filteredDrivers.length > 0 && (
        <div
          ref={dropdownRef}
          className="fixed bg-white border border-gray-300 rounded-md shadow-lg overflow-y-auto"
          style={getDropdownStyles()}
        >
          {filteredDrivers.map((driver) => (
            <div
              key={driver.DRIVER_ID}
              className={`px-3 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                vendorId === "SELF" || driver.IS_SELF_VEHICLE
                  ? "bg-green-50"
                  : ""
              }`}
              onClick={() => {
                console.log("Selected driver/vehicle:", driver);
                setSearchTerm(driver.DRIVER_NAME);
                onChange(driver.DRIVER_NAME, driver);
                setIsOpen(false);
              }}
            >
              <div className="font-medium text-gray-900 truncate">
                {driver.DRIVER_NAME}
                {(vendorId === "SELF" || driver.IS_SELF_VEHICLE) && (
                  <span className="ml-2 text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                    Own
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500 truncate mt-1">
                {getContactInfo(driver)}
              </div>
              <div
                className={`text-sm truncate mt-1 ${
                  vendorId === "SELF" || driver.IS_SELF_VEHICLE
                    ? "text-green-600"
                    : "text-blue-600"
                }`}
              >
                {getVehicleInfo(driver)}
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && filteredDrivers.length === 0 && searchTerm && !loading && (
        <div
          ref={dropdownRef}
          className="fixed bg-white border border-gray-300 rounded-md shadow-lg"
          style={getDropdownStyles()}
        >
          <div className="px-3 py-2 text-gray-500 text-sm">
            {vendorId === "SELF"
              ? `No vehicles found matching "${searchTerm}"`
              : `No drivers found matching "${searchTerm}"`}
          </div>
        </div>
      )}

      {isOpen &&
        filteredDrivers.length === 0 &&
        !searchTerm &&
        !loading &&
        vendorName && (
          <div
            ref={dropdownRef}
            className="fixed bg-white border border-gray-300 rounded-md shadow-lg"
            style={getDropdownStyles()}
          >
            <div className="px-3 py-2 text-gray-500 text-sm">
              {vendorId === "SELF"
                ? "No vehicles available"
                : "No drivers available for this vendor"}
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

// Updated table component with vehicle number auto-fill
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
  const handleVendorChange = (index, vendorName) => {
    // Update both vendorName and transporterName for backward compatibility
    updateVehicleData(index, "vendorName", vendorName);
    updateVehicleData(index, "transporterName", vendorName); // Keep old prop updated
  };

  // Updated driver selection handler with vehicle number auto-fill
  const handleDriverSelection = (index, driverName, driverData) => {
    if (driverData) {
      updateVehicleData(index, "driverName", driverName);
      updateVehicleData(
        index,
        "driverContact",
        driverData.MOBILE_NO || driverData.CONTACT_NO || ""
      );
      updateVehicleData(index, "licenseNumber", driverData.DL_NO || "");
      updateVehicleData(index, "vehicleNumber", driverData.VEHICLE_NO || ""); // NEW: Auto-fill vehicle number

      if (driverData.DL_RENEWABLE_DATE) {
        const date = new Date(driverData.DL_RENEWABLE_DATE);
        const formattedDate = date.toISOString().split("T")[0];
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
                    onChange={(value, driverData) =>
                      handleDriverSelection(index, value, driverData)
                    }
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

// // import React, { useState, useEffect, useRef } from "react";
// // import { toast } from "react-toastify";
// // import { useNavigate } from "react-router-dom";
// // import { vendorAPI, driverAPI, vehicleAPI, transporterAPI } from "../../utils/Api";
// // import { ToastContainer } from "react-toastify";
// // import "react-toastify/dist/ReactToastify.css";

// // // VendorSearchInput Component
// // const VendorSearchInput = ({ value, onChange, placeholder }) => {
// //   const [vendors, setVendors] = useState([]);
// //   const [filteredVendors, setFilteredVendors] = useState([]);
// //   const [isOpen, setIsOpen] = useState(false);
// //   const [searchTerm, setSearchTerm] = useState(value || "");
// //   const [loading, setLoading] = useState(false);
// //   const [dropdownPosition, setDropdownPosition] = useState("bottom");

// //   const inputRef = useRef(null);
// //   const dropdownRef = useRef(null);

// //   const selfOption = {
// //     VENDOR_ID: "SELF",
// //     VENDOR_NAME: "Self",
// //     VENDOR_CODE: "SELF",
// //     CITY: "Own Vehicles",
// //     ADDRESS: "Own Vehicles",
// //   };

// //   useEffect(() => {
// //     const fetchVendors = async () => {
// //       setLoading(true);
// //       try {
// //         const response = await vendorAPI.getAllVendors();
// //         const vendorsData = response.data || response || [];
// //         if (Array.isArray(vendorsData)) {
// //           const vendorsWithSelf = [selfOption, ...vendorsData];
// //           setVendors(vendorsWithSelf);
// //           setFilteredVendors(vendorsWithSelf);
// //         }
// //       } catch (error) {
// //         console.error("Error fetching vendors:", error);
// //         setVendors([selfOption]);
// //         setFilteredVendors([selfOption]);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };
// //     fetchVendors();
// //   }, []);

// //   useEffect(() => {
// //     if (searchTerm && vendors.length > 0) {
// //       const filtered = vendors.filter((v) =>
// //         v.VENDOR_NAME.toLowerCase().includes(searchTerm.toLowerCase())
// //       );
// //       setFilteredVendors(filtered);
// //     } else {
// //       setFilteredVendors(vendors);
// //     }
// //   }, [searchTerm, vendors]);

// //   useEffect(() => {
// //     setSearchTerm(value || "");
// //   }, [value]);

// //   const calculateDropdownPosition = () => {
// //     if (!inputRef.current) return;
// //     const inputRect = inputRef.current.getBoundingClientRect();
// //     const viewportHeight = window.innerHeight;
// //     const dropdownHeight = 200;
// //     const spaceBelow = viewportHeight - inputRect.bottom;
// //     const spaceAbove = inputRect.top;
// //     setDropdownPosition(
// //       spaceBelow < dropdownHeight && spaceAbove > dropdownHeight
// //         ? "top"
// //         : "bottom"
// //     );
// //   };

// //   const handleFocus = () => {
// //     setIsOpen(true);
// //     setTimeout(calculateDropdownPosition, 0);
// //   };

// //   useEffect(() => {
// //     const handleClickOutside = (event) => {
// //       if (
// //         dropdownRef.current &&
// //         !dropdownRef.current.contains(event.target) &&
// //         inputRef.current &&
// //         !inputRef.current.contains(event.target)
// //       ) {
// //         setIsOpen(false);
// //       }
// //     };
// //     const handleScroll = () => {
// //       if (isOpen) calculateDropdownPosition();
// //     };
// //     if (isOpen) {
// //       document.addEventListener("mousedown", handleClickOutside);
// //       window.addEventListener("scroll", calculateDropdownPosition, true);
// //       window.addEventListener("resize", calculateDropdownPosition);
// //     }
// //     return () => {
// //       document.removeEventListener("mousedown", handleClickOutside);
// //       window.removeEventListener("scroll", calculateDropdownPosition, true);
// //       window.removeEventListener("resize", calculateDropdownPosition);
// //     };
// //   }, [isOpen]);

// //   const getDropdownStyles = () => {
// //     if (!inputRef.current || !isOpen) return { display: "none" };
// //     const inputRect = inputRef.current.getBoundingClientRect();
// //     const styles = {
// //       width: `${Math.max(inputRect.width, 200)}px`,
// //       maxHeight: "200px",
// //       zIndex: 9999,
// //     };
// //     if (dropdownPosition === "top") {
// //       styles.bottom = `${window.innerHeight - inputRect.top + 4}px`;
// //       styles.left = `${inputRect.left}px`;
// //     } else {
// //       styles.top = `${inputRect.bottom + 4}px`;
// //       styles.left = `${inputRect.left}px`;
// //     }
// //     return styles;
// //   };

// //   return (
// //     <div className="relative">
// //       <input
// //         ref={inputRef}
// //         type="text"
// //         className="w-full min-w-[160px] border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
// //         value={searchTerm}
// //         onChange={(e) => {
// //           setSearchTerm(e.target.value);
// //           onChange(e.target.value);
// //           setIsOpen(true);
// //         }}
// //         onFocus={handleFocus}
// //         placeholder={placeholder}
// //         required
// //         autoComplete="off"
// //       />
// //       {loading && (
// //         <div className="absolute right-2 top-2">
// //           <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
// //         </div>
// //       )}
// //       {isOpen && filteredVendors.length > 0 && (
// //         <div
// //           ref={dropdownRef}
// //           className="fixed bg-white border border-gray-300 rounded-md shadow-lg overflow-y-auto"
// //           style={getDropdownStyles()}
// //         >
// //           {filteredVendors.map((vendor) => (
// //             <div
// //               key={vendor.VENDOR_ID}
// //               className={`px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
// //                 vendor.VENDOR_ID === "SELF" ? "bg-green-50 font-medium" : ""
// //               }`}
// //               onClick={() => {
// //                 setSearchTerm(vendor.VENDOR_NAME);
// //                 onChange(vendor.VENDOR_NAME);
// //                 setIsOpen(false);
// //               }}
// //             >
// //               <div
// //                 className={`font-medium text-gray-900 truncate ${
// //                   vendor.VENDOR_ID === "SELF" ? "text-green-800" : ""
// //                 }`}
// //               >
// //                 {vendor.VENDOR_NAME}
// //                 {vendor.VENDOR_ID === "SELF" && (
// //                   <span className="ml-2 text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
// //                     Own Vehicles
// //                   </span>
// //                 )}
// //               </div>
// //               <div className="text-sm text-gray-500 truncate">
// //                 {vendor.VENDOR_CODE || "No code"} |{" "}
// //                 {vendor.CITY || vendor.ADDRESS || "No location"}
// //               </div>
// //             </div>
// //           ))}
// //         </div>
// //       )}
// //       {isOpen && filteredVendors.length === 0 && searchTerm && (
// //         <div
// //           ref={dropdownRef}
// //           className="fixed bg-white border border-gray-300 rounded-md shadow-lg"
// //           style={getDropdownStyles()}
// //         >
// //           <div className="px-3 py-2 text-gray-500 text-sm">
// //             No vendors found matching "{searchTerm}"
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // // DriverSearchInput Component
// // const DriverSearchInput = ({ value, onChange, vendorName, placeholder }) => {
// //   const [drivers, setDrivers] = useState([]);
// //   const [filteredDrivers, setFilteredDrivers] = useState([]);
// //   const [isOpen, setIsOpen] = useState(false);
// //   const [searchTerm, setSearchTerm] = useState(value || "");
// //   const [loading, setLoading] = useState(false);
// //   const [vendorId, setVendorId] = useState(null);
// //   const [dropdownPosition, setDropdownPosition] = useState("bottom");
// //   const [vehicles, setVehicles] = useState([]);

// //   const inputRef = useRef(null);
// //   const dropdownRef = useRef(null);

// //   useEffect(() => {
// //     const getVendorId = async () => {
// //       if (!vendorName) {
// //         setVendorId(null);
// //         return;
// //       }
// //       if (vendorName === "Self") {
// //         setVendorId("SELF");
// //         return;
// //       }
// //       try {
// //         const vendorsResponse = await vendorAPI.getAllVendors();
// //         const vendors = vendorsResponse.data || vendorsResponse || [];
// //         const vendor = vendors.find((v) => v.VENDOR_NAME === vendorName);
// //         setVendorId(vendor ? vendor.VENDOR_ID : null);
// //       } catch (error) {
// //         console.error("Error fetching vendor ID:", error);
// //         setVendorId(null);
// //       }
// //     };
// //     getVendorId();
// //   }, [vendorName]);

// //   useEffect(() => {
// //     const fetchData = async () => {
// //       if (!vendorId) {
// //         setDrivers([]);
// //         setFilteredDrivers([]);
// //         setVehicles([]);
// //         return;
// //       }
// //       setLoading(true);
// //       try {
// //         if (vendorId === "SELF") {
// //           const vehiclesResponse = await vehicleAPI.getAllvehicles();
// //           let vehiclesData = [];
// //           if (vehiclesResponse && Array.isArray(vehiclesResponse)) {
// //             vehiclesData = vehiclesResponse;
// //           } else if (
// //             vehiclesResponse &&
// //             vehiclesResponse.data &&
// //             Array.isArray(vehiclesResponse.data)
// //           ) {
// //             vehiclesData = vehiclesResponse.data;
// //           } else if (
// //             vehiclesResponse &&
// //             Array.isArray(vehiclesResponse.vehicles)
// //           ) {
// //             vehiclesData = vehiclesResponse.vehicles;
// //           }
// //           if (vehiclesData.length === 0) {
// //             setDrivers([]);
// //             setFilteredDrivers([]);
// //             setVehicles([]);
// //             return;
// //           }
// //           const vehicleDrivers = vehiclesData.map((vehicle, index) => {
// //             const driverName =
// //               vehicle.OWNER_NAME ||
// //               vehicle.owner_name ||
// //               `Owner of ${
// //                 vehicle.VEHICLE_NUMBER ||
// //                 vehicle.vehicle_number ||
// //                 "Unknown Vehicle"
// //               }`;
// //             const vehicleNumber =
// //               vehicle.VEHICLE_NUMBER ||
// //               vehicle.vehicle_number ||
// //               vehicle.VEHICLE_NO ||
// //               "";
// //             const ownerContact =
// //               vehicle.OWNER_CONTACT ||
// //               vehicle.owner_contact ||
// //               vehicle.CONTACT_NO ||
// //               "";
// //             const vehicleType =
// //               vehicle.VEHICLE_TYPE || vehicle.vehicle_type || "";
// //             const make = vehicle.MAKE || vehicle.make || "";
// //             const model = vehicle.MODEL || vehicle.model || "";
// //             const year = vehicle.YEAR || vehicle.year || "";
// //             const vehicleId =
// //               vehicle.VEHICLE_ID || vehicle.vehicle_id || vehicle.id || index;
// //             return {
// //               DRIVER_ID: `VEHICLE_${vehicleId}`,
// //               DRIVER_NAME: driverName,
// //               CONTACT_NO: ownerContact,
// //               MOBILE_NO: ownerContact,
// //               DL_NO: "",
// //               DL_RENEWABLE_DATE: null,
// //               VEHICLE_NO: vehicleNumber,
// //               VEHICLE_ID: vehicleId,
// //               VEHICLE_TYPE: vehicleType,
// //               MAKE: make,
// //               MODEL: model,
// //               YEAR: year,
// //               IS_SELF_VEHICLE: true,
// //             };
// //           });
// //           setDrivers(vehicleDrivers);
// //           setFilteredDrivers(vehicleDrivers);
// //           setVehicles(vehiclesData);
// //         } else {
// //           const driversResponse = await driverAPI.getDriversByVendorId(
// //             vendorId
// //           );
// //           const driversData = driversResponse.data || driversResponse || [];
// //           setDrivers(driversData);
// //           setFilteredDrivers(driversData);
// //           setVehicles([]);
// //         }
// //       } catch (error) {
// //         console.error("Error fetching data:", error);
// //         setDrivers([]);
// //         setFilteredDrivers([]);
// //         setVehicles([]);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };
// //     fetchData();
// //   }, [vendorId]);

// //   useEffect(() => {
// //     if (searchTerm && drivers.length > 0) {
// //       const filtered = drivers.filter((d) =>
// //         d.DRIVER_NAME.toLowerCase().includes(searchTerm.toLowerCase())
// //       );
// //       setFilteredDrivers(filtered);
// //     } else {
// //       setFilteredDrivers(drivers);
// //     }
// //   }, [searchTerm, drivers]);

// //   useEffect(() => {
// //     setSearchTerm(value || "");
// //   }, [value]);

// //   const calculateDropdownPosition = () => {
// //     if (!inputRef.current) return;
// //     const inputRect = inputRef.current.getBoundingClientRect();
// //     const viewportHeight = window.innerHeight;
// //     const dropdownHeight = 200;
// //     const spaceBelow = viewportHeight - inputRect.bottom;
// //     const spaceAbove = inputRect.top;
// //     setDropdownPosition(
// //       spaceBelow < dropdownHeight && spaceAbove > dropdownHeight
// //         ? "top"
// //         : "bottom"
// //     );
// //   };

// //   const handleFocus = () => {
// //     setIsOpen(true);
// //     setTimeout(calculateDropdownPosition, 0);
// //   };

// //   useEffect(() => {
// //     const handleClickOutside = (event) => {
// //       if (
// //         dropdownRef.current &&
// //         !dropdownRef.current.contains(event.target) &&
// //         inputRef.current &&
// //         !inputRef.current.contains(event.target)
// //       ) {
// //         setIsOpen(false);
// //       }
// //     };
// //     if (isOpen) {
// //       document.addEventListener("mousedown", handleClickOutside);
// //       window.addEventListener("scroll", calculateDropdownPosition, true);
// //       window.addEventListener("resize", calculateDropdownPosition);
// //     }
// //     return () => {
// //       document.removeEventListener("mousedown", handleClickOutside);
// //       window.removeEventListener("scroll", calculateDropdownPosition, true);
// //       window.removeEventListener("resize", calculateDropdownPosition);
// //     };
// //   }, [isOpen]);

// //   const getDropdownStyles = () => {
// //     if (!inputRef.current || !isOpen) return { display: "none" };
// //     const inputRect = inputRef.current.getBoundingClientRect();
// //     const styles = {
// //       width: `${Math.max(inputRect.width, 250)}px`,
// //       maxHeight: "200px",
// //       zIndex: 9999,
// //     };
// //     if (dropdownPosition === "top") {
// //       styles.bottom = `${window.innerHeight - inputRect.top + 4}px`;
// //       styles.left = `${inputRect.left}px`;
// //     } else {
// //       styles.top = `${inputRect.bottom + 4}px`;
// //       styles.left = `${inputRect.left}px`;
// //     }
// //     return styles;
// //   };

// //   const getVehicleInfo = (driver) => {
// //     if (vendorId === "SELF" || driver.IS_SELF_VEHICLE) {
// //       const vehicleInfo = [];
// //       if (driver.VEHICLE_NO) vehicleInfo.push(`${driver.VEHICLE_NO}`);
// //       if (driver.VEHICLE_TYPE) vehicleInfo.push(`(${driver.VEHICLE_TYPE})`);
// //       if (driver.MAKE && driver.MODEL)
// //         vehicleInfo.push(`${driver.MAKE} ${driver.MODEL}`);
// //       return vehicleInfo.length > 0 ? vehicleInfo.join(" ") : "Own Vehicle";
// //     } else {
// //       if (driver.VEHICLE_NO) {
// //         return `Vehicle: ${driver.VEHICLE_NO}`;
// //       } else if (driver.VEHICLE_ID) {
// //         return `Vehicle ID: ${driver.VEHICLE_ID}`;
// //       } else {
// //         return "No vehicle assigned";
// //       }
// //     }
// //   };

// //   const getContactInfo = (driver) => {
// //     const contact = driver.CONTACT_NO || driver.MOBILE_NO;
// //     const license = driver.DL_NO;
// //     if (vendorId === "SELF" || driver.IS_SELF_VEHICLE) {
// //       const info = [];
// //       if (contact) info.push(contact);
// //       if (driver.YEAR) info.push(`Year: ${driver.YEAR}`);
// //       return info.length > 0 ? info.join(" | ") : "No contact info";
// //     } else {
// //       if (contact && license) {
// //         return `${contact} | License: ${license}`;
// //       } else if (contact) {
// //         return contact;
// //       } else if (license) {
// //         return `License: ${license}`;
// //       } else {
// //         return "No contact info";
// //       }
// //     }
// //   };

// //   return (
// //     <div className="relative">
// //       <input
// //         ref={inputRef}
// //         type="text"
// //         className="w-full min-w-[140px] border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
// //         value={searchTerm}
// //         onChange={(e) => {
// //           setSearchTerm(e.target.value);
// //           onChange(e.target.value);
// //           setIsOpen(true);
// //         }}
// //         onFocus={handleFocus}
// //         placeholder={placeholder}
// //         disabled={!vendorName}
// //         required
// //         autoComplete="off"
// //       />
// //       {loading && (
// //         <div className="absolute right-2 top-2">
// //           <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
// //         </div>
// //       )}
// //       {isOpen && filteredDrivers.length > 0 && (
// //         <div
// //           ref={dropdownRef}
// //           className="fixed bg-white border border-gray-300 rounded-md shadow-lg overflow-y-auto"
// //           style={getDropdownStyles()}
// //         >
// //           {filteredDrivers.map((driver) => (
// //             <div
// //               key={driver.DRIVER_ID}
// //               className={`px-3 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
// //                 vendorId === "SELF" || driver.IS_SELF_VEHICLE
// //                   ? "bg-green-50"
// //                   : ""
// //               }`}
// //               onClick={() => {
// //                 setSearchTerm(driver.DRIVER_NAME);
// //                 onChange(driver.DRIVER_NAME, driver);
// //                 setIsOpen(false);
// //               }}
// //             >
// //               <div className="font-medium text-gray-900 truncate">
// //                 {driver.DRIVER_NAME}
// //                 {(vendorId === "SELF" || driver.IS_SELF_VEHICLE) && (
// //                   <span className="ml-2 text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
// //                     Own
// //                   </span>
// //                 )}
// //               </div>
// //               <div className="text-sm text-gray-500 truncate mt-1">
// //                 {getContactInfo(driver)}
// //               </div>
// //               <div
// //                 className={`text-sm truncate mt-1 ${
// //                   vendorId === "SELF" || driver.IS_SELF_VEHICLE
// //                     ? "text-green-600"
// //                     : "text-blue-600"
// //                 }`}
// //               >
// //                 {getVehicleInfo(driver)}
// //               </div>
// //             </div>
// //           ))}
// //         </div>
// //       )}
// //       {isOpen && filteredDrivers.length === 0 && searchTerm && !loading && (
// //         <div
// //           ref={dropdownRef}
// //           className="fixed bg-white border border-gray-300 rounded-md shadow-lg"
// //           style={getDropdownStyles()}
// //         >
// //           <div className="px-3 py-2 text-gray-500 text-sm">
// //             {vendorId === "SELF"
// //               ? `No vehicles found matching "${searchTerm}"`
// //               : `No drivers found matching "${searchTerm}"`}
// //           </div>
// //         </div>
// //       )}
// //       {isOpen &&
// //         filteredDrivers.length === 0 &&
// //         !searchTerm &&
// //         !loading &&
// //         vendorName && (
// //           <div
// //             ref={dropdownRef}
// //             className="fixed bg-white border border-gray-300 rounded-md shadow-lg"
// //             style={getDropdownStyles()}
// //           >
// //             <div className="px-3 py-2 text-gray-500 text-sm">
// //               {vendorId === "SELF"
// //                 ? "No vehicles available"
// //                 : "No drivers available for this vendor"}
// //             </div>
// //           </div>
// //         )}
// //       {!vendorName && isOpen && (
// //         <div
// //           ref={dropdownRef}
// //           className="fixed bg-white border border-gray-300 rounded-md shadow-lg"
// //           style={getDropdownStyles()}
// //         >
// //           <div className="px-3 py-2 text-gray-500 text-sm">
// //             Please select a vendor first
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // // BulkVehicleContainerForm Component
// // const BulkVehicleContainerForm = () => {
// //   const navigate = useNavigate();
// //   const [isLoading, setIsLoading] = useState(false);
// //   const [isSubmitting, setIsSubmitting] = useState(false);
// //   const [transportRequestId, setTransportRequestId] = useState("");
// //   const [vehicles, setVehicles] = useState([
// //     {
// //       transporter_id: null, // Added to track existing transporter records
// //       transporterName: "",
// //       vehicleNumber: "",
// //       driverName: "",
// //       driverContact: "",
// //       licenseNumber: "",
// //       licenseExpiry: "",
// //       additionalCharges: "",
// //       serviceCharges: "",
// //       totalCharge: "",
// //       containers: [
// //         {
// //           container_id: null, // Added to track existing container records
// //           containerNo: "",
// //           line: "",
// //           sealNo: "",
// //           seal1: "",
// //           seal2: "",
// //           containerTotalWeight: "",
// //           cargoTotalWeight: "",
// //           containerType: "",
// //           containerSize: "",
// //         },
// //       ],
// //     },
// //   ]);
// //   const [validationErrors, setValidationErrors] = useState({});

// //   // Fetch existing vehicles and containers
// //   useEffect(() => {
// //     const storedRequestId = sessionStorage.getItem("transportRequestId");
// //     if (storedRequestId) {
// //       setTransportRequestId(storedRequestId);
// //     }

// //     const fetchExistingData = async () => {
// //       if (!storedRequestId) return;
// //       setIsLoading(true);
// //       try {
// //         const response = await transporterAPI.getTransporterByRequestId(
// //           storedRequestId
// //         );
// //         if (response.success && Array.isArray(response.data)) {
// //           const transporterData = response.data;
// //           if (transporterData.length > 0) {
// //             const formattedVehicles = transporterData.map((transporter) => ({
// //               transporter_id: transporter.transporter_id || null,
// //               transporterName: transporter.transporter_name || "",
// //               vehicleNumber: transporter.vehicle_number || "",
// //               driverName: transporter.driver_name || "",
// //               driverContact: transporter.driver_contact || "",
// //               licenseNumber: transporter.license_number || "",
// //               licenseExpiry: transporter.license_expiry || "",
// //               additionalCharges:
// //                 transporter.additional_charges?.toString() || "",
// //               serviceCharges: transporter.service_charges || "",
// //               totalCharge: transporter.total_charge?.toString() || "",
// //               containers:
// //                 Array.isArray(transporter.containers) &&
// //                 transporter.containers.length > 0
// //                   ? transporter.containers.map((container) => ({
// //                       container_id: container.container_id || null,
// //                       containerNo: container.container_no || "",
// //                       line: container.line || "",
// //                       sealNo: container.seal_no || "",
// //                       seal1: container.seal1 || "",
// //                       seal2: container.seal2 || "",
// //                       containerTotalWeight:
// //                         container.container_total_weight?.toString() || "",
// //                       cargoTotalWeight:
// //                         container.cargo_total_weight?.toString() || "",
// //                       containerType: container.container_type || "",
// //                       containerSize: container.container_size || "",
// //                     }))
// //                   : [
// //                       {
// //                         container_id: null,
// //                         containerNo: "",
// //                         line: "",
// //                         sealNo: "",
// //                         seal1: "",
// //                         seal2: "",
// //                         containerTotalWeight: "",
// //                         cargoTotalWeight: "",
// //                         containerType: "",
// //                         containerSize: "",
// //                       },
// //                     ],
// //             }));
// //             setVehicles(formattedVehicles);
// //             sessionStorage.setItem(
// //               "vehicleContainerData",
// //               JSON.stringify(formattedVehicles)
// //             );
// //             toast.success(
// //               "Existing vehicles and containers loaded successfully"
// //             );
// //           }
// //         } else {
// //           toast.info(
// //             "No existing vehicles or containers found for this request"
// //           );
// //         }
// //       } catch (error) {
// //         console.error("Error fetching existing data:", error);
// //         toast.error("Failed to load existing data");
// //       } finally {
// //         setIsLoading(false);
// //       }
// //     };

// //     fetchExistingData();
// //   }, []);

// //   // Validation functions
// //   const validateVehicle = (vehicle, vehicleIndex) => {
// //     const errors = {};
// //     const vehicleNumberRegex = /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/;
// //     const contactRegex = /^\d{10}$/;
// //     const licenseRegex = /^[A-Z0-9]{5,}$/;
// //     const today = new Date();
// //     today.setHours(0, 0, 0, 0);

// //     if (!vehicle.transporterName)
// //       errors[`${vehicleIndex}-transporterName`] =
// //         "Transporter name is required";
// //     if (!vehicleNumberRegex.test(vehicle.vehicleNumber))
// //       errors[`${vehicleIndex}-vehicleNumber`] =
// //         "Invalid vehicle number (e.g., MH12AB1234)";
// //     if (!vehicle.driverName || vehicle.driverName.length < 3)
// //       errors[`${vehicleIndex}-driverName`] = "Valid driver name is required";
// //     if (!contactRegex.test(vehicle.driverContact))
// //       errors[`${vehicleIndex}-driverContact`] =
// //         "Invalid 10-digit contact number";
// //     if (!licenseRegex.test(vehicle.licenseNumber))
// //       errors[`${vehicleIndex}-licenseNumber`] = "Invalid license number";
// //     if (!vehicle.licenseExpiry || new Date(vehicle.licenseExpiry) < today)
// //       errors[`${vehicleIndex}-licenseExpiry`] =
// //         "Valid future expiry date required";
// //     if (
// //       isNaN(parseFloat(vehicle.additionalCharges)) ||
// //       parseFloat(vehicle.additionalCharges) < 0
// //     )
// //       errors[`${vehicleIndex}-additionalCharges`] =
// //         "Valid additional charges required";
// //     if (!vehicle.serviceCharges)
// //       errors[`${vehicleIndex}-serviceCharges`] =
// //         "Service charges description required";
// //     if (
// //       isNaN(parseFloat(vehicle.totalCharge)) ||
// //       parseFloat(vehicle.totalCharge) < 0
// //     )
// //       errors[`${vehicleIndex}-totalCharge`] = "Valid total charge required";

// //     vehicle.containers.forEach((container, containerIndex) => {
// //       const containerNoRegex = /^[A-Z]{4}\d{7}$/;
// //       if (!containerNoRegex.test(container.containerNo))
// //         errors[`${vehicleIndex}-${containerIndex}-containerNo`] =
// //           "Invalid container number (e.g., MSKU1234567)";
// //       if (!container.line)
// //         errors[`${vehicleIndex}-${containerIndex}-line`] =
// //           "Shipping line is required";
// //       if (!container.sealNo)
// //         errors[`${vehicleIndex}-${containerIndex}-sealNo`] =
// //           "Seal number is required";
// //       if (
// //         isNaN(parseFloat(container.containerTotalWeight)) ||
// //         parseFloat(container.containerTotalWeight) < 0
// //       )
// //         errors[`${vehicleIndex}-${containerIndex}-containerTotalWeight`] =
// //           "Valid container weight required";
// //       if (
// //         isNaN(parseFloat(container.cargoTotalWeight)) ||
// //         parseFloat(container.cargoTotalWeight) < 0
// //       )
// //         errors[`${vehicleIndex}-${containerIndex}-cargoTotalWeight`] =
// //           "Valid cargo weight required";
// //       if (!container.containerType)
// //         errors[`${vehicleIndex}-${containerIndex}-containerType`] =
// //           "Container type is required";
// //       if (!container.containerSize)
// //         errors[`${vehicleIndex}-${containerIndex}-containerSize`] =
// //           "Container size is required";
// //     });

// //     return errors;
// //   };

// //   const calculateCheckDigit = (containerNo) => {
// //     const letters = "0123456789A?BCDEFGHIJK?LMNOPQRSTU?VWXYZ";
// //     const chars = containerNo.slice(0, 10).toUpperCase().split("");
// //     let sum = 0;
// //     chars.forEach((char, i) => {
// //       const value = /[A-Z]/.test(char)
// //         ? letters.indexOf(char)
// //         : parseInt(char, 10);
// //       sum += value * Math.pow(2, i);
// //     });
// //     return (sum % 11) % 10;
// //   };

// //   const updateVehicleData = (vehicleIndex, field, value) => {
// //     setVehicles((prev) =>
// //       prev.map((vehicle, i) =>
// //         i === vehicleIndex ? { ...vehicle, [field]: value } : vehicle
// //       )
// //     );
// //     const newErrors = validateVehicle(
// //       { ...vehicles[vehicleIndex], [field]: value },
// //       vehicleIndex
// //     );
// //     setValidationErrors((prev) => ({
// //       ...prev,
// //       ...newErrors,
// //     }));
// //   };

// //   const handleDriverSelection = (vehicleIndex, driverName, driverData) => {
// //     if (driverData) {
// //       setVehicles((prev) =>
// //         prev.map((vehicle, i) =>
// //           i === vehicleIndex
// //             ? {
// //                 ...vehicle,
// //                 driverName,
// //                 driverContact:
// //                   driverData.MOBILE_NO || driverData.CONTACT_NO || "",
// //                 licenseNumber: driverData.DL_NO || "",
// //                 vehicleNumber: driverData.VEHICLE_NO || "",
// //                 licenseExpiry: driverData.DL_RENEWABLE_DATE
// //                   ? new Date(driverData.DL_RENEWABLE_DATE)
// //                       .toISOString()
// //                       .split("T")[0]
// //                   : "",
// //               }
// //             : vehicle
// //         )
// //       );
// //       const newErrors = validateVehicle(
// //         {
// //           ...vehicles[vehicleIndex],
// //           driverName,
// //           driverContact: driverData.MOBILE_NO || driverData.CONTACT_NO || "",
// //           licenseNumber: driverData.DL_NO || "",
// //           vehicleNumber: driverData.VEHICLE_NO || "",
// //           licenseExpiry: driverData.DL_RENEWABLE_DATE
// //             ? new Date(driverData.DL_RENEWABLE_DATE).toISOString().split("T")[0]
// //             : "",
// //         },
// //         vehicleIndex
// //       );
// //       setValidationErrors((prev) => ({
// //         ...prev,
// //         ...newErrors,
// //       }));
// //     }
// //   };

// //   const updateContainerData = (vehicleIndex, containerIndex, field, value) => {
// //     if (field === "containerNo") {
// //       value = value.toUpperCase().slice(0, 11);
// //       if (value.length <= 4) {
// //         value = value.replace(/[^A-Z]/g, "");
// //       } else {
// //         const letters = value.substring(0, 4).replace(/[^A-Z]/g, "");
// //         const digits = value.substring(4).replace(/[^0-9]/g, "");
// //         value = letters + digits;
// //       }
// //     }
// //     setVehicles((prev) =>
// //       prev.map((vehicle, i) =>
// //         i === vehicleIndex
// //           ? {
// //               ...vehicle,
// //               containers: vehicle.containers.map((container, j) =>
// //                 j === containerIndex
// //                   ? { ...container, [field]: value }
// //                   : container
// //               ),
// //             }
// //           : vehicle
// //       )
// //     );
// //     const newErrors = validateVehicle(vehicles[vehicleIndex], vehicleIndex);
// //     setValidationErrors((prev) => ({
// //       ...prev,
// //       ...newErrors,
// //     }));
// //   };

// //   const addVehicle = () => {
// //     setVehicles((prev) => [
// //       ...prev,
// //       {
// //         transporter_id: null,
// //         transporterName: "",
// //         vehicleNumber: "",
// //         driverName: "",
// //         driverContact: "",
// //         licenseNumber: "",
// //         licenseExpiry: "",
// //         additionalCharges: "",
// //         serviceCharges: "",
// //         totalCharge: "",
// //         containers: [
// //           {
// //             container_id: null,
// //             containerNo: "",
// //             line: "",
// //             sealNo: "",
// //             seal1: "",
// //             seal2: "",
// //             containerTotalWeight: "",
// //             cargoTotalWeight: "",
// //             containerType: "",
// //             containerSize: "",
// //           },
// //         ],
// //       },
// //     ]);
// //   };

// //   const removeVehicle = (vehicleIndex) => {
// //     if (vehicles.length > 1) {
// //       setVehicles((prev) => prev.filter((_, i) => i !== vehicleIndex));
// //       setValidationErrors((prev) => {
// //         const newErrors = { ...prev };
// //         Object.keys(newErrors).forEach((key) => {
// //           if (key.startsWith(`${vehicleIndex}-`)) {
// //             delete newErrors[key];
// //           }
// //         });
// //         return newErrors;
// //       });
// //     } else {
// //       toast.warning("At least one vehicle is required");
// //     }
// //   };

// //   const addContainer = (vehicleIndex) => {
// //     setVehicles((prev) =>
// //       prev.map((vehicle, i) =>
// //         i === vehicleIndex
// //           ? {
// //               ...vehicle,
// //               containers: [
// //                 ...vehicle.containers,
// //                 {
// //                   container_id: null,
// //                   containerNo: "",
// //                   line: "",
// //                   sealNo: "",
// //                   seal1: "",
// //                   seal2: "",
// //                   containerTotalWeight: "",
// //                   cargoTotalWeight: "",
// //                   containerType: "",
// //                   containerSize: "",
// //                 },
// //               ],
// //             }
// //           : vehicle
// //       )
// //     );
// //   };

// //   const removeContainer = (vehicleIndex, containerIndex) => {
// //     setVehicles((prev) =>
// //       prev.map((vehicle, i) =>
// //         i === vehicleIndex
// //           ? {
// //               ...vehicle,
// //               containers: vehicle.containers.filter(
// //                 (_, j) => j !== containerIndex
// //               ),
// //             }
// //           : vehicle
// //       )
// //     );
// //     setValidationErrors((prev) => {
// //       const newErrors = { ...prev };
// //       Object.keys(newErrors).forEach((key) => {
// //         if (key.startsWith(`${vehicleIndex}-${containerIndex}-`)) {
// //           delete newErrors[key];
// //         }
// //       });
// //       return newErrors;
// //     });
// //   };

// //   const handleSubmit = async (e) => {
// //     e.preventDefault();
// //     setIsSubmitting(true);

// //     const allErrors = vehicles.reduce((acc, vehicle, index) => {
// //       return { ...acc, ...validateVehicle(vehicle, index) };
// //     }, {});

// //     const checkDigitErrors = [];
// //     vehicles.forEach((vehicle, vehicleIndex) => {
// //       vehicle.containers.forEach((container, containerIndex) => {
// //         if (
// //           container.containerNo &&
// //           /^[A-Z]{4}\d{7}$/.test(container.containerNo)
// //         ) {
// //           const checkDigit = calculateCheckDigit(container.containerNo);
// //           const actualCheckDigit = parseInt(
// //             container.containerNo.slice(-1),
// //             10
// //           );
// //           if (checkDigit !== actualCheckDigit) {
// //             checkDigitErrors.push(
// //               `Container ${vehicleIndex + 1}.${
// //                 containerIndex + 1
// //               }: Invalid check digit. Expected ${checkDigit}, got ${actualCheckDigit}`
// //             );
// //           }
// //         }
// //       });
// //     });

// //     if (Object.keys(allErrors).length > 0 || checkDigitErrors.length > 0) {
// //       const errorMessages = [
// //         ...Object.values(allErrors),
// //         ...checkDigitErrors,
// //       ].join("\n");
// //       toast.error(`Please fix the following errors:\n${errorMessages}`);
// //       setIsSubmitting(false);
// //       return;
// //     }

// //     try {
// //       const payload = {
// //         transport_request_id: transportRequestId,
// //         vehicles: vehicles.map((vehicle) => ({
// //           transporter_id: vehicle.transporter_id,
// //           transporter_name: vehicle.transporterName,
// //           vehicle_number: vehicle.vehicleNumber,
// //           driver_name: vehicle.driverName,
// //           driver_contact: vehicle.driverContact,
// //           license_number: vehicle.licenseNumber,
// //           license_expiry: vehicle.licenseExpiry,
// //           additional_charges: parseFloat(vehicle.additionalCharges) || 0,
// //           service_charges: vehicle.serviceCharges,
// //           total_charge: parseFloat(vehicle.totalCharge) || 0,
// //           containers: vehicle.containers.map((container) => ({
// //             container_id: container.container_id,
// //             container_no: container.containerNo,
// //             line: container.line,
// //             seal_no: container.sealNo,
// //             seal1: container.seal1,
// //             seal2: container.seal2,
// //             container_total_weight:
// //               parseFloat(container.containerTotalWeight) || 0,
// //             cargo_total_weight: parseFloat(container.cargoTotalWeight) || 0,
// //             container_type: container.containerType,
// //             container_size: container.containerSize,
// //           })),
// //         })),
// //       };

// //       const response = await fetch(
// //         "http://localhost:4000/api/84/bulk-vehicles-with-containers",
// //         {
// //           method: "POST",
// //           headers: {
// //             "Content-Type": "application/json",
// //           },
// //           body: JSON.stringify(payload),
// //         }
// //       );

// //       if (!response.ok) {
// //         const errorData = await response.json();
// //         throw new Error(errorData.message || "Failed to submit data");
// //       }

// //       toast.success("Vehicles and containers updated successfully");
// //       sessionStorage.setItem("vehicleContainerData", JSON.stringify(vehicles));
// //       // Optionally, refresh the data
// //       const refreshResponse = await transporterAPI.getTransporterByRequestId(
// //         transportRequestId
// //       );
// //       if (refreshResponse.success && Array.isArray(refreshResponse.data)) {
// //         const formattedVehicles = refreshResponse.data.map((transporter) => ({
// //           transporter_id: transporter.transporter_id || null,
// //           transporterName: transporter.transporter_name || "",
// //           vehicleNumber: transporter.vehicle_number || "",
// //           driverName: transporter.driver_name || "",
// //           driverContact: transporter.driver_contact || "",
// //           licenseNumber: transporter.license_number || "",
// //           licenseExpiry: transporter.license_expiry || "",
// //           additionalCharges: transporter.additional_charges?.toString() || "",
// //           serviceCharges: transporter.service_charges || "",
// //           totalCharge: transporter.total_charge?.toString() || "",
// //           containers:
// //             Array.isArray(transporter.containers) &&
// //             transporter.containers.length > 0
// //               ? transporter.containers.map((container) => ({
// //                   container_id: container.container_id || null,
// //                   containerNo: container.container_no || "",
// //                   line: container.line || "",
// //                   sealNo: container.seal_no || "",
// //                   seal1: container.seal1 || "",
// //                   seal2: container.seal2 || "",
// //                   containerTotalWeight:
// //                     container.container_total_weight?.toString() || "",
// //                   cargoTotalWeight:
// //                     container.cargo_total_weight?.toString() || "",
// //                   containerType: container.container_type || "",
// //                   containerSize: container.container_size || "",
// //                 }))
// //               : [
// //                   {
// //                     container_id: null,
// //                     containerNo: "",
// //                     line: "",
// //                     sealNo: "",
// //                     seal1: "",
// //                     seal2: "",
// //                     containerTotalWeight: "",
// //                     cargoTotalWeight: "",
// //                     containerType: "",
// //                     containerSize: "",
// //                   },
// //                 ],
// //         }));
// //         setVehicles(formattedVehicles);
// //       }
// //     } catch (error) {
// //       console.error("Error submitting data:", error);
// //       toast.error(error.message || "Failed to update vehicles and containers");
// //     } finally {
// //       setIsSubmitting(false);
// //     }
// //   };

// //   if (isLoading) {
// //     return (
// //       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
// //         <div className="text-center">
// //           <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
// //           <p className="mt-4 text-gray-600">Loading data...</p>
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
// //       <ToastContainer
// //         position="top-right"
// //         autoClose={5000}
// //         hideProgressBar={false}
// //         newestOnTop
// //         closeOnClick
// //         rtl={false}
// //         pauseOnFocusLoss
// //         draggable
// //         pauseOnHover
// //       />
// //       <div className="max-w-7xl mx-auto">
// //         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
// //           <div className="flex justify-between items-center mb-6">
// //             <div>
// //               <h1 className="text-2xl font-bold text-gray-900">
// //                 Bulk Add/Update Vehicles and Containers
// //               </h1>
// //               {transportRequestId && (
// //                 <p className="text-sm text-gray-600 mt-1">
// //                   Request ID:{" "}
// //                   <span className="font-medium">{transportRequestId}</span>
// //                 </p>
// //               )}
// //             </div>
// //             <button
// //               onClick={() => navigate(-1)}
// //               className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
// //             >
// //               <svg
// //                 className="w-4 h-4 mr-2"
// //                 fill="none"
// //                 stroke="currentColor"
// //                 viewBox="0 0 24 24"
// //               >
// //                 <path
// //                   strokeLinecap="round"
// //                   strokeLinejoin="round"
// //                   strokeWidth={2}
// //                   d="M10 19l-7-7m0 0l7-7m-7 7h18"
// //                 />
// //               </svg>
// //               Back
// //             </button>
// //           </div>
// //           <form onSubmit={handleSubmit}>
// //             {vehicles.map((vehicle, vehicleIndex) => (
// //               <div key={vehicleIndex} className="mb-8 border-b pb-6">
// //                 <div className="flex justify-between items-center mb-4">
// //                   <h2 className="text-lg font-semibold text-gray-900">
// //                     Vehicle #{vehicleIndex + 1}{" "}
// //                     {vehicle.transporter_id && (
// //                       <span className="text-sm text-gray-500">
// //                         (ID: {vehicle.transporter_id})
// //                       </span>
// //                     )}
// //                   </h2>
// //                   {vehicles.length > 1 && (
// //                     <button
// //                       type="button"
// //                       onClick={() => removeVehicle(vehicleIndex)}
// //                       className="text-red-600 hover:text-red-800"
// //                       title="Remove Vehicle"
// //                     >
// //                       <svg
// //                         className="h-5 w-5"
// //                         fill="none"
// //                         viewBox="0 0 24 24"
// //                         stroke="currentColor"
// //                       >
// //                         <path
// //                           strokeLinecap="round"
// //                           strokeLinejoin="round"
// //                           strokeWidth={2}
// //                           d="M6 18L18 6M6 6l12 12"
// //                         />
// //                       </svg>
// //                     </button>
// //                   )}
// //                 </div>
// //                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700 mb-1">
// //                       Transporter Name *
// //                     </label>
// //                     <VendorSearchInput
// //                       value={vehicle.transporterName}
// //                       onChange={(value) =>
// //                         updateVehicleData(
// //                           vehicleIndex,
// //                           "transporterName",
// //                           value
// //                         )
// //                       }
// //                       placeholder="Search and select transporter"
// //                     />
// //                     {validationErrors[`${vehicleIndex}-transporterName`] && (
// //                       <p className="text-red-500 text-xs mt-1">
// //                         {validationErrors[`${vehicleIndex}-transporterName`]}
// //                       </p>
// //                     )}
// //                   </div>
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700 mb-1">
// //                       Vehicle Number *
// //                     </label>
// //                     <input
// //                       type="text"
// //                       className={`w-full border ${
// //                         validationErrors[`${vehicleIndex}-vehicleNumber`]
// //                           ? "border-red-500"
// //                           : "border-gray-300"
// //                       } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
// //                       value={vehicle.vehicleNumber}
// //                       onChange={(e) =>
// //                         updateVehicleData(
// //                           vehicleIndex,
// //                           "vehicleNumber",
// //                           e.target.value.toUpperCase()
// //                         )
// //                       }
// //                       placeholder="e.g., MH12AB1234"
// //                       required
// //                     />
// //                     {validationErrors[`${vehicleIndex}-vehicleNumber`] && (
// //                       <p className="text-red-500 text-xs mt-1">
// //                         {validationErrors[`${vehicleIndex}-vehicleNumber`]}
// //                       </p>
// //                     )}
// //                   </div>
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700 mb-1">
// //                       Driver Name *
// //                     </label>
// //                     <DriverSearchInput
// //                       value={vehicle.driverName}
// //                       onChange={(value, driverData) =>
// //                         handleDriverSelection(vehicleIndex, value, driverData)
// //                       }
// //                       vendorName={vehicle.transporterName}
// //                       placeholder="Select driver"
// //                     />
// //                     {validationErrors[`${vehicleIndex}-driverName`] && (
// //                       <p className="text-red-500 text-xs mt-1">
// //                         {validationErrors[`${vehicleIndex}-driverName`]}
// //                       </p>
// //                     )}
// //                   </div>
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700 mb-1">
// //                       Driver Contact *
// //                     </label>
// //                     <input
// //                       type="tel"
// //                       className={`w-full border ${
// //                         validationErrors[`${vehicleIndex}-driverContact`]
// //                           ? "border-red-500"
// //                           : "border-gray-300"
// //                       } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
// //                       value={vehicle.driverContact}
// //                       onChange={(e) =>
// //                         updateVehicleData(
// //                           vehicleIndex,
// //                           "driverContact",
// //                           e.target.value.replace(/\D/g, "").slice(0, 10)
// //                         )
// //                       }
// //                       placeholder="10-digit mobile number"
// //                       maxLength="10"
// //                       required
// //                     />
// //                     {validationErrors[`${vehicleIndex}-driverContact`] && (
// //                       <p className="text-red-500 text-xs mt-1">
// //                         {validationErrors[`${vehicleIndex}-driverContact`]}
// //                       </p>
// //                     )}
// //                   </div>
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700 mb-1">
// //                       License Number *
// //                     </label>
// //                     <input
// //                       type="text"
// //                       className={`w-full border ${
// //                         validationErrors[`${vehicleIndex}-licenseNumber`]
// //                           ? "border-red-500"
// //                           : "border-gray-300"
// //                       } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
// //                       value={vehicle.licenseNumber}
// //                       onChange={(e) =>
// //                         updateVehicleData(
// //                           vehicleIndex,
// //                           "licenseNumber",
// //                           e.target.value.toUpperCase()
// //                         )
// //                       }
// //                       placeholder="License number"
// //                       required
// //                     />
// //                     {validationErrors[`${vehicleIndex}-licenseNumber`] && (
// //                       <p className="text-red-500 text-xs mt-1">
// //                         {validationErrors[`${vehicleIndex}-licenseNumber`]}
// //                       </p>
// //                     )}
// //                   </div>
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700 mb-1">
// //                       License Expiry *
// //                     </label>
// //                     <input
// //                       type="date"
// //                       className={`w-full border ${
// //                         validationErrors[`${vehicleIndex}-licenseExpiry`]
// //                           ? "border-red-500"
// //                           : "border-gray-300"
// //                       } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
// //                       value={vehicle.licenseExpiry}
// //                       onChange={(e) =>
// //                         updateVehicleData(
// //                           vehicleIndex,
// //                           "licenseExpiry",
// //                           e.target.value
// //                         )
// //                       }
// //                       min={new Date().toISOString().split("T")[0]}
// //                       required
// //                     />
// //                     {validationErrors[`${vehicleIndex}-licenseExpiry`] && (
// //                       <p className="text-red-500 text-xs mt-1">
// //                         {validationErrors[`${vehicleIndex}-licenseExpiry`]}
// //                       </p>
// //                     )}
// //                   </div>
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700 mb-1">
// //                       Additional Charges
// //                     </label>
// //                     <input
// //                       type="number"
// //                       step="0.01"
// //                       className={`w-full border ${
// //                         validationErrors[`${vehicleIndex}-additionalCharges`]
// //                           ? "border-red-500"
// //                           : "border-gray-300"
// //                       } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
// //                       value={vehicle.additionalCharges}
// //                       onChange={(e) =>
// //                         updateVehicleData(
// //                           vehicleIndex,
// //                           "additionalCharges",
// //                           e.target.value
// //                         )
// //                       }
// //                       placeholder="e.g., 500.00"
// //                     />
// //                     {validationErrors[`${vehicleIndex}-additionalCharges`] && (
// //                       <p className="text-red-500 text-xs mt-1">
// //                         {validationErrors[`${vehicleIndex}-additionalCharges`]}
// //                       </p>
// //                     )}
// //                   </div>
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700 mb-1">
// //                       Service Charges
// //                     </label>
// //                     <input
// //                       type="text"
// //                       className={`w-full border ${
// //                         validationErrors[`${vehicleIndex}-serviceCharges`]
// //                           ? "border-red-500"
// //                           : "border-gray-300"
// //                       } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
// //                       value={vehicle.serviceCharges}
// //                       onChange={(e) =>
// //                         updateVehicleData(
// //                           vehicleIndex,
// //                           "serviceCharges",
// //                           e.target.value
// //                         )
// //                       }
// //                       placeholder="e.g., Loading: 200, Unloading: 150"
// //                     />
// //                     {validationErrors[`${vehicleIndex}-serviceCharges`] && (
// //                       <p className="text-red-500 text-xs mt-1">
// //                         {validationErrors[`${vehicleIndex}-serviceCharges`]}
// //                       </p>
// //                     )}
// //                   </div>
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700 mb-1">
// //                       Total Charge
// //                     </label>
// //                     <input
// //                       type="number"
// //                       step="0.01"
// //                       className={`w-full border ${
// //                         validationErrors[`${vehicleIndex}-totalCharge`]
// //                           ? "border-red-500"
// //                           : "border-gray-300"
// //                       } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
// //                       value={vehicle.totalCharge}
// //                       onChange={(e) =>
// //                         updateVehicleData(
// //                           vehicleIndex,
// //                           "totalCharge",
// //                           e.target.value
// //                         )
// //                       }
// //                       placeholder="e.g., 5000.00"
// //                     />
// //                     {validationErrors[`${vehicleIndex}-totalCharge`] && (
// //                       <p className="text-red-500 text-xs mt-1">
// //                         {validationErrors[`${vehicleIndex}-totalCharge`]}
// //                       </p>
// //                     )}
// //                   </div>
// //                 </div>
// //                 <div className="mt-6">
// //                   <h3 className="text-md font-medium text-gray-900 mb-4">
// //                     Containers for Vehicle #{vehicleIndex + 1}
// //                   </h3>
// //                   {vehicle.containers.map((container, containerIndex) => (
// //                     <div
// //                       key={containerIndex}
// //                       className="border rounded-lg p-4 mb-4 bg-gray-50"
// //                     >
// //                       <div className="flex justify-between items-center mb-4">
// //                         <h4 className="text-sm font-medium text-gray-700">
// //                           Container #{containerIndex + 1}{" "}
// //                           {container.container_id && (
// //                             <span className="text-xs text-gray-500">
// //                               (ID: {container.container_id})
// //                             </span>
// //                           )}
// //                         </h4>
// //                         {vehicle.containers.length > 1 && (
// //                           <button
// //                             type="button"
// //                             onClick={() =>
// //                               removeContainer(vehicleIndex, containerIndex)
// //                             }
// //                             className="text-red-600 hover:text-red-800"
// //                             title="Remove Container"
// //                           >
// //                             <svg
// //                               className="h-5 w-5"
// //                               fill="none"
// //                               viewBox="0 0 24 24"
// //                               stroke="currentColor"
// //                             >
// //                               <path
// //                                 strokeLinecap="round"
// //                                 strokeLinejoin="round"
// //                                 strokeWidth={2}
// //                                 d="M6 18L18 6M6 6l12 12"
// //                               />
// //                             </svg>
// //                           </button>
// //                         )}
// //                       </div>
// //                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //                         <div>
// //                           <label className="block text-sm font-medium text-gray-700 mb-1">
// //                             Container Number *
// //                           </label>
// //                           <input
// //                             type="text"
// //                             className={`w-full border ${
// //                               validationErrors[
// //                                 `${vehicleIndex}-${containerIndex}-containerNo`
// //                               ]
// //                                 ? "border-red-500"
// //                                 : "border-gray-300"
// //                             } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
// //                             value={container.containerNo}
// //                             onChange={(e) =>
// //                               updateContainerData(
// //                                 vehicleIndex,
// //                                 containerIndex,
// //                                 "containerNo",
// //                                 e.target.value
// //                               )
// //                             }
// //                             placeholder="e.g., MSKU1234567"
// //                             required
// //                           />
// //                           {validationErrors[
// //                             `${vehicleIndex}-${containerIndex}-containerNo`
// //                           ] && (
// //                             <p className="text-red-500 text-xs mt-1">
// //                               {
// //                                 validationErrors[
// //                                   `${vehicleIndex}-${containerIndex}-containerNo`
// //                                 ]
// //                               }
// //                             </p>
// //                           )}
// //                         </div>
// //                         <div>
// //                           <label className="block text-sm font-medium text-gray-700 mb-1">
// //                             Shipping Line *
// //                           </label>
// //                           <input
// //                             type="text"
// //                             className={`w-full border ${
// //                               validationErrors[
// //                                 `${vehicleIndex}-${containerIndex}-line`
// //                               ]
// //                                 ? "border-red-500"
// //                                 : "border-gray-300"
// //                             } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
// //                             value={container.line}
// //                             onChange={(e) =>
// //                               updateContainerData(
// //                                 vehicleIndex,
// //                                 containerIndex,
// //                                 "line",
// //                                 e.target.value
// //                               )
// //                             }
// //                             placeholder="e.g., Maersk"
// //                             required
// //                           />
// //                           {validationErrors[
// //                             `${vehicleIndex}-${containerIndex}-line`
// //                           ] && (
// //                             <p className="text-red-500 text-xs mt-1">
// //                               {
// //                                 validationErrors[
// //                                   `${vehicleIndex}-${containerIndex}-line`
// //                                 ]
// //                               }
// //                             </p>
// //                           )}
// //                         </div>
// //                         <div>
// //                           <label className="block text-sm font-medium text-gray-700 mb-1">
// //                             Seal Number *
// //                           </label>
// //                           <input
// //                             type="text"
// //                             className={`w-full border ${
// //                               validationErrors[
// //                                 `${vehicleIndex}-${containerIndex}-sealNo`
// //                               ]
// //                                 ? "border-red-500"
// //                                 : "border-gray-300"
// //                             } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
// //                             value={container.sealNo}
// //                             onChange={(e) =>
// //                               updateContainerData(
// //                                 vehicleIndex,
// //                                 containerIndex,
// //                                 "sealNo",
// //                                 e.target.value.toUpperCase()
// //                               )
// //                             }
// //                             placeholder="e.g., SEAL001234"
// //                             required
// //                           />
// //                           {validationErrors[
// //                             `${vehicleIndex}-${containerIndex}-sealNo`
// //                           ] && (
// //                             <p className="text-red-500 text-xs mt-1">
// //                               {
// //                                 validationErrors[
// //                                   `${vehicleIndex}-${containerIndex}-sealNo`
// //                                 ]
// //                               }
// //                             </p>
// //                           )}
// //                         </div>
// //                         <div>
// //                           <label className="block text-sm font-medium text-gray-700 mb-1">
// //                             Seal 1
// //                           </label>
// //                           <input
// //                             type="text"
// //                             className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
// //                             value={container.seal1}
// //                             onChange={(e) =>
// //                               updateContainerData(
// //                                 vehicleIndex,
// //                                 containerIndex,
// //                                 "seal1",
// //                                 e.target.value.toUpperCase()
// //                               )
// //                             }
// //                             placeholder="e.g., SEAL1_001"
// //                           />
// //                         </div>
// //                         <div>
// //                           <label className="block text-sm font-medium text-gray-700 mb-1">
// //                             Seal 2
// //                           </label>
// //                           <input
// //                             type="text"
// //                             className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
// //                             value={container.seal2}
// //                             onChange={(e) =>
// //                               updateContainerData(
// //                                 vehicleIndex,
// //                                 containerIndex,
// //                                 "seal2",
// //                                 e.target.value.toUpperCase()
// //                               )
// //                             }
// //                             placeholder="e.g., SEAL2_001"
// //                           />
// //                         </div>
// //                         <div>
// //                           <label className="block text-sm font-medium text-gray-700 mb-1">
// //                             Container Weight (kg) *
// //                           </label>
// //                           <input
// //                             type="number"
// //                             step="0.01"
// //                             className={`w-full border ${
// //                               validationErrors[
// //                                 `${vehicleIndex}-${containerIndex}-containerTotalWeight`
// //                               ]
// //                                 ? "border-red-500"
// //                                 : "border-gray-300"
// //                             } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
// //                             value={container.containerTotalWeight}
// //                             onChange={(e) =>
// //                               updateContainerData(
// //                                 vehicleIndex,
// //                                 containerIndex,
// //                                 "containerTotalWeight",
// //                                 e.target.value
// //                               )
// //                             }
// //                             placeholder="e.g., 25000.50"
// //                             required
// //                           />
// //                           {validationErrors[
// //                             `${vehicleIndex}-${containerIndex}-containerTotalWeight`
// //                           ] && (
// //                             <p className="text-red-500 text-xs mt-1">
// //                               {
// //                                 validationErrors[
// //                                   `${vehicleIndex}-${containerIndex}-containerTotalWeight`
// //                                 ]
// //                               }
// //                             </p>
// //                           )}
// //                         </div>
// //                         <div>
// //                           <label className="block text-sm font-medium text-gray-700 mb-1">
// //                             Cargo Weight (kg) *
// //                           </label>
// //                           <input
// //                             type="number"
// //                             step="0.01"
// //                             className={`w-full border ${
// //                               validationErrors[
// //                                 `${vehicleIndex}-${containerIndex}-cargoTotalWeight`
// //                               ]
// //                                 ? "border-red-500"
// //                                 : "border-gray-300"
// //                             } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
// //                             value={container.cargoTotalWeight}
// //                             onChange={(e) =>
// //                               updateContainerData(
// //                                 vehicleIndex,
// //                                 containerIndex,
// //                                 "cargoTotalWeight",
// //                                 e.target.value
// //                               )
// //                             }
// //                             placeholder="e.g., 20000.00"
// //                             required
// //                           />
// //                           {validationErrors[
// //                             `${vehicleIndex}-${containerIndex}-cargoTotalWeight`
// //                           ] && (
// //                             <p className="text-red-500 text-xs mt-1">
// //                               {
// //                                 validationErrors[
// //                                   `${vehicleIndex}-${containerIndex}-cargoTotalWeight`
// //                                 ]
// //                               }
// //                             </p>
// //                           )}
// //                         </div>
// //                         <div>
// //                           <label className="block text-sm font-medium text-gray-700 mb-1">
// //                             Container Type *
// //                           </label>
// //                           <input
// //                             type="text"
// //                             className={`w-full border ${
// //                               validationErrors[
// //                                 `${vehicleIndex}-${containerIndex}-containerType`
// //                               ]
// //                                 ? "border-red-500"
// //                                 : "border-gray-300"
// //                             } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
// //                             value={container.containerType}
// //                             onChange={(e) =>
// //                               updateContainerData(
// //                                 vehicleIndex,
// //                                 containerIndex,
// //                                 "containerType",
// //                                 e.target.value
// //                               )
// //                             }
// //                             placeholder="e.g., 40HC"
// //                             required
// //                           />
// //                           {validationErrors[
// //                             `${vehicleIndex}-${containerIndex}-containerType`
// //                           ] && (
// //                             <p className="text-red-500 text-xs mt-1">
// //                               {
// //                                 validationErrors[
// //                                   `${vehicleIndex}-${containerIndex}-containerType`
// //                                 ]
// //                               }
// //                             </p>
// //                           )}
// //                         </div>
// //                         <div>
// //                           <label className="block text-sm font-medium text-gray-700 mb-1">
// //                             Container Size *
// //                           </label>
// //                           <input
// //                             type="text"
// //                             className={`w-full border ${
// //                               validationErrors[
// //                                 `${vehicleIndex}-${containerIndex}-containerSize`
// //                               ]
// //                                 ? "border-red-500"
// //                                 : "border-gray-300"
// //                             } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
// //                             value={container.containerSize}
// //                             onChange={(e) =>
// //                               updateContainerData(
// //                                 vehicleIndex,
// //                                 containerIndex,
// //                                 "containerSize",
// //                                 e.target.value
// //                               )
// //                             }
// //                             placeholder="e.g., 40ft"
// //                             required
// //                           />
// //                           {validationErrors[
// //                             `${vehicleIndex}-${containerIndex}-containerSize`
// //                           ] && (
// //                             <p className="text-red-500 text-xs mt-1">
// //                               {
// //                                 validationErrors[
// //                                   `${vehicleIndex}-${containerIndex}-containerSize`
// //                                 ]
// //                               }
// //                             </p>
// //                           )}
// //                         </div>
// //                       </div>
// //                     </div>
// //                   ))}
// //                   <button
// //                     type="button"
// //                     onClick={() => addContainer(vehicleIndex)}
// //                     className="mt-2 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
// //                   >
// //                     Add Container
// //                   </button>
// //                 </div>
// //               </div>
// //             ))}
// //             <div className="flex justify-between mt-6">
// //               <button
// //                 type="button"
// //                 onClick={addVehicle}
// //                 className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
// //               >
// //                 Add Vehicle
// //               </button>
// //               <div className="flex space-x-4">
// //                 <button
// //                   type="button"
// //                   onClick={() => navigate(-1)}
// //                   className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
// //                 >
// //                   Cancel
// //                 </button>
// //                 <button
// //                   type="submit"
// //                   disabled={isSubmitting}
// //                   className={`px-8 py-2 rounded-md text-white font-medium ${
// //                     isSubmitting
// //                       ? "bg-gray-400 cursor-not-allowed"
// //                       : "bg-blue-600 hover:bg-blue-700"
// //                   } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center`}
// //                 >
// //                   {isSubmitting ? (
// //                     <>
// //                       <svg
// //                         className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
// //                         xmlns="http://www.w3.org/2000/svg"
// //                         fill="none"
// //                         viewBox="0 0 24 24"
// //                       >
// //                         <circle
// //                           className="opacity-25"
// //                           cx="12"
// //                           cy="12"
// //                           r="10"
// //                           stroke="currentColor"
// //                           strokeWidth="4"
// //                         ></circle>
// //                         <path
// //                           className="opacity-75"
// //                           fill="currentColor"
// //                           d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
// //                         ></path>
// //                       </svg>
// //                       Submitting...
// //                     </>
// //                   ) : (
// //                     "Save All"
// //                   )}
// //                 </button>
// //               </div>
// //             </div>
// //           </form>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default BulkVehicleContainerForm;
// import { useState, useEffect, useRef } from "react";
// import {
//   driverAPI,
//   vendorAPI,
//   vehicleAPI,
//   transporterAPI,
// } from "../../utils/Api";
// import { toast } from "react-toastify";
// import { useNavigate } from "react-router-dom";
// import { ToastContainer } from "react-toastify";

// const VendorSearchInput = ({ value, onChange, placeholder }) => {
//   const [vendors, setVendors] = useState([]);
//   const [filteredVendors, setFilteredVendors] = useState([]);
//   const [isOpen, setIsOpen] = useState(false);
//   const [searchTerm, setSearchTerm] = useState(value || "");
//   const [loading, setLoading] = useState(false);
//   const [dropdownPosition, setDropdownPosition] = useState("bottom");

//   const inputRef = useRef(null);
//   const dropdownRef = useRef(null);

//   // Self option object
//   const selfOption = {
//     VENDOR_ID: "SELF",
//     VENDOR_NAME: "Self",
//     VENDOR_CODE: "SELF",
//     CITY: "Own Vehicles",
//     ADDRESS: "Own Vehicles",
//   };

//   useEffect(() => {
//     const fetchVendors = async () => {
//       setLoading(true);
//       try {
//         const response = await vendorAPI.getAllVendors();
//         const vendorsData = response.data || response || [];
//         if (Array.isArray(vendorsData)) {
//           const vendorsWithSelf = [selfOption, ...vendorsData];
//           setVendors(vendorsWithSelf);
//           setFilteredVendors(vendorsWithSelf);
//         }
//       } catch (error) {
//         console.error("Error fetching vendors:", error);
//         setVendors([selfOption]);
//         setFilteredVendors([selfOption]);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchVendors();
//   }, []);

//   useEffect(() => {
//     if (searchTerm && vendors.length > 0) {
//       const filtered = vendors.filter((v) =>
//         v.VENDOR_NAME.toLowerCase().includes(searchTerm.toLowerCase())
//       );
//       setFilteredVendors(filtered);
//     } else {
//       setFilteredVendors(vendors);
//     }
//   }, [searchTerm, vendors]);

//   useEffect(() => {
//     setSearchTerm(value || "");
//   }, [value]);

//   const calculateDropdownPosition = () => {
//     if (!inputRef.current) return;
//     const inputRect = inputRef.current.getBoundingClientRect();
//     const viewportHeight = window.innerHeight;
//     const dropdownHeight = 200;
//     const spaceBelow = viewportHeight - inputRect.bottom;
//     const spaceAbove = inputRect.top;

//     if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
//       setDropdownPosition("top");
//     } else {
//       setDropdownPosition("bottom");
//     }
//   };

//   const handleFocus = () => {
//     setIsOpen(true);
//     setTimeout(calculateDropdownPosition, 0);
//   };

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         dropdownRef.current &&
//         !dropdownRef.current.contains(event.target) &&
//         inputRef.current &&
//         !inputRef.current.contains(event.target)
//       ) {
//         setIsOpen(false);
//       }
//     };

//     if (isOpen) {
//       document.addEventListener("mousedown", handleClickOutside);
//       window.addEventListener("scroll", calculateDropdownPosition, true);
//       window.addEventListener("resize", calculateDropdownPosition);
//     }

//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//       window.removeEventListener("scroll", calculateDropdownPosition, true);
//       window.removeEventListener("resize", calculateDropdownPosition);
//     };
//   }, [isOpen, filteredVendors.length]);

//   const getDropdownStyles = () => {
//     if (!inputRef.current || !isOpen) return { display: "none" };
//     const inputRect = inputRef.current.getBoundingClientRect();
//     const styles = {
//       width: `${Math.max(inputRect.width, 200)}px`,
//       maxHeight: "200px",
//       zIndex: 9999,
//     };

//     if (dropdownPosition === "top") {
//       styles.bottom = `${window.innerHeight - inputRect.top + 4}px`;
//       styles.left = `${inputRect.left}px`;
//     } else {
//       styles.top = `${inputRect.bottom + 4}px`;
//       styles.left = `${inputRect.left}px`;
//     }
//     return styles;
//   };

//   return (
//     <>
//       <div className="relative">
//         <input
//           ref={inputRef}
//           type="text"
//           className="w-full min-w-[160px] border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//           value={searchTerm}
//           onChange={(e) => {
//             setSearchTerm(e.target.value);
//             onChange(e.target.value);
//             setIsOpen(true);
//           }}
//           onFocus={handleFocus}
//           placeholder={placeholder}
//           required
//           autoComplete="off"
//         />
//         {loading && (
//           <div className="absolute right-2 top-2">
//             <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
//           </div>
//         )}
//       </div>

//       {isOpen && filteredVendors.length > 0 && (
//         <div
//           ref={dropdownRef}
//           className="fixed bg-white border border-gray-300 rounded-md shadow-lg overflow-y-auto"
//           style={getDropdownStyles()}
//         >
//           {filteredVendors.map((vendor) => (
//             <div
//               key={vendor.VENDOR_ID}
//               className={`px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
//                 vendor.VENDOR_ID === "SELF" ? "bg-green-50 font-medium" : ""
//               }`}
//               onClick={() => {
//                 setSearchTerm(vendor.VENDOR_NAME);
//                 onChange(vendor.VENDOR_NAME);
//                 setIsOpen(false);
//               }}
//             >
//               <div
//                 className={`font-medium text-gray-900 truncate ${
//                   vendor.VENDOR_ID === "SELF" ? "text-green-800" : ""
//                 }`}
//               >
//                 {vendor.VENDOR_NAME}
//                 {vendor.VENDOR_ID === "SELF" && (
//                   <span className="ml-2 text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
//                     Own Vehicles
//                   </span>
//                 )}
//               </div>
//               <div className="text-sm text-gray-500 truncate">
//                 {vendor.VENDOR_CODE || "No code"} |{" "}
//                 {vendor.CITY || vendor.ADDRESS || "No location"}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {isOpen && filteredVendors.length === 0 && searchTerm && (
//         <div
//           ref={dropdownRef}
//           className="fixed bg-white border border-gray-300 rounded-md shadow-lg"
//           style={getDropdownStyles()}
//         >
//           <div className="px-3 py-2 text-gray-500 text-sm">
//             No vendors found matching "{searchTerm}"
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// const DriverSearchInput = ({ value, onChange, vendorName, placeholder }) => {
//   const [drivers, setDrivers] = useState([]);
//   const [filteredDrivers, setFilteredDrivers] = useState([]);
//   const [isOpen, setIsOpen] = useState(false);
//   const [searchTerm, setSearchTerm] = useState(value || "");
//   const [loading, setLoading] = useState(false);
//   const [vendorId, setVendorId] = useState(null);
//   const [dropdownPosition, setDropdownPosition] = useState("bottom");

//   const inputRef = useRef(null);
//   const dropdownRef = useRef(null);

//   useEffect(() => {
//     const getVendorId = async () => {
//       if (!vendorName) {
//         setVendorId(null);
//         return;
//       }

//       if (vendorName === "Self") {
//         setVendorId("SELF");
//         return;
//       }

//       try {
//         const vendorsResponse = await vendorAPI.getAllVendors();
//         const vendors = vendorsResponse.data || vendorsResponse || [];
//         const vendor = vendors.find((v) => v.VENDOR_NAME === vendorName);
//         if (vendor) {
//           setVendorId(vendor.VENDOR_ID);
//         } else {
//           setVendorId(null);
//         }
//       } catch (error) {
//         console.error("Error fetching vendor ID:", error);
//         setVendorId(null);
//       }
//     };
//     getVendorId();
//   }, [vendorName]);

//   useEffect(() => {
//     const fetchData = async () => {
//       if (!vendorId) {
//         setDrivers([]);
//         setFilteredDrivers([]);
//         return;
//       }

//       setLoading(true);
//       try {
//         if (vendorId === "SELF") {
//           const vehiclesResponse = await vehicleAPI.getAllvehicles();
//           let vehiclesData = [];
//           if (vehiclesResponse && Array.isArray(vehiclesResponse)) {
//             vehiclesData = vehiclesResponse;
//           } else if (
//             vehiclesResponse?.data &&
//             Array.isArray(vehiclesResponse.data)
//           ) {
//             vehiclesData = vehiclesResponse.data;
//           }

//           const vehicleDrivers = vehiclesData.map((vehicle, index) => {
//             const driverName =
//               vehicle.OWNER_NAME ||
//               vehicle.owner_name ||
//               `Owner of ${
//                 vehicle.VEHICLE_NUMBER ||
//                 vehicle.vehicle_number ||
//                 "Unknown Vehicle"
//               }`;
//             const vehicleNumber =
//               vehicle.VEHICLE_NUMBER || vehicle.vehicle_number || "";
//             const ownerContact =
//               vehicle.OWNER_CONTACT || vehicle.owner_contact || "";
//             const vehicleType =
//               vehicle.VEHICLE_TYPE || vehicle.vehicle_type || "";
//             const vehicleId =
//               vehicle.VEHICLE_ID || vehicle.vehicle_id || vehicle.id || index;

//             return {
//               DRIVER_ID: `VEHICLE_${vehicleId}`,
//               DRIVER_NAME: driverName,
//               CONTACT_NO: ownerContact,
//               MOBILE_NO: ownerContact,
//               DL_NO: "",
//               DL_RENEWABLE_DATE: null,
//               VEHICLE_NO: vehicleNumber,
//               VEHICLE_ID: vehicleId,
//               VEHICLE_TYPE: vehicleType,
//               IS_SELF_VEHICLE: true,
//             };
//           });
//           setDrivers(vehicleDrivers);
//           setFilteredDrivers(vehicleDrivers);
//         } else {
//           const driversResponse = await driverAPI.getDriversByVendorId(
//             vendorId
//           );
//           const driversData = driversResponse.data || driversResponse || [];
//           setDrivers(driversData);
//           setFilteredDrivers(driversData);
//         }
//       } catch (error) {
//         console.error("Error fetching data:", error);
//         setDrivers([]);
//         setFilteredDrivers([]);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, [vendorId]);

//   useEffect(() => {
//     if (searchTerm && drivers.length > 0) {
//       const filtered = drivers.filter((d) =>
//         d.DRIVER_NAME.toLowerCase().includes(searchTerm.toLowerCase())
//       );
//       setFilteredDrivers(filtered);
//     } else {
//       setFilteredDrivers(drivers);
//     }
//   }, [searchTerm, drivers]);

//   useEffect(() => {
//     setSearchTerm(value || "");
//   }, [value]);

//   const calculateDropdownPosition = () => {
//     if (!inputRef.current) return;
//     const inputRect = inputRef.current.getBoundingClientRect();
//     const viewportHeight = window.innerHeight;
//     const dropdownHeight = 200;
//     const spaceBelow = viewportHeight - inputRect.bottom;
//     const spaceAbove = inputRect.top;

//     if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
//       setDropdownPosition("top");
//     } else {
//       setDropdownPosition("bottom");
//     }
//   };

//   const handleFocus = () => {
//     setIsOpen(true);
//     setTimeout(calculateDropdownPosition, 0);
//   };

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         dropdownRef.current &&
//         !dropdownRef.current.contains(event.target) &&
//         inputRef.current &&
//         !inputRef.current.contains(event.target)
//       ) {
//         setIsOpen(false);
//       }
//     };

//     if (isOpen) {
//       document.addEventListener("mousedown", handleClickOutside);
//       window.addEventListener("scroll", calculateDropdownPosition, true);
//       window.addEventListener("resize", calculateDropdownPosition);
//     }

//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//       window.removeEventListener("scroll", calculateDropdownPosition, true);
//       window.removeEventListener("resize", calculateDropdownPosition);
//     };
//   }, [isOpen, filteredDrivers.length]);

//   const getDropdownStyles = () => {
//     if (!inputRef.current || !isOpen) return { display: "none" };
//     const inputRect = inputRef.current.getBoundingClientRect();
//     const styles = {
//       width: `${Math.max(inputRect.width, 250)}px`,
//       maxHeight: "200px",
//       zIndex: 9999,
//     };

//     if (dropdownPosition === "top") {
//       styles.bottom = `${window.innerHeight - inputRect.top + 4}px`;
//       styles.left = `${inputRect.left}px`;
//     } else {
//       styles.top = `${inputRect.bottom + 4}px`;
//       styles.left = `${inputRect.left}px`;
//     }
//     return styles;
//   };

//   const getVehicleInfo = (driver) => {
//     if (vendorId === "SELF" || driver.IS_SELF_VEHICLE) {
//       const vehicleInfo = [];
//       if (driver.VEHICLE_NO) vehicleInfo.push(`${driver.VEHICLE_NO}`);
//       if (driver.VEHICLE_TYPE) vehicleInfo.push(`(${driver.VEHICLE_TYPE})`);
//       return vehicleInfo.length > 0 ? vehicleInfo.join(" ") : "Own Vehicle";
//     } else {
//       return driver.VEHICLE_NO
//         ? `Vehicle: ${driver.VEHICLE_NO}`
//         : "No vehicle assigned";
//     }
//   };

//   const getContactInfo = (driver) => {
//     const contact = driver.CONTACT_NO || driver.MOBILE_NO;
//     const license = driver.DL_NO;

//     if (vendorId === "SELF" || driver.IS_SELF_VEHICLE) {
//       return contact || "No contact info";
//     } else {
//       if (contact && license) {
//         return `${contact} | License: ${license}`;
//       } else if (contact) {
//         return contact;
//       } else if (license) {
//         return `License: ${license}`;
//       } else {
//         return "No contact info";
//       }
//     }
//   };

//   return (
//     <>
//       <div className="relative">
//         <input
//           ref={inputRef}
//           type="text"
//           className="w-full min-w-[140px] border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//           value={searchTerm}
//           onChange={(e) => {
//             setSearchTerm(e.target.value);
//             onChange(e.target.value);
//             setIsOpen(true);
//           }}
//           onFocus={handleFocus}
//           placeholder={placeholder}
//           disabled={!vendorName}
//           required
//           autoComplete="off"
//         />
//         {loading && (
//           <div className="absolute right-2 top-2">
//             <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
//           </div>
//         )}
//       </div>

//       {isOpen && filteredDrivers.length > 0 && (
//         <div
//           ref={dropdownRef}
//           className="fixed bg-white border border-gray-300 rounded-md shadow-lg overflow-y-auto"
//           style={getDropdownStyles()}
//         >
//           {filteredDrivers.map((driver) => (
//             <div
//               key={driver.DRIVER_ID}
//               className={`px-3 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
//                 vendorId === "SELF" || driver.IS_SELF_VEHICLE
//                   ? "bg-green-50"
//                   : ""
//               }`}
//               onClick={() => {
//                 setSearchTerm(driver.DRIVER_NAME);
//                 onChange(driver.DRIVER_NAME, driver);
//                 setIsOpen(false);
//               }}
//             >
//               <div className="font-medium text-gray-900 truncate">
//                 {driver.DRIVER_NAME}
//                 {(vendorId === "SELF" || driver.IS_SELF_VEHICLE) && (
//                   <span className="ml-2 text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
//                     Own
//                   </span>
//                 )}
//               </div>
//               <div className="text-sm text-gray-500 truncate mt-1">
//                 {getContactInfo(driver)}
//               </div>
//               <div
//                 className={`text-sm truncate mt-1 ${
//                   vendorId === "SELF" || driver.IS_SELF_VEHICLE
//                     ? "text-green-600"
//                     : "text-blue-600"
//                 }`}
//               >
//                 {getVehicleInfo(driver)}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {isOpen && filteredDrivers.length === 0 && searchTerm && !loading && (
//         <div
//           ref={dropdownRef}
//           className="fixed bg-white border border-gray-300 rounded-md shadow-lg"
//           style={getDropdownStyles()}
//         >
//           <div className="px-3 py-2 text-gray-500 text-sm">
//             {vendorId === "SELF"
//               ? `No vehicles found matching "${searchTerm}"`
//               : `No drivers found matching "${searchTerm}"`}
//           </div>
//         </div>
//       )}

//       {!vendorName && isOpen && (
//         <div
//           ref={dropdownRef}
//           className="fixed bg-white border border-gray-300 rounded-md shadow-lg"
//           style={getDropdownStyles()}
//         >
//           <div className="px-3 py-2 text-gray-500 text-sm">
//             Please select a vendor first
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// // Main integrated component
// const IntegratedVehicleContainerPage = () => {
//   const navigate = useNavigate();
//   const [isLoading, setIsLoading] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [transportRequestId, setTransportRequestId] = useState("");
//   const [vehicleDataList, setVehicleDataList] = useState([]);
//   const [containers, setContainers] = useState([]);
//   const [existingTransporterData, setExistingTransporterData] = useState([]);
//   const [groupedContainers, setGroupedContainers] = useState({});
//   const [expandedVehicle, setExpandedVehicle] = useState(null);
//   const [activeTab, setActiveTab] = useState("vehicles");
//   const [validationErrors, setValidationErrors] = useState({});

//   // Initialize with data from sessionStorage
//   useEffect(() => {
//     const storedContainerData = sessionStorage.getItem("containerData");
//     const storedRequestId = sessionStorage.getItem("transportRequestId");

//     if (storedRequestId) {
//       setTransportRequestId(storedRequestId);
//     }

//     if (storedContainerData) {
//       try {
//         const parsedData = JSON.parse(storedContainerData);
//         const uniqueVehicles = [];
//         const vehicleMap = {};

//         parsedData.forEach((item) => {
//           if (item.vehicleNumber && !vehicleMap[item.vehicleNumber]) {
//             vehicleMap[item.vehicleNumber] = true;
//             uniqueVehicles.push({
//               vehicleIndex: Object.keys(vehicleMap).length,
//               vehicleNumber: item.vehicleNumber,
//               vendorName: item.transporterName || item.vendorName || "",
//               transporterName: item.transporterName || item.vendorName || "",
//               driverName: item.driverName || "",
//               driverContact: item.driverContact || "",
//               licenseNumber: item.licenseNumber || "",
//               licenseExpiry: item.licenseExpiry || "",
//             });
//           }
//         });
//         setVehicleDataList(uniqueVehicles);

//         const containerData = parsedData.map((vehicle, index) => ({
//           id: vehicle.id || null,
//           containerNo: vehicle.containerNo || "",
//           numberOfContainers: vehicle.numberOfContainers?.toString() || "",
//           containerType: vehicle.containerType || "",
//           containerSize: vehicle.containerSize || "",
//           line: vehicle.line || "",
//           seal1: vehicle.seal1 || "",
//           seal2: vehicle.seal2 || "",
//           containerTotalWeight: vehicle.containerTotalWeight?.toString() || "",
//           cargoTotalWeight: vehicle.cargoTotalWeight?.toString() || "",
//           remarks: vehicle.remarks || "",
//           vehicleNumber: vehicle.vehicleNumber || "",
//           vehicleIndex: vehicle.vehicleIndex || index + 1,
//         }));

//         setContainers(
//           containerData.length > 0 ? containerData : [createEmptyContainer()]
//         );
//       } catch (error) {
//         console.error("Error parsing stored data:", error);
//         setVehicleDataList([createEmptyVehicle()]);
//         setContainers([createEmptyContainer()]);
//       }
//     } else {
//       setVehicleDataList([createEmptyVehicle()]);
//       setContainers([createEmptyContainer()]);
//     }
//   }, []);

//   // Group containers by vehicle number
//   useEffect(() => {
//     const grouped = {};
//     containers.forEach((container) => {
//       const vehicleNumber = container.vehicleNumber || "unassigned";
//       if (!grouped[vehicleNumber]) {
//         grouped[vehicleNumber] = [];
//       }
//       grouped[vehicleNumber].push(container);
//     });
//     setGroupedContainers(grouped);

//     if (expandedVehicle === null && Object.keys(grouped).length > 0) {
//       setExpandedVehicle(Object.keys(grouped)[0]);
//     }
//   }, [containers]);

//   const createEmptyVehicle = () => ({
//     vehicleIndex: vehicleDataList.length + 1,
//     vendorName: "",
//     transporterName: "",
//     vehicleNumber: "",
//     driverName: "",
//     driverContact: "",
//     licenseNumber: "",
//     licenseExpiry: "",
//   });

//   const createEmptyContainer = () => ({
//     id: null,
//     containerNo: "",
//     numberOfContainers: "",
//     containerType: "",
//     containerSize: "",
//     line: "",
//     seal1: "",
//     seal2: "",
//     containerTotalWeight: "",
//     cargoTotalWeight: "",
//     remarks: "",
//     vehicleNumber: "",
//     vehicleIndex: containers.length + 1,
//   });

//   const validateVehicleData = (field, value) => {
//     switch (field) {
//       case "vehicleNumber":
//         return /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/.test(value);
//       case "driverName":
//         return value.length >= 3 && /^[A-Za-z.\s]+$/.test(value);
//       case "driverContact":
//         return /^\d{10}$/.test(value);
//       case "licenseNumber":
//         return value.length >= 5 && /^[A-Z0-9]+$/.test(value);
//       case "licenseExpiry":
//         const today = new Date();
//         today.setHours(0, 0, 0, 0);
//         const expiryDate = new Date(value);
//         return expiryDate >= today;
//       default:
//         return true;
//     }
//   };

//   const updateVehicleData = (index, field, value) => {
//     const updatedVehicles = vehicleDataList.map((vehicle, i) =>
//       i === index ? { ...vehicle, [field]: value } : vehicle
//     );
//     setVehicleDataList(updatedVehicles);

//     const isValid = validateVehicleData(field, value);
//     setValidationErrors((prev) => ({
//       ...prev,
//       [`${index}-${field}`]: isValid
//         ? null
//         : `Invalid ${field.replace(/([A-Z])/g, " $1").toLowerCase()}`,
//     }));

//     // Update session storage
//     sessionStorage.setItem("vehicleData", JSON.stringify(updatedVehicles));
//   };

//   const handleVendorChange = (index, vendorName) => {
//     updateVehicleData(index, "vendorName", vendorName);
//     updateVehicleData(index, "transporterName", vendorName);
//   };

//   const handleDriverSelection = (index, driverName, driverData) => {
//     if (driverData) {
//       updateVehicleData(index, "driverName", driverName);
//       updateVehicleData(
//         index,
//         "driverContact",
//         driverData.MOBILE_NO || driverData.CONTACT_NO || ""
//       );
//       updateVehicleData(index, "licenseNumber", driverData.DL_NO || "");
//       updateVehicleData(index, "vehicleNumber", driverData.VEHICLE_NO || "");

//       if (driverData.DL_RENEWABLE_DATE) {
//         const date = new Date(driverData.DL_RENEWABLE_DATE);
//         const formattedDate = date.toISOString().split("T")[0];
//         updateVehicleData(index, "licenseExpiry", formattedDate);
//       }
//     } else {
//       updateVehicleData(index, "driverName", driverName);
//     }
//   };

//   const addContainer = (vehicleNumber = "") => {
//     const newContainer = createEmptyContainer();
//     newContainer.vehicleIndex = containers.length + 1;
//     newContainer.vehicleNumber = vehicleNumber;
//     setContainers([...containers, newContainer]);
//   };

//   const removeContainer = async (index) => {
//     if (containers.length > 1) {
//       const containerToRemove = containers[index];

//       if (containerToRemove.id) {
//         try {
//           setIsLoading(true);
//           const response = await transporterAPI.deleteContainer(
//             containerToRemove.id
//           );
//           if (response.success) {
//             toast.success("Container deleted successfully");
//           } else {
//             toast.error("Failed to delete container from database");
//             setIsLoading(false);
//             return;
//           }
//         } catch (error) {
//           console.error("Error deleting container:", error);
//           toast.error(error.message || "Failed to delete container");
//           setIsLoading(false);
//           return;
//         } finally {
//           setIsLoading(false);
//         }
//       }

//       const updatedContainers = containers.filter((_, i) => i !== index);
//       const reindexedContainers = updatedContainers.map((container, i) => ({
//         ...container,
//         vehicleIndex: i + 1,
//       }));
//       setContainers(reindexedContainers);
//       sessionStorage.setItem(
//         "containerData",
//         JSON.stringify(reindexedContainers)
//       );
//       toast.success("Container removed successfully");
//     } else {
//       toast.warning("At least one container entry is required");
//     }
//   };

//   const updateContainerData = (index, field, value) => {
//     if (field === "containerNo") {
//       value = value.toUpperCase();
//       if (value.length > 11) {
//         value = value.substring(0, 11);
//       }
//       if (value.length <= 4) {
//         value = value.replace(/[^A-Z]/g, "");
//       } else {
//         const letters = value.substring(0, 4).replace(/[^A-Z]/g, "");
//         const digits = value.substring(4).replace(/[^0-9]/g, "");
//         value = letters + digits;
//       }
//     }

//     const updatedContainers = containers.map((container, i) =>
//       i === index ? { ...container, [field]: value } : container
//     );
//     setContainers(updatedContainers);
//     sessionStorage.setItem("containerData", JSON.stringify(updatedContainers));
//   };

//   const toggleVehicleExpansion = (vehicleNumber) => {
//     setExpandedVehicle(
//       expandedVehicle === vehicleNumber ? null : vehicleNumber
//     );
//   };

//   const getVendorName = (vehicle) => {
//     return vehicle.vendorName || vehicle.transporterName || "";
//   };

//   const onBack = () => {
//     navigate(-1);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     // Validate all vehicles first
//     const vehicleErrors = [];
//     vehicleDataList.forEach((vehicle, index) => {
//       if (!vehicle.vendorName?.trim()) {
//         vehicleErrors.push(`Vehicle ${index + 1}: Vendor name is required`);
//       }
//       if (!vehicle.vehicleNumber?.trim()) {
//         vehicleErrors.push(`Vehicle ${index + 1}: Vehicle number is required`);
//       }
//       if (!vehicle.driverName?.trim()) {
//         vehicleErrors.push(`Vehicle ${index + 1}: Driver name is required`);
//       }
//       if (!vehicle.driverContact?.trim()) {
//         vehicleErrors.push(`Vehicle ${index + 1}: Driver contact is required`);
//       }
//       if (!vehicle.licenseNumber?.trim()) {
//         vehicleErrors.push(`Vehicle ${index + 1}: License number is required`);
//       }
//       if (!vehicle.licenseExpiry?.trim()) {
//         vehicleErrors.push(`Vehicle ${index + 1}: License expiry is required`);
//       }
//     });

//     // Validate containers
//     const containerErrors = [];
//     containers.forEach((container, index) => {
//       if (!container.containerNo?.trim()) {
//         containerErrors.push(
//           `Container ${index + 1}: Container number is required`
//         );
//       }
//       if (!container.vehicleNumber?.trim()) {
//         containerErrors.push(
//           `Container ${index + 1}: Vehicle number is required`
//         );
//       }
//     });

//     const allErrors = [...vehicleErrors, ...containerErrors];
//     if (allErrors.length > 0) {
//       toast.error(`Please fix the following errors:\n${allErrors.join("\n")}`);
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       // Submit both vehicle and container data
//       const vehiclePromises = vehicleDataList.map(async (vehicle) => {
//         const vehicleData = {
//           vehicle_number: vehicle.vehicleNumber,
//           driver_name: vehicle.driverName,
//           driver_contact: vehicle.driverContact,
//           license_number: vehicle.licenseNumber,
//           license_expiry: vehicle.licenseExpiry,
//           vendor_name: vehicle.vendorName,
//         };
//         return transporterAPI.updateVehicleDetails(
//           transportRequestId,
//           vehicleData
//         );
//       });

//       // Group containers by vehicle and submit
//       const containersByVehicle = {};
//       containers.forEach((container) => {
//         if (!containersByVehicle[container.vehicleNumber]) {
//           containersByVehicle[container.vehicleNumber] = [];
//         }
//         containersByVehicle[container.vehicleNumber].push(container);
//       });

//       const containerPromises = [];
//       for (const [vehicleNumber, vehicleContainers] of Object.entries(
//         containersByVehicle
//       )) {
//         const existingContainers = vehicleContainers.filter(
//           (container) => container.id
//         );
//         const newContainers = vehicleContainers.filter(
//           (container) => !container.id
//         );

//         // Update existing containers
//         existingContainers.forEach((container) => {
//           const containerData = {
//             container_no: container.containerNo,
//             line: container.line,
//             seal1: container.seal1,
//             seal2: container.seal2,
//             container_total_weight:
//               parseFloat(container.containerTotalWeight) || 0,
//             cargo_total_weight: parseFloat(container.cargoTotalWeight) || 0,
//             container_type: container.containerType,
//             container_size: container.containerSize,
//             vehicle_number: container.vehicleNumber,
//             remarks: container.remarks,
//           };
//           containerPromises.push(
//             transporterAPI.updateContainerDetails(container.id, containerData)
//           );
//         });

//         // Add new containers
//         if (newContainers.length > 0) {
//           const formattedNewContainers = newContainers.map((container) => ({
//             container_no: container.containerNo,
//             line: container.line,
//             seal1: container.seal1,
//             seal2: container.seal2,
//             container_total_weight:
//               parseFloat(container.containerTotalWeight) || 0,
//             cargo_total_weight: parseFloat(container.cargoTotalWeight) || 0,
//             container_type: container.containerType,
//             container_size: container.containerSize,
//             vehicle_number: container.vehicleNumber,
//             remarks: container.remarks,
//           }));

//           containerPromises.push(
//             transporterAPI.addContainersToVehicle(
//               transportRequestId,
//               vehicleNumber,
//               formattedNewContainers
//             )
//           );
//         }
//       }

//       // Wait for all promises to resolve
//       await Promise.all([...vehiclePromises, ...containerPromises]);

//       toast.success("Vehicle and container details updated successfully!");

//       // Update session storage with latest data
//       sessionStorage.setItem("vehicleData", JSON.stringify(vehicleDataList));
//       sessionStorage.setItem("containerData", JSON.stringify(containers));
//     } catch (error) {
//       console.error("Error updating details:", error);
//       toast.error(error.message || "Failed to update details");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
//           <p className="mt-4 text-gray-600">Loading details...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 py-8">
//       <ToastContainer
//         position="top-right"
//         autoClose={5000}
//         hideProgressBar={false}
//         newestOnTop
//         closeOnClick
//         rtl={false}
//         pauseOnFocusLoss
//         draggable
//         pauseOnHover
//       />

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         {/* Header */}
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
//           <div className="px-6 py-4 border-b border-gray-200">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h1 className="text-2xl font-bold text-gray-900">
//                   Vehicle & Container Management
//                 </h1>
//                 <p className="text-sm text-gray-600 mt-1">
//                   Request ID:{" "}
//                   <span className="font-medium">{transportRequestId}</span>
//                 </p>
//               </div>
//               <button
//                 onClick={onBack}
//                 className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//               >
//                 <svg
//                   className="w-4 h-4 mr-2"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M10 19l-7-7m0 0l7-7m-7 7h18"
//                   />
//                 </svg>
//                 Back
//               </button>
//             </div>
//           </div>

//           {/* Tab Navigation */}
//           <div className="border-b border-gray-200">
//             <nav className="-mb-px flex">
//               <button
//                 onClick={() => setActiveTab("vehicles")}
//                 className={`py-2 px-4 border-b-2 font-medium text-sm ${
//                   activeTab === "vehicles"
//                     ? "border-blue-500 text-blue-600"
//                     : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//                 }`}
//               >
//                 Vehicle Details ({vehicleDataList.length})
//               </button>
//               <button
//                 onClick={() => setActiveTab("containers")}
//                 className={`py-2 px-4 border-b-2 font-medium text-sm ${
//                   activeTab === "containers"
//                     ? "border-blue-500 text-blue-600"
//                     : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//                 }`}
//               >
//                 Container Details ({containers.length})
//               </button>
//             </nav>
//           </div>
//         </div>

//         <form onSubmit={handleSubmit}>
//           {/* Vehicle Details Tab */}
//           {activeTab === "vehicles" && (
//             <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
//               <div className="px-6 py-4 border-b border-gray-200">
//                 <h2 className="text-lg font-semibold text-gray-900">
//                   Vehicle & Driver Information
//                   <span className="text-sm font-normal text-gray-500 ml-2">
//                     (All fields marked with * are required)
//                   </span>
//                 </h2>
//               </div>

//               <div className="overflow-x-auto">
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
//                         Vehicle #
//                       </th>
//                       <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">
//                         Vendor Name *
//                       </th>
//                       <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
//                         Vehicle Number *
//                       </th>
//                       <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
//                         Driver Name *
//                       </th>
//                       <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[160px]">
//                         Driver Contact *
//                       </th>
//                       <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[160px]">
//                         License Number *
//                       </th>
//                       <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[160px]">
//                         License Expiry *
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {vehicleDataList.map((vehicle, index) => (
//                       <tr key={`vehicle-${index}`} className="hover:bg-gray-50">
//                         <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
//                           <div className="flex items-center justify-center">
//                             <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
//                               {vehicle.vehicleIndex}
//                             </span>
//                           </div>
//                         </td>
//                         <td className="px-3 py-4 whitespace-nowrap">
//                           <VendorSearchInput
//                             value={getVendorName(vehicle)}
//                             onChange={(value) =>
//                               handleVendorChange(index, value)
//                             }
//                             placeholder="Search and select vendor"
//                           />
//                         </td>
//                         <td className="px-3 py-4 whitespace-nowrap">
//                           <div>
//                             <input
//                               type="text"
//                               className={`w-full min-w-[140px] border ${
//                                 validationErrors[`${index}-vehicleNumber`]
//                                   ? "border-red-500"
//                                   : "border-gray-300"
//                               } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
//                               value={vehicle.vehicleNumber}
//                               onChange={(e) =>
//                                 updateVehicleData(
//                                   index,
//                                   "vehicleNumber",
//                                   e.target.value.toUpperCase()
//                                 )
//                               }
//                               placeholder="e.g., MH01AB1234"
//                               required
//                             />
//                             {validationErrors[`${index}-vehicleNumber`] && (
//                               <p className="text-red-500 text-xs mt-1">
//                                 {validationErrors[`${index}-vehicleNumber`]}
//                               </p>
//                             )}
//                           </div>
//                         </td>
//                         <td className="px-3 py-4 whitespace-nowrap">
//                           <DriverSearchInput
//                             value={vehicle.driverName}
//                             onChange={(value, driverData) =>
//                               handleDriverSelection(index, value, driverData)
//                             }
//                             vendorName={getVendorName(vehicle)}
//                             placeholder="Select driver"
//                           />
//                         </td>
//                         <td className="px-3 py-4 whitespace-nowrap">
//                           <div>
//                             <input
//                               type="tel"
//                               className={`w-full min-w-[160px] border ${
//                                 validationErrors[`${index}-driverContact`]
//                                   ? "border-red-500"
//                                   : "border-gray-300"
//                               } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
//                               value={vehicle.driverContact}
//                               onChange={(e) =>
//                                 updateVehicleData(
//                                   index,
//                                   "driverContact",
//                                   e.target.value.replace(/\D/g, "").slice(0, 10)
//                                 )
//                               }
//                               placeholder="10-digit mobile number"
//                               maxLength="10"
//                               required
//                             />
//                           </div>
//                         </td>
//                         <td className="px-3 py-4 whitespace-nowrap">
//                           <div>
//                             <input
//                               type="text"
//                               className={`w-full min-w-[160px] border ${
//                                 validationErrors[`${index}-licenseNumber`]
//                                   ? "border-red-500"
//                                   : "border-gray-300"
//                               } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
//                               value={vehicle.licenseNumber}
//                               onChange={(e) =>
//                                 updateVehicleData(
//                                   index,
//                                   "licenseNumber",
//                                   e.target.value.toUpperCase()
//                                 )
//                               }
//                               placeholder="License number"
//                               required
//                             />
//                           </div>
//                         </td>
//                         <td className="px-3 py-4 whitespace-nowrap">
//                           <div>
//                             <input
//                               type="date"
//                               className={`w-full min-w-[160px] border ${
//                                 validationErrors[`${index}-licenseExpiry`]
//                                   ? "border-red-500"
//                                   : "border-gray-300"
//                               } rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
//                               value={vehicle.licenseExpiry}
//                               onChange={(e) =>
//                                 updateVehicleData(
//                                   index,
//                                   "licenseExpiry",
//                                   e.target.value
//                                 )
//                               }
//                               min={new Date().toISOString().split("T")[0]}
//                               required
//                             />
//                           </div>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           )}

//           {/* Container Details Tab */}
//           {activeTab === "containers" && (
//             <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
//               <div className="px-6 py-4 border-b border-gray-200">
//                 <div className="flex items-center justify-between">
//                   <h2 className="text-lg font-semibold text-gray-900">
//                     Container Information ({containers.length} Container
//                     {containers.length > 1 ? "s" : ""})
//                   </h2>
//                 </div>
//               </div>

//               <div className="p-6">
//                 <div className="space-y-6">
//                   {Object.entries(groupedContainers).map(
//                     ([vehicleNumber, vehicleContainers]) => (
//                       <div
//                         key={vehicleNumber}
//                         className="border border-gray-200 rounded-lg overflow-hidden"
//                       >
//                         <div
//                           className={`px-4 py-3 flex justify-between items-center cursor-pointer ${
//                             expandedVehicle === vehicleNumber
//                               ? "bg-blue-50"
//                               : "bg-gray-50"
//                           }`}
//                           onClick={() => toggleVehicleExpansion(vehicleNumber)}
//                         >
//                           <div className="flex items-center">
//                             <span className="font-medium text-gray-900">
//                               {vehicleNumber === "unassigned"
//                                 ? "Unassigned Containers"
//                                 : `Vehicle: ${vehicleNumber}`}
//                             </span>
//                             <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
//                               {vehicleContainers.length} container
//                               {vehicleContainers.length !== 1 ? "s" : ""}
//                             </span>
//                           </div>
//                           <div className="flex items-center">
//                             <button
//                               type="button"
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 addContainer(vehicleNumber);
//                               }}
//                               className="mr-2 inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700"
//                               title="Add container to this vehicle"
//                             >
//                               <svg
//                                 className="h-4 w-4"
//                                 fill="none"
//                                 viewBox="0 0 24 24"
//                                 stroke="currentColor"
//                               >
//                                 <path
//                                   strokeLinecap="round"
//                                   strokeLinejoin="round"
//                                   strokeWidth={2}
//                                   d="M12 6v6m0 0v6m0-6h6m-6 0H6"
//                                 />
//                               </svg>
//                             </button>
//                             <svg
//                               className={`h-5 w-5 text-gray-500 transform transition-transform ${
//                                 expandedVehicle === vehicleNumber
//                                   ? "rotate-180"
//                                   : ""
//                               }`}
//                               fill="none"
//                               viewBox="0 0 24 24"
//                               stroke="currentColor"
//                             >
//                               <path
//                                 strokeLinecap="round"
//                                 strokeLinejoin="round"
//                                 strokeWidth={2}
//                                 d="M19 9l-7 7-7-7"
//                               />
//                             </svg>
//                           </div>
//                         </div>

//                         {expandedVehicle === vehicleNumber && (
//                           <div className="p-4 bg-white">
//                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                               {vehicleContainers.map(
//                                 (container, containerIndex) => {
//                                   const key =
//                                     container.id ||
//                                     `container-${container.vehicleIndex}-${vehicleNumber}-${containerIndex}`;
//                                   return (
//                                     <div
//                                       key={key}
//                                       className="border border-gray-200 rounded-lg p-4 bg-gray-50"
//                                     >
//                                       <div className="flex justify-between items-center mb-4">
//                                         <h3 className="text-md font-medium text-gray-900">
//                                           Container #{containerIndex + 1}
//                                         </h3>
//                                         {containers.length > 1 && (
//                                           <button
//                                             type="button"
//                                             onClick={() =>
//                                               removeContainer(
//                                                 containers.findIndex(
//                                                   (c) =>
//                                                     c.vehicleIndex ===
//                                                     container.vehicleIndex
//                                                 )
//                                               )
//                                             }
//                                             className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700"
//                                             title="Remove Container"
//                                           >
//                                             <svg
//                                               className="h-4 w-4"
//                                               fill="none"
//                                               viewBox="0 0 24 24"
//                                               stroke="currentColor"
//                                             >
//                                               <path
//                                                 strokeLinecap="round"
//                                                 strokeLinejoin="round"
//                                                 strokeWidth={2}
//                                                 d="M6 18L18 6M6 6l12 12"
//                                               />
//                                             </svg>
//                                           </button>
//                                         )}
//                                       </div>

//                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                         <div>
//                                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                                             Container Number *
//                                           </label>
//                                           <input
//                                             type="text"
//                                             required
//                                             className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                                             value={container.containerNo}
//                                             onChange={(e) =>
//                                               updateContainerData(
//                                                 containers.findIndex(
//                                                   (c) =>
//                                                     c.vehicleIndex ===
//                                                     container.vehicleIndex
//                                                 ),
//                                                 "containerNo",
//                                                 e.target.value.toUpperCase()
//                                               )
//                                             }
//                                             placeholder="Container Number"
//                                           />
//                                         </div>

//                                         <div>
//                                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                                             Container Type
//                                           </label>
//                                           <input
//                                             type="text"
//                                             className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                                             value={container.containerType}
//                                             onChange={(e) =>
//                                               updateContainerData(
//                                                 containers.findIndex(
//                                                   (c) =>
//                                                     c.vehicleIndex ===
//                                                     container.vehicleIndex
//                                                 ),
//                                                 "containerType",
//                                                 e.target.value
//                                               )
//                                             }
//                                             placeholder="Container Type"
//                                           />
//                                         </div>

//                                         <div>
//                                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                                             Container Size
//                                           </label>
//                                           <input
//                                             type="text"
//                                             className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                                             value={container.containerSize}
//                                             onChange={(e) =>
//                                               updateContainerData(
//                                                 containers.findIndex(
//                                                   (c) =>
//                                                     c.vehicleIndex ===
//                                                     container.vehicleIndex
//                                                 ),
//                                                 "containerSize",
//                                                 e.target.value
//                                               )
//                                             }
//                                             placeholder="Container Size"
//                                           />
//                                         </div>

//                                         <div>
//                                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                                             Shipping Line
//                                           </label>
//                                           <input
//                                             type="text"
//                                             className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                                             value={container.line}
//                                             onChange={(e) =>
//                                               updateContainerData(
//                                                 containers.findIndex(
//                                                   (c) =>
//                                                     c.vehicleIndex ===
//                                                     container.vehicleIndex
//                                                 ),
//                                                 "line",
//                                                 e.target.value
//                                               )
//                                             }
//                                             placeholder="Shipping Line"
//                                           />
//                                         </div>

//                                         <div>
//                                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                                             Seal 1
//                                           </label>
//                                           <input
//                                             type="text"
//                                             className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                                             value={container.seal1}
//                                             onChange={(e) =>
//                                               updateContainerData(
//                                                 containers.findIndex(
//                                                   (c) =>
//                                                     c.vehicleIndex ===
//                                                     container.vehicleIndex
//                                                 ),
//                                                 "seal1",
//                                                 e.target.value.toUpperCase()
//                                               )
//                                             }
//                                             placeholder="Seal 1"
//                                           />
//                                         </div>

//                                         <div>
//                                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                                             Seal 2
//                                           </label>
//                                           <input
//                                             type="text"
//                                             className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                                             value={container.seal2}
//                                             onChange={(e) =>
//                                               updateContainerData(
//                                                 containers.findIndex(
//                                                   (c) =>
//                                                     c.vehicleIndex ===
//                                                     container.vehicleIndex
//                                                 ),
//                                                 "seal2",
//                                                 e.target.value.toUpperCase()
//                                               )
//                                             }
//                                             placeholder="Seal 2"
//                                           />
//                                         </div>

//                                         <div>
//                                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                                             Tare Weight (kg)
//                                           </label>
//                                           <input
//                                             type="number"
//                                             min="0"
//                                             step="0.01"
//                                             className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                                             value={
//                                               container.containerTotalWeight
//                                             }
//                                             onChange={(e) =>
//                                               updateContainerData(
//                                                 containers.findIndex(
//                                                   (c) =>
//                                                     c.vehicleIndex ===
//                                                     container.vehicleIndex
//                                                 ),
//                                                 "containerTotalWeight",
//                                                 e.target.value
//                                               )
//                                             }
//                                             placeholder="Container Weight"
//                                           />
//                                         </div>

//                                         <div>
//                                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                                             Cargo Weight (kg)
//                                           </label>
//                                           <input
//                                             type="number"
//                                             min="0"
//                                             step="0.01"
//                                             className="w-full h-10 text-sm border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                                             value={container.cargoTotalWeight}
//                                             onChange={(e) =>
//                                               updateContainerData(
//                                                 containers.findIndex(
//                                                   (c) =>
//                                                     c.vehicleIndex ===
//                                                     container.vehicleIndex
//                                                 ),
//                                                 "cargoTotalWeight",
//                                                 e.target.value
//                                               )
//                                             }
//                                             placeholder="Cargo Weight"
//                                           />
//                                         </div>

//                                         <div className="md:col-span-2">
//                                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                                             Remarks
//                                           </label>
//                                           <textarea
//                                             className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                                             rows="2"
//                                             value={container.remarks}
//                                             onChange={(e) =>
//                                               updateContainerData(
//                                                 containers.findIndex(
//                                                   (c) =>
//                                                     c.vehicleIndex ===
//                                                     container.vehicleIndex
//                                                 ),
//                                                 "remarks",
//                                                 e.target.value
//                                               )
//                                             }
//                                             placeholder="Additional remarks or notes"
//                                           />
//                                         </div>
//                                       </div>
//                                     </div>
//                                   );
//                                 }
//                               )}
//                             </div>
//                           </div>
//                         )}
//                       </div>
//                     )
//                   )}
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Submit Buttons */}
//           <div className="flex justify-end space-x-4 pt-6">
//             <button
//               type="button"
//               onClick={onBack}
//               className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={isSubmitting}
//               className={`
//                 px-8 py-3 rounded-md text-white font-medium transition-all duration-200
//                 ${
//                   isSubmitting
//                     ? "bg-gray-400 cursor-not-allowed"
//                     : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//                 }
//                 flex items-center
//               `}
//             >
//               {isSubmitting ? (
//                 <>
//                   <svg
//                     className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
//                     xmlns="http://www.w3.org/2000/svg"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                   >
//                     <circle
//                       className="opacity-25"
//                       cx="12"
//                       cy="12"
//                       r="10"
//                       stroke="currentColor"
//                       strokeWidth="4"
//                     />
//                     <path
//                       className="opacity-75"
//                       fill="currentColor"
//                       d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                     />
//                   </svg>
//                   Updating Details...
//                 </>
//               ) : (
//                 <>
//                   <svg
//                     className="w-5 h-5 mr-2"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M5 13l4 4L19 7"
//                     />
//                   </svg>
//                   Update All Details
//                 </>
//               )}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default IntegratedVehicleContainerPage;
