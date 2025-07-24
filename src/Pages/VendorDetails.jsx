import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { vendorAPI } from "../utils/Api";

const VendorDetails = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    terminal_id: "",
    vendor_code: "",
    vendor_name: "",
    address: "",
    city: "",
    pin_code: "",
    state_code: "",
    country: "India",
    email_id1: "",
    email_id2: "",
    contact_no: "",
    mobile_no: "",
    fax: "",
    payment_terms: "",
    pan: "",
    tan: "",
    service_tax_reg: "",
    bank_name: "",
    ac_map_code: "",
    account_no: "",
    ifsc: "",
    bank_branch: "",
    gstin: ""
  });

  // Fetch all vendors
  const fetchVendors = async () => {
    setLoading(true);
    try {
      const response = await vendorAPI.getAllVendors();
      if (response.success) {
        setVendors(response.data);
      } else {
        toast.error("Failed to fetch vendors");
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
      toast.error(error.message || "Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  };

  // Fetch vendors on component mount
  useEffect(() => {
    fetchVendors();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle vendor selection
  const handleSelectVendor = (vendor) => {
    setSelectedVendor(vendor);
    setFormData({
      terminal_id: vendor.TERMINAL_ID || "",
      vendor_code: vendor.VENDOR_CODE || "",
      vendor_name: vendor.VENDOR_NAME || "",
      address: vendor.ADDRESS || "",
      city: vendor.CITY || "",
      pin_code: vendor.PIN_CODE || "",
      state_code: vendor.STATE_CODE || "",
      country: vendor.COUNTRY || "India",
      email_id1: vendor.EMAIL_ID1 || "",
      email_id2: vendor.EMAIL_ID2 || "",
      contact_no: vendor.CONTACT_NO || "",
      mobile_no: vendor.MOBILE_NO || "",
      fax: vendor.FAX || "",
      payment_terms: vendor.PAYMENT_TERMS || "",
      pan: vendor.PAN || "",
      tan: vendor.TAN || "",
      service_tax_reg: vendor.SERVICE_TAX_REG || "",
      bank_name: vendor.BANK_NAME || "",
      ac_map_code: vendor.AC_MAP_CODE || "",
      account_no: vendor.ACCOUNT_NO || "",
      ifsc: vendor.IFSC || "",
      bank_branch: vendor.BANK_BRANCH || "",
      gstin: vendor.GSTIN || ""
    });
    setIsEditing(false);
  };

  // Handle form submission for creating/updating vendor
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isEditing && selectedVendor) {
        // Update existing vendor
        const response = await vendorAPI.updateVendor(selectedVendor.VENDOR_ID, formData);
        if (response.success) {
          toast.success("Vendor updated successfully");
          fetchVendors();
          setIsEditing(false);
        } else {
          toast.error("Failed to update vendor");
        }
      } else {
        // Create new vendor
        const response = await vendorAPI.createVendor(formData);
        if (response.success) {
          toast.success("Vendor created successfully");
          fetchVendors();
          resetForm();
        } else {
          toast.error("Failed to create vendor");
        }
      }
    } catch (error) {
      console.error("Error saving vendor:", error);
      toast.error(error.message || "Failed to save vendor");
    }
  };

  // Handle delete vendor
  const handleDeleteVendor = async () => {
    if (!selectedVendor) return;

    if (window.confirm("Are you sure you want to delete this vendor?")) {
      try {
        const response = await vendorAPI.deleteVendor(selectedVendor.VENDOR_ID);
        if (response.success) {
          toast.success("Vendor deleted successfully");
          fetchVendors();
          resetForm();
        } else {
          toast.error("Failed to delete vendor");
        }
      } catch (error) {
        console.error("Error deleting vendor:", error);
        toast.error(error.message || "Failed to delete vendor");
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedVendor(null);
    setIsEditing(false);
    setFormData({
      terminal_id: "",
      vendor_code: "",
      vendor_name: "",
      address: "",
      city: "",
      pin_code: "",
      state_code: "",
      country: "India",
      email_id1: "",
      email_id2: "",
      contact_no: "",
      mobile_no: "",
      fax: "",
      payment_terms: "",
      pan: "",
      tan: "",
      service_tax_reg: "",
      bank_name: "",
      ac_map_code: "",
      account_no: "",
      ifsc: "",
      bank_branch: "",
      gstin: ""
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Vendor Management</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vendor List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Vendor List</h2>
          </div>
          
          <div className="divide-y divide-gray-200 max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="p-4 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : vendors.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No vendors found</div>
            ) : (
              vendors.map((vendor) => (
                <div 
                  key={vendor.VENDOR_ID} 
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedVendor?.VENDOR_ID === vendor.VENDOR_ID ? 'bg-blue-50' : ''}`}
                  onClick={() => handleSelectVendor(vendor)}
                >
                  <div className="font-medium text-gray-900">{vendor.VENDOR_NAME}</div>
                  <div className="text-sm text-gray-500">{vendor.VENDOR_CODE}</div>
                  <div className="text-sm text-gray-500">{vendor.CITY}, {vendor.STATE_CODE}</div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <button 
              onClick={() => { resetForm(); setIsEditing(true); }}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add New Vendor
            </button>
          </div>
        </div>
        
        {/* Vendor Form */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              {isEditing ? (selectedVendor ? 'Edit Vendor' : 'Add New Vendor') : 'Vendor Details'}
            </h2>
            {selectedVendor && !isEditing && (
              <div className="flex space-x-2">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="py-1 px-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
                >
                  Edit
                </button>
                <button 
                  onClick={handleDeleteVendor}
                  className="py-1 px-3 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
          
          <div className="p-6">
            {!selectedVendor && !isEditing ? (
              <div className="text-center text-gray-500 py-12">
                <p>Select a vendor from the list or add a new one</p>
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
                      <label className="block text-sm font-medium text-gray-700">Vendor Code</label>
                      <input
                        type="text"
                        name="vendor_code"
                        value={formData.vendor_code}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vendor Name*</label>
                      <input
                        type="text"
                        name="vendor_name"
                        value={formData.vendor_name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        required
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
                        <label className="block text-sm font-medium text-gray-700">City</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">PIN Code</label>
                        <input
                          type="text"
                          name="pin_code"
                          value={formData.pin_code}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">State</label>
                        <input
                          type="text"
                          name="state_code"
                          value={formData.state_code}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Country</label>
                        <input
                          type="text"
                          name="country"
                          value={formData.country}
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
                      <label className="block text-sm font-medium text-gray-700">Email ID 1</label>
                      <input
                        type="email"
                        name="email_id1"
                        value={formData.email_id1}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email ID 2</label>
                      <input
                        type="email"
                        name="email_id2"
                        value={formData.email_id2}
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
                      <label className="block text-sm font-medium text-gray-700">Fax</label>
                      <input
                        type="text"
                        name="fax"
                        value={formData.fax}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Tax & Banking Information */}
                <div className="pt-4">
                  <h3 className="text-md font-medium text-gray-900 border-b pb-2 mb-4">Tax & Banking Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">PAN</label>
                      <input
                        type="text"
                        name="pan"
                        value={formData.pan}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">TAN</label>
                      <input
                        type="text"
                        name="tan"
                        value={formData.tan}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">GSTIN</label>
                      <input
                        type="text"
                        name="gstin"
                        value={formData.gstin}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Service Tax Reg</label>
                      <input
                        type="text"
                        name="service_tax_reg"
                        value={formData.service_tax_reg}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Payment Terms</label>
                      <input
                        type="text"
                        name="payment_terms"
                        value={formData.payment_terms}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">AC Map Code</label>
                      <input
                        type="text"
                        name="ac_map_code"
                        value={formData.ac_map_code}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                      <input
                        type="text"
                        name="bank_name"
                        value={formData.bank_name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bank Branch</label>
                      <input
                        type="text"
                        name="bank_branch"
                        value={formData.bank_branch}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Account Number</label>
                      <input
                        type="text"
                        name="account_no"
                        value={formData.account_no}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">IFSC Code</label>
                      <input
                        type="text"
                        name="ifsc"
                        value={formData.ifsc}
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
                      {selectedVendor ? 'Update Vendor' : 'Create Vendor'}
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

export default VendorDetails;