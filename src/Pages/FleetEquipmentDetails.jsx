import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { fleetEquipmentAPI } from "../utils/Api";

const FleetEquipmentDetails = () => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    equipment_name: "",
    equipment_type: "",
    equipment_model: "",
    equipment_make: "",
    equipment_year: "",
    equipment_capacity: "",
    equipment_status: "Active",
    equipment_location: "",
    equipment_purchase_date: "",
    equipment_purchase_price: "",
    equipment_current_value: "",
    equipment_maintenance_schedule: "",
    equipment_last_maintenance_date: "",
    equipment_next_maintenance_date: "",
    equipment_notes: ""
  });

  // Fetch all fleet equipment
  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const response = await fleetEquipmentAPI.getAllFleetEquipment();
      if (response.success) {
        setEquipment(response.data);
      } else {
        toast.error("Failed to fetch fleet equipment");
      }
    } catch (error) {
      console.error("Error fetching fleet equipment:", error);
      toast.error("Error fetching fleet equipment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSelectEquipment = (equipment) => {
    setSelectedEquipment(equipment);
    setFormData({
      equipment_name: equipment.EQUIPMENT_NAME || "",
      equipment_type: equipment.EQUIPMENT_TYPE || "",
      equipment_model: equipment.EQUIPMENT_MODEL || "",
      equipment_make: equipment.EQUIPMENT_MAKE || "",
      equipment_year: equipment.EQUIPMENT_YEAR || "",
      equipment_capacity: equipment.EQUIPMENT_CAPACITY || "",
      equipment_status: equipment.EQUIPMENT_STATUS || "Active",
      equipment_location: equipment.EQUIPMENT_LOCATION || "",
      equipment_purchase_date: equipment.EQUIPMENT_PURCHASE_DATE ? new Date(equipment.EQUIPMENT_PURCHASE_DATE).toISOString().split('T')[0] : "",
      equipment_purchase_price: equipment.EQUIPMENT_PURCHASE_PRICE || "",
      equipment_current_value: equipment.EQUIPMENT_CURRENT_VALUE || "",
      equipment_maintenance_schedule: equipment.EQUIPMENT_MAINTENANCE_SCHEDULE || "",
      equipment_last_maintenance_date: equipment.EQUIPMENT_LAST_MAINTENANCE_DATE ? new Date(equipment.EQUIPMENT_LAST_MAINTENANCE_DATE).toISOString().split('T')[0] : "",
      equipment_next_maintenance_date: equipment.EQUIPMENT_NEXT_MAINTENANCE_DATE ? new Date(equipment.EQUIPMENT_NEXT_MAINTENANCE_DATE).toISOString().split('T')[0] : "",
      equipment_notes: equipment.EQUIPMENT_NOTES || ""
    });
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isEditing && selectedEquipment) {
        // Update existing equipment
        const response = await fleetEquipmentAPI.updateFleetEquipment(selectedEquipment.EQUIPMENT_ID, formData);
        if (response.success) {
          toast.success("Equipment updated successfully");
          fetchEquipment();
          setIsEditing(false);
        } else {
          toast.error(response.error || "Failed to update equipment");
        }
      } else {
        // Create new equipment
        const response = await fleetEquipmentAPI.createFleetEquipment(formData);
        if (response.success) {
          toast.success("Equipment created successfully");
          fetchEquipment();
          resetForm();
        } else {
          toast.error(response.error || "Failed to create equipment");
        }
      }
    } catch (error) {
      console.error("Error submitting equipment data:", error);
      toast.error("Error submitting equipment data");
    }
  };

  const handleDeleteEquipment = async () => {
    if (!selectedEquipment) return;

    if (window.confirm("Are you sure you want to delete this equipment?")) {
      try {
        const response = await fleetEquipmentAPI.deleteFleetEquipment(selectedEquipment.EQUIPMENT_ID);
        if (response.success) {
          toast.success("Equipment deleted successfully");
          fetchEquipment();
          resetForm();
        } else {
          toast.error(response.error || "Failed to delete equipment");
        }
      } catch (error) {
        console.error("Error deleting equipment:", error);
        toast.error("Error deleting equipment");
      }
    }
  };

  const resetForm = () => {
    setSelectedEquipment(null);
    setIsEditing(false);
    setFormData({
      equipment_name: "",
      equipment_type: "",
      equipment_model: "",
      equipment_make: "",
      equipment_year: "",
      equipment_capacity: "",
      equipment_status: "Active",
      equipment_location: "",
      equipment_purchase_date: "",
      equipment_purchase_price: "",
      equipment_current_value: "",
      equipment_maintenance_schedule: "",
      equipment_last_maintenance_date: "",
      equipment_next_maintenance_date: "",
      equipment_notes: ""
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Fleet Equipment Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Equipment List */}
        <div className="md:col-span-1 bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Equipment List</h2>
            <button
              onClick={() => {
                resetForm();
                setIsEditing(true);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
            >
              Add New
            </button>
          </div>
          
          {loading ? (
            <p>Loading equipment...</p>
          ) : equipment.length === 0 ? (
            <p>No equipment found. Add your first equipment.</p>
          ) : (
            <div className="max-h-[600px] overflow-y-auto">
              <ul className="divide-y divide-gray-200">
                {equipment.map((item) => (
                  <li
                    key={item.EQUIPMENT_ID}
                    className={`py-3 px-2 cursor-pointer hover:bg-gray-50 ${selectedEquipment?.EQUIPMENT_ID === item.EQUIPMENT_ID ? 'bg-blue-50' : ''}`}
                    onClick={() => handleSelectEquipment(item)}
                  >
                    <div className="font-medium">{item.EQUIPMENT_NAME}</div>
                    <div className="text-sm text-gray-500">{item.EQUIPMENT_TYPE} - {item.EQUIPMENT_MODEL}</div>
                    <div className="text-xs mt-1">
                      <span className={`px-2 py-1 rounded-full ${item.EQUIPMENT_STATUS === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.EQUIPMENT_STATUS}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* Equipment Details Form */}
        <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            {isEditing ? (selectedEquipment ? "Edit" : "Add New") : "Equipment Details"}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Basic Information */}
              <div className="col-span-2">
                <h3 className="text-lg font-medium mb-2">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Name*</label>
                    <input
                      type="text"
                      name="equipment_name"
                      value={formData.equipment_name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Type</label>
                    <input
                      type="text"
                      name="equipment_type"
                      value={formData.equipment_type}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <input
                      type="text"
                      name="equipment_model"
                      value={formData.equipment_model}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                    <input
                      type="text"
                      name="equipment_make"
                      value={formData.equipment_make}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <input
                      type="number"
                      name="equipment_year"
                      value={formData.equipment_year}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                    <input
                      type="text"
                      name="equipment_capacity"
                      value={formData.equipment_capacity}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>
              
              {/* Status and Location */}
              <div className="col-span-2">
                <h3 className="text-lg font-medium mb-2">Status & Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      name="equipment_status"
                      value={formData.equipment_status}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Retired">Retired</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      name="equipment_location"
                      value={formData.equipment_location}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>
              
              {/* Financial Information */}
              <div className="col-span-2">
                <h3 className="text-lg font-medium mb-2">Financial Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                    <input
                      type="date"
                      name="equipment_purchase_date"
                      value={formData.equipment_purchase_date}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
                    <input
                      type="number"
                      name="equipment_purchase_price"
                      value={formData.equipment_purchase_price}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Value</label>
                    <input
                      type="number"
                      name="equipment_current_value"
                      value={formData.equipment_current_value}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>
              
              {/* Maintenance Information */}
              <div className="col-span-2">
                <h3 className="text-lg font-medium mb-2">Maintenance Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Schedule</label>
                    <input
                      type="text"
                      name="equipment_maintenance_schedule"
                      value={formData.equipment_maintenance_schedule}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Maintenance Date</label>
                    <input
                      type="date"
                      name="equipment_last_maintenance_date"
                      value={formData.equipment_last_maintenance_date}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Next Maintenance Date</label>
                    <input
                      type="date"
                      name="equipment_next_maintenance_date"
                      value={formData.equipment_next_maintenance_date}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>
              
              {/* Notes */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="equipment_notes"
                  value={formData.equipment_notes}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                ></textarea>
              </div>
            </div>
            
            {/* Action Buttons */}
            {isEditing ? (
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {selectedEquipment ? "Update Equipment" : "Create Equipment"}
                </button>
              </div>
            ) : selectedEquipment ? (
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleDeleteEquipment}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Edit
                </button>
              </div>
            ) : null}
          </form>
        </div>
      </div>
    </div>
  );
};

export default FleetEquipmentDetails;