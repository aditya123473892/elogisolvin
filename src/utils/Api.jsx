import axios from "axios";

// Use environment variable with fallback to localhost
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:4000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Variable to track if we're already handling an auth error to prevent infinite loops
let isHandlingAuthError = false;

// Add interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    isHandlingAuthError = false;
    return response;
  },
  (error) => {
    // Just log the error without any redirection or clearing auth data
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log("Auth error occurred, but not redirecting or clearing data");
    }

    // Simply return the error without any redirection
    return Promise.reject(error);
  }
);

// Utility function to check if token is expired
export const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    // Decode JWT token to check expiration
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;

    // Add 30 second buffer to account for network delays
    return payload.exp < currentTime + 30;
  } catch (error) {
    console.error("Error checking token expiration:", error);
    return true; // Treat invalid tokens as expired
  }
};

// Function to validate token format
export const isValidTokenFormat = (token) => {
  if (!token) return false;

  // JWT tokens have 3 parts separated by dots
  const parts = token.split(".");
  return parts.length === 3;
};

// Function to clear authentication data
export const clearAuthData = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  delete api.defaults.headers.common["Authorization"];
};

export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await api.post("/auth/login", credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  signup: async (userData) => {
    try {
      const response = await api.post("/auth/signup", userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Add token validation endpoint
  validateToken: async () => {
    try {
      const response = await api.get("/auth/validate");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Add refresh token endpoint (if your backend supports it)
  refreshToken: async (refreshToken) => {
    try {
      const response = await api.post("/auth/refresh", { refreshToken });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  logout: () => {
    clearAuthData();
  },

  // Check if current session is valid
  checkSession: async () => {
    const token = localStorage.getItem("token");

    // Check if token exists and has valid format
    if (!token || !isValidTokenFormat(token)) {
      console.log(
        "Token missing or invalid format, but not clearing auth data"
      );
      return false;
    }

    // Check if token is expired
    if (isTokenExpired(token)) {
      console.log("Token expired, but not clearing auth data");
      return false;
    }

    try {
      // Validate with server
      await authAPI.validateToken();
      return true;
    } catch (error) {
      console.error("Session validation failed:", error);
      // Don't clear auth data on validation failure
      return false;
    }
  },
};

// User Management API
export const userAPI = {
  // Get all users (admin only)
  getAllUsers: async () => {
    try {
      const response = await api.get("/users/allusers");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update user details
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update user role (admin only)
  updateUserRole: async (userId, roleData) => {
    try {
      const response = await api.put(`/users/${userId}/role`, roleData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete user (admin only)
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new user (admin only)
  createUser: async (userData) => {
    try {
      const response = await api.post("/users/create", userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export const transporterAPI = {
  getContainersByRequestId: async (requestId) => {
    try {
      const response = await api.get(
        `/transport-requests/${requestId}/containers`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getTransporterByRequestId: async (requestId) => {
    try {
      const response = await api.get(
        `/transport-requests/${requestId}/transporter`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  createMultipleVehicles: async (requestId, vehicles) => {
    try {
      const response = await api.post(
        `/transport-requests/${requestId}/vehicles/batch`,
        { vehicles }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  updateMultipleVehicleContainers: async (requestId, vehicleContainers) => {
    try {
      const response = await api.post(
        `/transport-requests/${requestId}/vehicles/containers/batch`,
        { vehicleContainers }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getContainersByVehicleNumber: async (requestId, vehicleNumber) => {
    try {
      const response = await api.get(
        `/transport-requests/${requestId}/vehicle/${vehicleNumber}/containers`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  deleteContainer: async (containerId) => {
    try {
      const response = await api.delete(
        `/transporter/container/${containerId}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  deleteTransporter: async (id) => {
    try {
      const response = await api.delete(`/transporter/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  updateVehicle: async (id, vehicleData) => {
    try {
      const response = await api.put(`/transporter/${id}`, vehicleData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export const transportRequestAPI = {
  // Create transport request
  createRequest: async (requestData) => {
    try {
      const response = await api.post("/transport/create", requestData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update transport request
  updateRequest: async (requestId, requestData) => {
    try {
      const response = await api.put(
        `/transport/update/${requestId}`,
        requestData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get customer requests
  getCustomerRequests: async () => {
    try {
      const response = await api.get("/transport/customer-requests");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all requests (admin)
  getAllRequests: async () => {
    try {
      const response = await api.get("/transport/all-requests");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update request status (admin)
  updateRequestStatus: async (requestId, status, adminComment) => {
    try {
      const response = await api.put(`/transport/status/${requestId}`, {
        status,
        adminComment,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export const setAuthToken = (token) => {
  if (token) {
    try {
      // Store token in localStorage
      localStorage.setItem("token", token);

      // Set token in axios headers
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      console.log("Auth token set in headers:", token);
      console.log(
        "Verification - localStorage token:",
        localStorage.getItem("token")
      );
      console.log(
        "Verification - axios headers:",
        api.defaults.headers.common["Authorization"]
      );

      return true;
    } catch (error) {
      console.error("Error setting auth token:", error);
      return false;
    }
  } else {
    try {
      localStorage.removeItem("token");
      delete api.defaults.headers.common["Authorization"];
      console.log("Auth token removed from headers");
      return true;
    } catch (error) {
      console.error("Error removing auth token:", error);
      return false;
    }
  }
};

export { api };

export default api;

export const locationAPI = {
  // Get all locations
  getAllLocations: async () => {
    try {
      const response = await api.get("/locations");
      return response.data;
      console.log("Locations fetched successfully:", response.data);
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};
export const transporterListAPI = {
  getAllTransporters: async () => {
    try {
      const response = await api.get("/transporterlist/getall");
      return response.data;
    } catch (error) {
      console.error("Error fetching transporters:", error);
      return [];
    }
  },
};

export const servicesAPI = {
  getAllServices: async () => {
    try {
      const response = await api.get("/services/getallservices");
      return response.data;
    } catch (error) {
      console.error("Error fetching services:", error);
      throw error;
    }
  },

  // Add new method for creating service
  createService: async (serviceData) => {
    try {
      const response = await api.post("/services/services", serviceData);
      return response.data;
    } catch (error) {
      console.error("Error creating service:", error);
      throw error;
    }
  },
};

// Assuming you have a base API instance configured
// import api from './baseApi'; // Your configured axios instance

export const vendorAPI = {
  // Get all vendors
  getAllVendors: async () => {
    try {
      const response = await api.get("/vendors");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get vendor by ID
  getVendorById: async (vendorId) => {
    try {
      const response = await api.get(`/vendors/${vendorId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get vendor document
  getVendorDocument: async (vendorId, documentNumber) => {
    try {
      const response = await api.get(
        `/vendors/${vendorId}/document/${documentNumber}`,
        {
          responseType: "blob",
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new vendor with documents
  createVendor: async (formData) => {
    try {
      const response = await api.post("/vendors", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update vendor with documents
  updateVendor: async (vendorId, formData) => {
    try {
      const response = await api.put(`/vendors/${vendorId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete vendor
  deleteVendor: async (vendorId) => {
    try {
      const response = await api.delete(`/vendors/${vendorId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// 2. Update these functions in your VendorDetails component:

const createVendorWithDocuments = async (formData, documentFiles) => {
  const data = new FormData();

  // Append all form data
  Object.keys(formData).forEach((key) => {
    if (
      formData[key] !== null &&
      formData[key] !== undefined &&
      formData[key] !== ""
    ) {
      data.append(key, formData[key]);
    }
  });

  // Append document files
  if (documentFiles?.length > 0) {
    documentFiles.forEach((file) => {
      data.append("documents", file);
    });
  }

  return await vendorAPI.createVendor(data);
};

const updateVendorWithDocuments = async (id, formData, documentFiles) => {
  const data = new FormData();

  // Append all form data
  Object.keys(formData).forEach((key) => {
    if (
      formData[key] !== null &&
      formData[key] !== undefined &&
      formData[key] !== ""
    ) {
      data.append(key, formData[key]);
    }
  });

  // Append document files (only if new files are selected)
  if (documentFiles?.length > 0) {
    documentFiles.forEach((file) => {
      data.append("documents", file);
    });
  }

  return await vendorAPI.updateVendor(id, data);
};

export const driverAPI = {
  // Get all drivers
  getAllDrivers: async () => {
    try {
      const response = await api.get("/drivers");
      return response.data;
    } catch (error) {
      console.error("Error fetching drivers:", error);
      throw error.response?.data || error.message;
    }
  },

  // Get driver by ID
  getDriverById: async (driverId) => {
    try {
      const response = await api.get(`/drivers/${driverId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching driver details:", error);
      throw error.response?.data || error.message;
    }
  },

  // Create new driver
  createDriver: async (driverData) => {
    try {
      const response = await api.post("/drivers", driverData);
      return response.data;
    } catch (error) {
      console.error("Error creating driver:", error);
      throw error.response?.data || error.message;
    }
  },

  // Update driver
  updateDriver: async (driverId, driverData) => {
    try {
      const response = await api.put(`/drivers/${driverId}`, driverData);
      return response.data;
    } catch (error) {
      console.error("Error updating driver:", error);
      throw error.response?.data || error.message;
    }
  },

  // Delete driver
  deleteDriver: async (driverId) => {
    try {
      const response = await api.delete(`/drivers/${driverId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting driver:", error);
      throw error.response?.data || error.message;
    }
  },

  // Get drivers by vendor ID - Fixed route
  getDriversByVendorId: async (vendorId) => {
    try {
      const response = await api.get(`/drivers/vendor/${vendorId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching drivers by vendor ID:", error);
      throw error.response?.data || error.message;
    }
  },

  // Get vendors for dropdown - Add this method
  getVendors: async () => {
    try {
      const response = await api.get("/vendors"); // or "/drivers/vendors/list" if you prefer the other route
      return response.data;
    } catch (error) {
      console.error("Error fetching vendors:", error);
      throw error.response?.data || error.message;
    }
  },
};

export const equipmentAPI = {
  // Get all equipment
  getAllEquipment: async () => {
    try {
      const response = await api.get("/equipment");
      return response.data;
    } catch (error) {
      console.error("Error fetching equipment:", error);
      throw error.response?.data || error.message;
    }
  },

  // Get equipment by ID
  getEquipmentById: async (equipmentId) => {
    try {
      const response = await api.get(`/equipment/${equipmentId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching equipment details:", error);
      throw error.response?.data || error.message;
    }
  },

  // Create new equipment
  createEquipment: async (equipmentData) => {
    try {
      const response = await api.post("/equipment", equipmentData);
      return response.data;
    } catch (error) {
      console.error("Error creating equipment:", error);
      throw error.response?.data || error.message;
    }
  },

  // Update equipment
  updateEquipment: async (equipmentId, equipmentData) => {
    try {
      const response = await api.put(
        `/equipment/${equipmentId}`,
        equipmentData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating equipment:", error);
      throw error.response?.data || error.message;
    }
  },

  // Delete equipment
  deleteEquipment: async (equipmentId) => {
    try {
      const response = await api.delete(`/equipment/${equipmentId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting equipment:", error);
      throw error.response?.data || error.message;
    }
  },
};

export const vehicleAPI = {
  getAllvehicles: async () => {
    try {
      const response = await api.get("/vehicles");
      return response.data;
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      throw error.response?.data || error.message;
    }
  },
};
// Add these functions to your existing api.jsx file

export const asnAPI = {
  // Get all ASN records
  getAllASN: async () => {
    try {
      const response = await api.get("/asn");
      return response.data;
    } catch (error) {
      console.error("Error fetching ASN records:", error);
      throw error.response?.data || error.message;
    }
  },

  // Get ASN record by ID
  getASNById: async (asnId) => {
    try {
      const response = await api.get(`/asn/${asnId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching ASN record:", error);
      throw error.response?.data || error.message;
    }
  },

  // Update ASN record
  updateASN: async (asnId, asnData) => {
    try {
      const response = await api.put(`/asn/${asnId}`, asnData);
      return response.data;
    } catch (error) {
      console.error("Error updating ASN record:", error);
      throw error.response?.data || error.message;
    }
  },

  // Delete ASN record
  deleteASN: async (asnId) => {
    try {
      const response = await api.delete(`/asn/${asnId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting ASN record:", error);
      throw error.response?.data || error.message;
    }
  },

  // Create ASN record
  createASN: async (asnData) => {
    try {
      const response = await api.post("/asn", asnData);
      return response.data;
    } catch (error) {
      console.error("Error creating ASN record:", error);
      throw error.response?.data || error.message;
    }
  },

  // Create bulk ASN records
  createBulkASN: async (asnDataArray) => {
    try {
      const response = await api.post("/asn/bulk", { records: asnDataArray });
      return response.data;
    } catch (error) {
      console.error("Error creating bulk ASN records:", error);
      throw error.response?.data || error.message;
    }
  },
};
