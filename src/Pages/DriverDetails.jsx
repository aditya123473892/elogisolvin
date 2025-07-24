import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { driverAPI } from "../utils/Api";

const DriverDetails = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    terminal_id: "",
    driver_name: "",
    address: "",
    vehicle_id: "",
    vehicle_no: "",
    contact_no: "",
    mobile_no: "",
    email_id: "",
    blood_group: "",
    joining_date: "",
    dl_no: "",
    dl_renewable_date: "",
    salary: "",
    active_flage: "Y",
    image: "",
    bal_amt: "",
    trip_bal: "",
    close_status: "",
    jo_close_status: "",
    gaurantor: "",
    driver_code: "",
    father_name: "",
    attach_status: "",
    dl_doc: "",
    address_doc: "",
    emerg_phone: "",
    phone_no: ""
  });

  // Fetch all drivers
  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const response = await driverAPI.getAllDrivers();
      if (response.success) {
        setDrivers(response.data);
      } else {
        toast.error("Failed to fetch drivers");
      }
    } catch (error) {
      console.error("Error fetching drivers:", error);
      toast.error(error.message || "Failed to fetch drivers");
    } finally {
      setLoading(false);
    }
  };

  // Fetch drivers on component mount
  useEffect(() => {
    fetchDrivers();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle driver selection
  const handleSelectDriver = (driver) => {
    setSelectedDriver(driver);
    setFormData({
      terminal_id: driver.TERMINAL_ID || "",
      driver_name: driver.DRIVER_NAME || "",
      address: driver.ADDRESS || "",
      vehicle_id: driver.VEHICLE_ID || "",
      vehicle_no: driver.VEHICLE_NO || "",
      contact_no: driver.CONTACT_NO || "",
      mobile_no: driver.MOBILE_NO || "",
      email_id: driver.EMAIL_ID || "",
      blood_group: driver.BLOOD_GROUP || "",
      joining_date: driver.JOINING_DATE ? new Date(driver.JOINING_DATE).toISOString().split('T')[0] : "",
      dl_no: driver.DL_NO || "",
      dl_renewable_date: driver.DL_RENEWABLE_DATE ? new Date(driver.DL_RENEWABLE_DATE).toISOString().split('T')[0] : "",
      salary: driver.SALARY || "",
      active_flage: driver.ACTIVE_FLAGE || "Y",
      image: driver.IMAGE || "",
      bal_amt: driver.BAL_AMT || "",
      trip_bal: driver.TRIP_BAL || "",
      close_status: driver.CLOSE_STATUS || "",
      jo_close_status: driver.JO_CLOSE_STATUS || "",
      gaurantor: driver.GAURANTOR || "",
      driver_code: driver.DRIVER_CODE || "",
      father_name: driver.FATHER_NAME || "",
      attach_status: driver.ATTACH_STATUS || "",
      dl_doc: driver.DL_DOC || "",
      address_doc: driver.ADDRESS_DOC || "",
      emerg_phone: driver.EMERG_PHONE || "",
      phone_no: driver.PHONE_NO || ""
    });
    setIsEditing(false);
  };

  // Handle form submission for creating/updating driver
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isEditing && selectedDriver) {
        // Update existing driver
        const response = await driverAPI.updateDriver(selectedDriver.DRIVER_ID, formData);
        if (response.success) {
          toast.success("Driver updated successfully");
          fetchDrivers();
          setIsEditing(false);
        } else {
          toast.error("Failed to update driver");
        }
      } else {
        // Create new driver
        const response = await driverAPI.createDriver(formData);
        if (response.success) {
          toast.success("Driver created successfully");
          fetchDrivers();
          resetForm();
        } else {
          toast.error("Failed to create driver");
        }
      }
    } catch (error) {
      console.error("Error saving driver:", error);
      toast.error(error.message || "Failed to save driver");
    }
  };

  // Handle delete driver
  const handleDeleteDriver = async () => {
    if (!selectedDriver) return;

    if (window.confirm("Are you sure you want to delete this driver?")) {
      try {
        const response = await driverAPI.deleteDriver(selectedDriver.DRIVER_ID);
        if (response.success) {
          toast.success("Driver deleted successfully");
          fetchDrivers();
          resetForm();
        } else {
          toast.error("Failed to delete driver");
        }
      } catch (error) {
        console.error("Error deleting driver:", error);
        toast.error(error.message || "Failed to delete driver");
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedDriver(null);
    setIsEditing(false);
    setFormData({
      terminal_id: "",
      driver_name: "",
      address: "",
      vehicle_id: "",
      vehicle_no: "",
      contact_no: "",
      mobile_no: "",
      email_id: "",
      blood_group: "",
      joining_date: "",
      dl_no: "",
      dl_renewable_date: "",
      salary: "",
      active_flage: "Y",
      image: "",
      bal_amt: "",
      trip_bal: "",
      close_status: "",
      jo_close_status: "",
      gaurantor: "",
      driver_code: "",
      father_name: "",
      attach_status: "",
      dl_doc: "",
      address_doc: "",
      emerg_phone: "",
      phone_no: ""
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Driver Management</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Driver List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Driver List</h2>
          </div>
          
          <div className="divide-y divide-gray-200 max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="p-4 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : drivers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No drivers found</div>
            ) : (
              drivers.map((driver) => (
                <div 
                  key={driver.DRIVER_ID} 
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedDriver?.DRIVER_ID === driver.DRIVER_ID ? 'bg-blue-50' : ''}`}
                  onClick={() => handleSelectDriver(driver)}
                >
                  <div className="font-medium text-gray-900">{driver.DRIVER_NAME}</div>
                  <div className="text-sm text-gray-500">{driver.DRIVER_CODE}</div>
                  <div className="text-sm text-gray-500">{driver.VEHICLE_NO}</div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <button 
              onClick={() => { resetForm(); setIsEditing(true); }}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add New Driver
            </button>
          </div>
        </div>
        
        {/* Driver Form */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              {isEditing ? (selectedDriver ? 'Edit Driver' : 'Add New Driver') : 'Driver Details'}
            </h2>
            {selectedDriver && !isEditing && (
              <div className="flex space-x-2">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="py-1 px-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
                >
                  Edit
                </button>
                <button 
                  onClick={handleDeleteDriver}
                  className="py-1 px-3 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
          
          <div className="p-6">
            {!selectedDriver && !isEditing ? (
              <div className="text-center text-gray-500 py-12">
                <p>Select a driver from the list or add a new one</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-md font-medium text-gray-900 border-b pb-2">Basic Information</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Terminal ID</label>
                      <input
                        type="number"
                        name="terminal_id"
                        value={formData.terminal_id}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Driver Code</label>
                      <input
                        type="text"
                        name="driver_code"
                        value={formData.driver_code}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Driver Name*</label>
                      <input
                        type="text"
                        name="driver_name"
                        value={formData.driver_name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Father's Name</label>
                      <input
                        type="text"
                        name="father_name"
                        value={formData.father_name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Blood Group</label>
                        <input
                          type="text"
                          name="blood_group"
                          value={formData.blood_group}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Joining Date</label>
                        <input
                          type="date"
                          name="joining_date"
                          value={formData.joining_date}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-md font-medium text-gray-900 border-b pb-2">Contact Information</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email ID</label>
                      <input
                        type="email"
                        name="email_id"
                        value={formData.email_id}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                      <input
                        type="text"
                        name="contact_no"
                        value={formData.contact_no}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                      <input
                        type="text"
                        name="mobile_no"
                        value={formData.mobile_no}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                      <input
                        type="text"
                        name="phone_no"
                        value={formData.phone_no}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Emergency Phone</label>
                      <input
                        type="text"
                        name="emerg_phone"
                        value={formData.emerg_phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Vehicle & License Information */}
                <div className="pt-4">
                  <h3 className="text-md font-medium text-gray-900 border-b pb-2 mb-4">Vehicle & License Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vehicle ID</label>
                      <input
                        type="number"
                        name="vehicle_id"
                        value={formData.vehicle_id}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vehicle Number</label>
                      <input
                        type="text"
                        name="vehicle_no"
                        value={formData.vehicle_no}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">DL Number</label>
                      <input
                        type="text"
                        name="dl_no"
                        value={formData.dl_no}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">DL Renewal Date</label>
                      <input
                        type="date"
                        name="dl_renewable_date"
                        value={formData.dl_renewable_date}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">DL Document</label>
                      <input
                        type="text"
                        name="dl_doc"
                        value={formData.dl_doc}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Address Document</label>
                      <input
                        type="text"
                        name="address_doc"
                        value={formData.address_doc}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Financial Information */}
                <div className="pt-4">
                  <h3 className="text-md font-medium text-gray-900 border-b pb-2 mb-4">Financial Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Salary</label>
                      <input
                        type="number"
                        name="salary"
                        value={formData.salary}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Balance Amount</label>
                      <input
                        type="text"
                        name="bal_amt"
                        value={formData.bal_amt}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Trip Balance</label>
                      <input
                        type="number"
                        name="trip_bal"
                        value={formData.trip_bal}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Guarantor</label>
                      <input
                        type="text"
                        name="gaurantor"
                        value={formData.gaurantor}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Active Flag</label>
                      <select
                        name="active_flage"
                        value={formData.active_flage}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      >
                        <option value="Y">Yes</option>
                        <option value="N">No</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Attachment Status</label>
                      <input
                        type="text"
                        name="attach_status"
                        value={formData.attach_status}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>
                
                {isEditing && (
                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      {selectedDriver ? 'Update Driver' : 'Create Driver'}
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDetails;